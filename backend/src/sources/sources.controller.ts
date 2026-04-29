import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { SourcesService } from './sources.service';
import { NewsSource } from '../entities/news_source.entity';

@Controller('api/sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get()
  findAll(): Promise<NewsSource[]> {
    return this.sourcesService.findAll();
  }

  @Post()
  create(@Body() data: Partial<NewsSource>): Promise<NewsSource> {
    return this.sourcesService.create(data);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<NewsSource>,
  ): Promise<NewsSource | null> {
    return this.sourcesService.update(id, data);
  }
}
