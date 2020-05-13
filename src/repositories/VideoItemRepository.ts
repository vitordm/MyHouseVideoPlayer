import { Repository } from 'typeorm';
import { EntityRepository } from "@tsed/typeorm";
import VideoItem from '../entities/VideoItem';

/**
 * I found a bug with TS.ED :(
 */

@EntityRepository(VideoItem)
export class VideoItemRepository extends Repository<VideoItem> {

}