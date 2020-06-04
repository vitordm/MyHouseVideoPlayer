import { Controller, Get, Render, Post, Req, Redirect, BodyParams, Res, PathParams, Next } from '@tsed/common';
import { Response, Request, NextFunction } from 'express'
import { BadRequest, NotFound } from "@tsed/exceptions";
import { getRepository, Repository } from 'typeorm';
import * as fs from 'fs';
import { readdir, ensureDir, pathExists, readFile, readFileSync, stat } from 'fs-extra';

import { VideoItemRepository } from '../repositories/VideoItemRepository';
import VideoSubtitle from '../entities/VideoSubtitle';
import VideoItem from '../entities/VideoItem';
import { VideoSubtitleRepository } from '../repositories/VideoSubtitleRepository';
import { FileUtils } from '../utils/FileUtils';
import { appConfig } from '../config/config';

const path = require('path');
const srt2vtt = require('srt-to-vtt')


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
    private readonly videoSubtitleRepository: VideoSubtitleRepository;
    private readonly pathTmp: string;

    activeStremers: VideoOperation[] = [];

    constructor(
        videoItemRepository: VideoItemRepository,
        videoSubtitleRepository: VideoSubtitleRepository) {
        this.videoItemRepository = videoItemRepository;
        this.videoSubtitleRepository = videoSubtitleRepository;

        this.pathTmp = path.join(__dirname, '..', '..', 'public', 'tmp');
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

        const statPath = await stat(folderPath);

        if (statPath.isFile()) {
            return await this._saveFileRequest(folderPath);
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

            if (['mkv', 'mp4', 'rmvb', 'mpg', 'mpeg'].includes(extensionFile)) {
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

            for (let subtitle of subtitles) {
                subtitle.videoItem = video;
                await this.videoSubtitleRepository.save(subtitle);
            }

            this._takeScreenshotOfVideo(video);


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

        const videoImage = `${id}.png`
        const pathImage = path.join(this.pathTmp, videoImage);
        if (await pathExists(pathImage)) {
            fs.unlink(pathImage, (err) => {
                if (err) {
                    console.error(err);
                }
            });
        }


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
                //console.log(data);
                console.log("End read!");
                res.send(data);
                next();
            });

    }

    private async _saveFileRequest(filePath: string) {
        const extensionFile = FileUtils.getExtensionFromName(filePath);
        if (!extensionFile)
            throw new BadRequest("Error on get extension of file!");

        const file = filePath.split(path.sep).pop();
        if (!file)
            throw new BadRequest("Error on get extension of file!");

        let video: VideoItem;
        if (!['mkv', 'mp4', 'rmvb', 'mpg', 'mpeg'].includes(extensionFile)) {
            throw new BadRequest("Extension not supported!");
        }

        video = new VideoItem();
        video.name = file;
        video.path = filePath;
        const videoInsert = await this.videoItemRepository.save(video);
        this._takeScreenshotOfVideo(video);

        return 'Success!';
    }

    private _takeScreenshotOfVideo(video: VideoItem) {
        try {
            if (appConfig.use_ffmpeg) {


                const ffmpeg = require('fluent-ffmpeg');
                const command = new ffmpeg(video.path);
                const videoPhoto = `${video.id}.png`;
                command.on('end', () => {
                    console.log('Screenshots taken');
                })
                    .on('error', (err: any) => {
                        console.error(err);
                    })
                    .seek('0:40')
                    .screenshot({
                        count: 1,
                        folder: this.pathTmp,
                        filename: videoPhoto,

                    });

            }
        } catch (error) {
            console.error(error);
        }

    }
}