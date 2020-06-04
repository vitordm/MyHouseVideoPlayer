import { Controller, Get, Render } from '@tsed/common';
import VideoItem from '../entities/VideoItem';
import { Repository, getRepository } from 'typeorm';
import { pathExistsSync } from 'fs-extra';
import { VideoItemRepository } from '../repositories/VideoItemRepository';

const path = require('path');

@Controller('/home')
export class HomeController {
    private readonly videItemRepository: VideoItemRepository;
    private readonly pathTmp: string;

    constructor(videoItemRepository: VideoItemRepository) {
        this.videItemRepository = videoItemRepository;
        this.pathTmp = path.join(__dirname, '..', '..', 'public', 'tmp');
    }

    @Get('/')
    @Render('home/index.ejs')
    public async index() {
        const findImage = (videoId: number) => {
            const videoImage = `${videoId}.png`
            const pathImage = path.join(this.pathTmp, videoImage);
            if (pathExistsSync(pathImage)) {
                return `/tmp/${videoImage}`;
            }
            return '/assets/libs/img/flat-clapperboard-icon_1063-38.jpg';
        };

        const videos = await this.videItemRepository.find();
        return {
            videos, findImage
        };
    }
}