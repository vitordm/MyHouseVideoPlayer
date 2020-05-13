import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinTable, OneToMany } from 'typeorm';
import VideoSubtitle from './VideoSubtitle';

@Entity()
export class VideoItem {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string = '';

    @Column()
    public path: string = '';

    @OneToMany(type => VideoSubtitle, vs => vs.videoItem)
    public subtitles: VideoSubtitle[]
}

export default VideoItem;