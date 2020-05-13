import { Controller, Get, Render, Post, Req, Redirect, BodyParams, Res, PathParams, Next } from '@tsed/common';
import { BadRequest, NotFound } from "@tsed/exceptions";
import { VideoItemRepository } from '../repositories/VideoItemRepository';
import { Response, Request, NextFunction } from 'express'
import { readdir, ensureDir, pathExists, readFile, readFileSync } from 'fs-extra';
import VideoSubtitle from '../entities/VideoSubtitle';
import VideoItem from '../entities/VideoItem';
import { VideoSubtitleRepository } from '../repositories/VideoSubtitleRepository';
import { getRepository, Repository } from 'typeorm';
import * as fs from 'fs';
import { FileUtils } from '../utils/FileUtils';

const srt2vtt = require('srt-to-vtt')

const path = require('path');


interface SaveRequest {
    path: string
}

interface VideoOperation {
    id: number,
    path: string,
    file: string,
    lastCall: Date
}

@Controller('/video')
export class VideoController {

    private readonly videoItemRepository: Repository<VideoItem>;
    private readonly videoSubtitleRepository: Repository<VideoSubtitle>;

    activeStremers: VideoOperation[] = [];


    constructor() {
        this.videoItemRepository = getRepository(VideoItem);
        this.videoSubtitleRepository = getRepository(VideoSubtitle);
    }

    @Get('/add')
    @Render('videos/add.ejs')
    public add() {

    }


    @Post('/save')
    public async save(@BodyParams() saveRequest: SaveRequest, @Req() req: any, @Res() response: Response) {

        const folderPath = saveRequest.path;

        const existsPath = await pathExists(folderPath);

        if (!existsPath) {
            throw new BadRequest("Folder does not exists!");
        }

        const read = await readdir(folderPath);

        let video: VideoItem | undefined;
        const subtitles: VideoSubtitle[] = [];

        for (let file of read) {
            const extensionFile = FileUtils.getExtensionFromName(file);
            if (!extensionFile)
                continue;

            if (['zip', 'rar', '7z'].includes(extensionFile)) {
                continue
            }

            let fullFilename = path.join(folderPath, file);

            if (extensionFile == 'srt') {

                const srtFile = file;
                const srtFullFileName = fullFilename;

                file = `${file}.vtt`;
                fullFilename = `${fullFilename}.vtt`;

                fs.createReadStream(srtFullFileName)
                    .pipe(srt2vtt())
                    .pipe(fs.createWriteStream(fullFilename));

                const videoSubtitle = new VideoSubtitle();
                videoSubtitle.name = file;
                videoSubtitle.path = fullFilename;


                subtitles.push(videoSubtitle);
                continue;
            }

            if (['mkv', 'mp4', 'avi', 'rmvb', 'mpg', 'mpeg'].includes(extensionFile)) {
                video = new VideoItem();
                video.name = file;
                video.path = fullFilename;
            }
        }

        if (!video) {
            throw new BadRequest("There's no video found!");
        }


        try {
            video.subtitles = subtitles;
            const videoInsert = await this.videoItemRepository.save(video);
            console.log(videoInsert);
            console.log(video);

            for (let subtitle of subtitles) {
                subtitle.videoItem = video;
                console.log(subtitle);
                await this.videoSubtitleRepository.save(subtitle);
            }
        } catch (error) {
            console.error(error);
            throw error;
        }



        return 'Success!';
    }

    @Post('/delete')
    public async delete(@BodyParams() request: any) {
        const id = request.id;

        const videoItem = await this.videoItemRepository.findOne(id);
        if (!videoItem) {
            throw new BadRequest("Video not found!");
        }

        await this.videoSubtitleRepository.createQueryBuilder()
            .delete()
            .where('videoItemId = :videoItemId', { videoItemId: videoItem.id })
            .execute();
        await this.videoItemRepository.delete(videoItem);
        return 'Success!';

    }

    @Get('/:id')
    @Render('videos/show.ejs')
    public async show(@PathParams("id") id: number) {
        const video = await this.videoItemRepository.findOne(id, { relations: ["subtitles"] });
        return { video };
    }

    @Get('/stream/:id')
    public async stream(@PathParams("id") id: number, @Req() req: Request, @Res() res: Response) {


        const now = new Date();
        now.setHours(0);
        now.setMinutes(0);
        now.setSeconds(0);

        this.activeStremers = this.activeStremers.filter(as => as.lastCall < now);

        let videoOperation = this.activeStremers.find(as => as.id == id);
        if (!videoOperation) {
            const videoItem = await this.videoItemRepository.findOne(id);
            if (!videoItem) {
                throw new NotFound("Video not found!");
            }

            videoOperation = {
                id,
                file: videoItem.name,
                path: videoItem.path,
                lastCall: now
            }
            this.activeStremers.push(videoOperation);
        }

        //const path = "C:\\Users\\Vitor\\Videos\\COMANDOTORRENTS.ORG - Doutor Sono 2020 [720p] [DUAL]\\Doutor.Sono.2020.720p.WEB-DL.6CH.x264.DUAL.mkv";
        const path = videoOperation.path;

        const stat = fs.statSync(path)
        const fileSize = stat.size
        const range = req.headers.range

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-")
            const start = parseInt(parts[0], 10)
            const end = parts[1]
                ? parseInt(parts[1], 10)
                : fileSize - 1

            if (start >= fileSize) {
                res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + fileSize);
                return
            }

            const chunksize = (end - start) + 1
            const file = fs.createReadStream(path, { start, end })
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mkv',
            }

            res.writeHead(206, head)
            file.pipe(res)
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mkv',
            }
            res.writeHead(200, head)
            fs.createReadStream(path).pipe(res)
        }
    }

    @Get('/subtitle/:id')
    public async subtitle(@PathParams("id") id: number, @Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
        const subtitle = await this.videoSubtitleRepository.findOne(id);
        if (!subtitle) {
            throw new NotFound("Object not found!");
        }

        const pathExist = await pathExists(subtitle.path);
        if (!pathExist) {
            throw new NotFound("Object not found!");
        }

        const fileName = subtitle.name;
        const extension = FileUtils.getExtensionFromName(fileName);
        const fullFilename = subtitle.path;


        const readStream = fs.createReadStream(fullFilename, 'utf8');
        let data = ''

        readStream
            .on('data', function (chunk) {
                data += chunk;
            })
            .on('end', function () {
                console.log(data);
                console.log("End read!");
                res.send(data);
                next();
            });

    }
}