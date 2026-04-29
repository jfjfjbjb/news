import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { News } from '../entities/news.entity';
import { NewsSource } from '../entities/news_source.entity';
import { CrawlerService } from './crawler.service';
import { CrawlerScheduler } from './crawler.scheduler';
import { SourcesModule } from '../sources/sources.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([News, NewsSource]),
    SourcesModule,
    AiModule,
  ],
  providers: [CrawlerService, CrawlerScheduler],
  exports: [CrawlerService],
})
export class CrawlerModule {}
