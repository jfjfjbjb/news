import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NewsModule } from './news/news.module';
import { SourcesModule } from './sources/sources.module';
import { CrawlerModule } from './crawler/crawler.module';

interface DbConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
}

function getDbConfig(): DbConfig {
  // Railway provides DATABASE_URL in format:
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    try {
      const url = new URL(databaseUrl);
      return {
        host: url.hostname,
        port: parseInt(url.port || '5432', 10),
        username: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.slice(1),
        ssl: { rejectUnauthorized: false }, // Railway 需要
      };
    } catch (error) {
      console.error('Failed to parse DATABASE_URL:', error.message);
    }
  }

  // 降级到独立环境变量（本地开发）
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'news',
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
  };
}

// 使用前可以验证必要字段
export const dbConfig = getDbConfig();

// 可选：验证配置有效性
if (!dbConfig.host || !dbConfig.username || !dbConfig.database) {
  throw new Error('Invalid database configuration: missing required fields');
}

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: dbConfig.host,
      port: dbConfig.port,
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      autoLoadEntities: true,
    }),
    ScheduleModule.forRoot(),
    NewsModule,
    SourcesModule,
    CrawlerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
