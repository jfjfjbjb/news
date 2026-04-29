import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { News, NewsChannel } from '../entities/news.entity';
import { CrawlerService } from '../crawler/crawler.service';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News)
    private readonly newsRepo: Repository<News>,
    private readonly crawlerService: CrawlerService,
  ) {}

  async findAll(channel?: NewsChannel): Promise<News[]> {
    const query = this.newsRepo
      .createQueryBuilder('news')
      .orderBy('news.createdAt', 'DESC')
      .limit(50);

    if (channel) {
      query.where('news.channel = :channel', { channel });
    }

    return query.getMany();
  }

  async findOne(id: number): Promise<News | null> {
    return this.newsRepo.findOne({ where: { id } });
  }

  async refreshNews(): Promise<{ crawled: number; saved: number }> {
    return this.crawlerService.refreshNews();
  }
}
