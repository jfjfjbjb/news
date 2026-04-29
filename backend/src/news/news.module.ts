import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { News } from '../entities/news.entity';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { CrawlerModule } from '../crawler/crawler.module';

@Module({
  imports: [TypeOrmModule.forFeature([News]), CrawlerModule],
  controllers: [NewsController],
  providers: [NewsService],
  exports: [NewsService],
})
export class NewsModule {}
