import { Repository } from 'typeorm';
import { EntityRepository } from "@tsed/typeorm";
import VideoSubtitle from '../entities/VideoSubtitle';

/**
 * I found a bug with TS.ED :(
 */

@EntityRepository(VideoSubtitle)
export class VideoSubtitleRepository extends Repository<VideoSubtitle> {
}