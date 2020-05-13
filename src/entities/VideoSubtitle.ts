import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import VideoItem from './VideoItem';

@Entity({
    name: 'video_subtitle'
})
export class VideoSubtitle {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string = '';

    @Column()
    public path: string = '';

    @ManyToOne(type => VideoItem, vs => vs.subtitles)
    public videoItem: VideoItem;
}

export default VideoSubtitle;