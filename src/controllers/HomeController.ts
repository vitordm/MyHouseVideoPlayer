import { Controller, Get, Render } from '@tsed/common';
import VideoItem from '../entities/VideoItem';
import { Repository, getRepository } from 'typeorm';


@Controller('/home')
export class HomeController {

    private readonly videItemRepository: Repository<VideoItem>;

    constructor() {
        this.videItemRepository = getRepository(VideoItem);
    }

    @Get('/')
    @Render('home/index.ejs')
    public async index() {
        const videos = await this.videItemRepository.find();
        return {
            videos
        };
    }
}