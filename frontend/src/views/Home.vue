<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useNewsStore } from '../stores/news'

const newsStore = useNewsStore()
const activeTab = ref('AI')
const refreshLoading = ref(false)

const sourcePalette = [
  '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12',
  '#1abc9c', '#e67e22', '#34495e', '#d35400', '#2980b9',
  '#c0392b', '#27ae60', '#8e44ad', '#16a085', '#f1c40f',
]

function getSourceColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return sourcePalette[Math.abs(hash) % sourcePalette.length]
}

function openUrl(url: string) {
  window.open(url, '_blank')
}

function relativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  if (diff < 604800) return `${Math.floor(diff / 86400)}天前`
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const currentNews = computed(() =>
  activeTab.value === 'AI' ? newsStore.aiNews : newsStore.frontendNews
)

const aiCount = computed(() => newsStore.aiNews.length)
const frontendCount = computed(() => newsStore.frontendNews.length)

async function handleRefresh() {
  refreshLoading.value = true
  try {
    await newsStore.doRefresh()
  } finally {
    refreshLoading.value = false
  }
}

onMounted(() => {
  newsStore.fetchNews()
})
</script>

<template>
  <header class="header">
    <div class="container header-inner">
      <div class="logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 11a9 9 0 0 1 9 9" />
          <path d="M4 4a16 16 0 0 1 16 16" />
          <circle cx="5" cy="19" r="1" />
        </svg>
        <span>技术新闻</span>
      </div>
      <button
        class="refresh-btn"
        :class="{ loading: refreshLoading || newsStore.loading }"
        @click="handleRefresh"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
          <path d="M16 16h5v5" />
        </svg>
        <span>刷新</span>
      </button>
    </div>
  </header>

  <main class="container main-content">
    <nav class="tabs">
      <button
        class="tab"
        :class="{ active: activeTab === 'AI' }"
        @click="activeTab = 'AI'"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2a8 8 0 0 1 8 8c0 2.5-1.5 5-3 6.5V18a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-1.5C5.5 15 4 12.5 4 10a8 8 0 0 1 8-8z" />
          <path d="M9 22h6" />
          <path d="M12 18v4" />
        </svg>
        AI 频道 <span class="tab-count">{{ aiCount }}</span>
      </button>
      <button
        class="tab"
        :class="{ active: activeTab === 'frontend' }"
        @click="activeTab = 'frontend'"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
        前端频道 <span class="tab-count">{{ frontendCount }}</span>
      </button>
    </nav>

    <section
      v-for="channel in ['AI', 'frontend']"
      :key="channel"
      class="news-list"
      :class="{ active: activeTab === channel }"
    >
      <div v-if="newsStore.loading && currentNews.length === 0" class="loading-state">
        <div class="spinner" />
        <span>加载中...</span>
      </div>

      <template v-else-if="currentNews.length > 0">
        <article
          v-for="item in currentNews"
          :key="item.id"
          class="news-card"
          @click="openUrl(item.sourceUrl)"
        >
          <div class="card-header">
            <span class="card-source">
              <span class="source-dot" :style="{ background: getSourceColor(item.sourceName) }" />
              {{ item.sourceName }}
            </span>
            <span class="card-time">{{ relativeTime(item.publishedAt) }}</span>
          </div>
          <h2 class="card-title">
            <a :href="item.sourceUrl" target="_blank" @click.stop>{{ item.title }}</a>
          </h2>
          <p class="card-summary">{{ item.summary }}</p>
        </article>
      </template>

      <div v-else class="empty-state">
        暂无新闻，请点击刷新按钮获取
      </div>
    </section>
  </main>

  <footer class="container footer">
    <p>技术新闻聚合 · 2026</p>
  </footer>
</template>

<style scoped>
/* ============ Header ============ */
.header {
  background: #fff;
  border-bottom: 1px solid #eee;
  padding: 14px 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.container {
  max-width: 860px;
  margin: 0 auto;
  padding: 0 24px;
  width: 100%;
}

.header-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 17px;
  font-weight: 600;
  color: #1a1a2e;
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo svg {
  width: 18px;
  height: 18px;
  color: #555;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 13px;
  background: #1a1a2e;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.refresh-btn:hover {
  background: #2d2d44;
}

.refresh-btn.loading {
  opacity: 0.7;
}

.refresh-btn svg {
  width: 14px;
  height: 14px;
}

.refresh-btn.loading svg {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ============ Main ============ */
.main-content {
  flex: 1;
  padding: 24px;
}

/* ============ Tabs ============ */
.tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
}

.tab {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 13px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.tab:hover {
  border-color: #1a1a2e;
  color: #1a1a2e;
}

.tab.active {
  background: #1a1a2e;
  color: #fff;
  border-color: #1a1a2e;
}

.tab-count {
  opacity: 0.55;
  font-size: 12px;
}

.tab.active .tab-count {
  opacity: 0.75;
}

/* ============ News List ============ */
.news-list {
  display: none;
  flex-direction: column;
  gap: 8px;
}

.news-list.active {
  display: flex;
}

.news-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 14px 18px;
  transition: box-shadow 0.2s, border-color 0.2s, transform 0.2s;
}

.news-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #ccc;
  transform: translateY(-1px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.card-source {
  font-size: 11px;
  font-weight: 600;
  color: #1a1a2e;
  letter-spacing: 0.3px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.source-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.card-time {
  font-size: 11px;
  color: #999;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.45;
  margin-bottom: 5px;
}

.card-title a {
  color: #1a1a2e;
  text-decoration: none;
  transition: color 0.15s;
}

.card-title a:hover {
  color: #555;
}

.card-summary {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ============ States ============ */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 20px;
  color: #999;
  font-size: 14px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e5e7eb;
  border-top-color: #1a1a2e;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 14px;
}

/* ============ Footer ============ */
.footer {
  margin: 24px auto;
  text-align: center;
  color: #ccc;
  font-size: 12px;
}
</style>
