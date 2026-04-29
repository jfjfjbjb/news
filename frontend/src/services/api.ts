import axios from 'axios';

const api = axios.create({
  // baseURL: 'http://localhost:3000',
  baseURL: 'https://news-production-a18d.up.railway.app',
  timeout: 60000,
});

export interface NewsItem {
  id: number;
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  channel: 'AI' | 'frontend';
  publishedAt: string;
  createdAt: string;
}

export interface NewsResponse {
  code: number;
  data: NewsItem[];
  channel: string;
}

export interface RefreshResponse {
  code: number;
  message: string;
  data: { crawled: number; saved: number };
}

export const getNews = (channel?: 'AI' | 'frontend') => {
  return api.get<NewsResponse>('/api/news', { params: { channel } });
};

export const refreshNews = () => {
  return api.post<RefreshResponse>('/api/news/refresh');
};
