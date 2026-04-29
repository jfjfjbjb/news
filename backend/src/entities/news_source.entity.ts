import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum SourceType {
  RSS = 'RSS',
  HTML = 'HTML',
}

@Entity('news_source')
export class NewsSource {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 1000 })
  url: string;

  @Column({ type: 'enum', enum: SourceType, default: SourceType.RSS })
  type: SourceType;

  @Column({ default: true })
  enabled: boolean;
}
