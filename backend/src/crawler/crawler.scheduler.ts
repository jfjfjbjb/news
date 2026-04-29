import { Injectable, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CrawlerService } from './crawler.service';
import { SourcesService } from '../sources/sources.service';

@Injectable()
export class CrawlerScheduler implements OnModuleInit {
  constructor(
    private readonly crawlerService: CrawlerService,
    private readonly sourcesService: SourcesService,
    private readonly scheduler: SchedulerRegistry,
  ) {}

  async onModuleInit() {
    await this.sourcesService.seedDefaultSources();

    const interval = setInterval(
      () => {
        this.crawlerService.refreshNews();
      },
      60 * 60 * 1000,
    );

    this.scheduler.addInterval('crawler-interval', interval);

    setTimeout(() => {
      this.crawlerService.refreshNews();
    }, 3000);
  }
}
