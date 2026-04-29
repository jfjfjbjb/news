import { defineStore } from 'pinia';
import { getNews, refreshNews, type NewsItem } from '../services/api';

interface NewsState {
  aiNews: NewsItem[];
  frontendNews: NewsItem[];
  loading: boolean;
  updatedAt: Date | null;
}

export const useNewsStore = defineStore('news', {
  state: (): NewsState => ({
    aiNews: [],
    frontendNews: [],
    loading: false,
    updatedAt: null,
  }),

  actions: {
    async fetchNews() {
      this.loading = true;
      try {
        const [aiRes, frontendRes] = await Promise.all([
          getNews('AI'),
          getNews('frontend'),
        ]);
        this.aiNews = aiRes.data.data;
        this.frontendNews = frontendRes.data.data;
      } catch (error) {
        console.error('Failed to fetch news:', error);
      } finally {
        this.loading = false;
      }
    },

    async doRefresh() {
      this.loading = true;
      try {
        await refreshNews();
        await this.fetchNews();
      } catch (error) {
        console.error('Failed to refresh news:', error);
      } finally {
        this.loading = false;
      }
    },
  },
});
