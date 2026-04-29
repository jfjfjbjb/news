import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsChannel } from '../entities/news.entity';

@Controller('api/news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  async getNews(@Query('channel') channel?: NewsChannel) {
    const news = await this.newsService.findAll(channel);
    return {
      code: 0,
      data: news,
      channel: channel || 'all',
    };
  }

  @Get(':id')
  async getNewsDetail(@Param('id', ParseIntPipe) id: number) {
    const news = await this.newsService.findOne(id);
    return {
      code: 0,
      data: news,
    };
  }

  @Post('refresh')
  async refreshNews() {
    const result = await this.newsService.refreshNews();
    return {
      code: 0,
      message: '刷新成功',
      data: result,
    };
  }
}
