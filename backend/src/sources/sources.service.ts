import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsSource, SourceType } from '../entities/news_source.entity';

@Injectable()
export class SourcesService {
  constructor(
    @InjectRepository(NewsSource)
    private readonly sourceRepo: Repository<NewsSource>,
  ) {}

  findAll(): Promise<NewsSource[]> {
    return this.sourceRepo.find();
  }

  findEnabled(): Promise<NewsSource[]> {
    return this.sourceRepo.find({ where: { enabled: true } });
  }

  async create(data: Partial<NewsSource>): Promise<NewsSource> {
    const source = this.sourceRepo.create(data);
    return this.sourceRepo.save(source);
  }

  async update(id: number, data: Partial<NewsSource>): Promise<NewsSource | null> {
    await this.sourceRepo.update(id, data);
    return this.sourceRepo.findOne({ where: { id } });
  }

  async seedDefaultSources(): Promise<void> {
    const count = await this.sourceRepo.count();
    if (count > 0) return;

    const defaultSources: Partial<NewsSource>[] = [
      { name: '36氪', url: 'https://36kr.com/feed', type: SourceType.RSS },
      { name: '掘金', url: 'https://juejin.cn/rss', type: SourceType.RSS },
      { name: '阮一峰的网络日志', url: 'https://www.ruanyifeng.com/blog/atom.xml', type: SourceType.RSS },
    ];

    for (const source of defaultSources) {
      await this.create(source);
    }
  }
}
