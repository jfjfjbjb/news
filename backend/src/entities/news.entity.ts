import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum NewsChannel {
  AI = 'AI',
  FRONTEND = 'frontend',
}

@Entity('news')
export class News {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ name: 'source_url', length: 1000 })
  sourceUrl: string;

  @Column({ name: 'source_name', length: 100 })
  sourceName: string;

  @Column({ type: 'enum', enum: NewsChannel, default: NewsChannel.AI })
  channel: NewsChannel;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
