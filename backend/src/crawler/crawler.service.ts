import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as cheerio from 'cheerio';
import { News, NewsChannel } from '../entities/news.entity';
import { NewsSource, SourceType } from '../entities/news_source.entity';
import { SourcesService } from '../sources/sources.service';
import { AiService } from '../ai/ai.service';

interface RawNews {
  title: string;
  summary: string;
  url: string;
  sourceName: string;
  publishedAt: Date | null;
}

@Injectable()
export class CrawlerService {
  constructor(
    @InjectRepository(News)
    private readonly newsRepo: Repository<News>,
    @InjectRepository(NewsSource)
    private readonly sourceRepo: Repository<NewsSource>,
    private readonly sourcesService: SourcesService,
    private readonly aiService: AiService,
  ) {}

  async crawlAllSources(): Promise<{ crawled: number; saved: number }> {
    const sources = await this.sourcesService.findEnabled();
    let totalCrawled = 0;
    let totalSaved = 0;

    for (const source of sources) {
      try {
        const news = await this.crawlSource(source);
        totalCrawled += news.length;

        for (const item of news) {
          const saved = await this.saveNewsWithDedup(item);
          if (saved) totalSaved++;
        }
      } catch (error) {
        console.error(`Failed to crawl ${source.name}:`, error);
      }
    }

    return { crawled: totalCrawled, saved: totalSaved };
  }

  private async crawlSource(source: NewsSource): Promise<RawNews[]> {
    if (source.type === SourceType.RSS) {
      return this.crawlRss(source);
    } else {
      return this.crawlHtml(source);
    }
  }

  private async crawlRss(source: NewsSource): Promise<RawNews[]> {
    try {
      const response = await fetch(source.url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      const xml = await response.text();

      const news: RawNews[] = [];
      const items = xml.match(/<item>([\s\S]*?)<\/item>/gi) || [];

      for (const item of items.slice(0, 20)) {
        const title = this.extractXmlValue(item, 'title');
        const link = this.extractXmlValue(item, 'link');
        const description = this.extractXmlValue(item, 'description');
        const pubDate = this.extractXmlValue(item, 'pubDate');

        if (title && link) {
          news.push({
            title: this.cleanHtml(title),
            summary: this.cleanHtml(description || '').slice(0, 500),
            url: link,
            sourceName: source.name,
            publishedAt: pubDate ? new Date(pubDate) : null,
          });
        }
      }

      return news;
    } catch (error) {
      console.error(`RSS crawl error for ${source.name}:`, error);
      return [];
    }
  }

  private async crawlHtml(source: NewsSource): Promise<RawNews[]> {
    try {
      const response = await fetch(source.url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      const html = await response.text();
      const $ = cheerio.load(html);
      const news: RawNews[] = [];

      $('article, .post, .item, .news-item')
        .slice(0, 20)
        .each((_, el) => {
          const title = $(el).find('h2, h3, .title').first().text().trim();
          const link = $(el).find('a').first().attr('href') || '';
          const summary = $(el)
            .find('p, .summary, .excerpt')
            .first()
            .text()
            .trim();

          if (title && link) {
            news.push({
              title,
              summary: summary.slice(0, 500),
              url: link.startsWith('http')
                ? link
                : new URL(link, source.url).href,
              sourceName: source.name,
              publishedAt: null,
            });
          }
        });

      return news;
    } catch (error) {
      console.error(`HTML crawl error for ${source.name}:`, error);
      return [];
    }
  }

  private extractXmlValue(xml: string, tag: string): string {
    const match = xml.match(
      new RegExp(
        `<${tag}[^>]*><!\\[CDATA\\[([^\\]]*?)\\]\\]></${tag}>|<${tag}[^>]*>([^<]*)</${tag}>`,
        'i',
      ),
    );
    return match ? (match[1] || match[2] || '').trim() : '';
  }

  private cleanHtml(text: string): string {
    return text
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .trim();
  }

  private readonly AI_KEYWORDS = [
    'ai', '人工智能', '机器学习', '深度学习', 'llm', '大模型',
    'gpt', 'chatgpt', '神经网络', 'openai', 'claude', 'gemini',
    '文心一言', '通义千问', 'kimi', '智谱', 'copilot', 'aigc',
    '生成式ai', '生成式人工智能', 'large language model',
  ];

  private readonly FRONTEND_KEYWORDS = [
    'javascript', 'typescript', 'react', 'vue', 'angular', 'svelte',
    'css', 'html', '前端', 'frontend', 'web', 'node.js', 'nodejs',
    'webpack', 'vite', 'tailwind', 'sass', 'less', 'jquery',
    'next.js', 'nuxt', 'remix', 'astro', 'deno', 'bun',
  ];

  private isRelevantNews(title: string, summary: string): boolean {
    const text = (title + ' ' + summary).toLowerCase();
    const isAi = this.AI_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
    const isFrontend = this.FRONTEND_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
    return isAi || isFrontend;
  }

  private async saveNewsWithDedup(item: RawNews): Promise<boolean> {
    if (!this.isRelevantNews(item.title, item.summary)) {
      return false;
    }

    const exists = await this.newsRepo.findOne({
      where: { sourceUrl: item.url },
    });
    if (exists) return false;

    const text = (item.title + ' ' + item.summary).toLowerCase();
    const isFrontend = this.FRONTEND_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
    const channel = isFrontend ? NewsChannel.FRONTEND : NewsChannel.AI;

    const news = this.newsRepo.create({
      title: item.title,
      summary: item.summary,
      sourceUrl: item.url,
      sourceName: item.sourceName,
      publishedAt: item.publishedAt,
      channel,
    });

    await this.newsRepo.save(news);
    return true;
  }

  private async classifyWithAi(
    title: string,
    summary: string,
  ): Promise<NewsChannel> {
    try {
      const result = await this.aiService.classifyNews(title, summary);
      return result === 'AI' ? NewsChannel.AI : NewsChannel.FRONTEND;
    } catch {
      return NewsChannel.AI;
    }
  }

  async refreshNews(): Promise<{ crawled: number; saved: number }> {
    return this.crawlAllSources();
  }
}
