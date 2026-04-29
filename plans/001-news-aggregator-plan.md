# 技术新闻聚合项目计划

## Context

设计一个技术新闻聚合平台，用于收集和展示最新技术新闻。主要包含AI和frontend技术两个频道，利用AI服务（MiniMax、DeepSeek）获取和分类新闻。

项目分两个版本迭代：**V1快速上线** → **V2功能扩展**

---

## 技术架构

### Frontend
- **框架**: Vue 3 + Vite + TypeScript
- **UI库**: Element Plus
- **HTTP客户端**: Axios
- **路由**: Vue Router
- **状态管理**: Pinia

### 后端 (Backend)
- **框架**: NestJS (Node.js)
- **数据库**: PostgreSQL (V2)
- **AI服务**: MiniMax API + DeepSeek API

---

## 版本规划

### V1: AI直接搜索新闻 (快速上线)

**核心理念**: 用AI搜索替代爬虫，直接让AI从海量信息中提取热门新闻

#### 功能
- 首页直接展示AI频道、frontend频道各20条热门新闻
- 无分页，纯展示
- 点击跳转原文
- 手动刷新按钮

#### 流程
```
frontend请求 → 后端 → AI服务(MiniMax/DeepSeek) → 返回新闻列表 → frontend展示
```

#### AI Prompt设计
```
请从以下分类中返回最新20条最热门的技术新闻，每条包含：
- 标题
- 简介
- 原文链接
- 来源网站
- 发布时间

分类：AI、frontend技术

请以JSON格式返回：
[
  {
    "title": "标题",
    "summary": "简介",
    "url": "链接",
    "source": "来源",
    "publishedAt": "时间"
  }
]
```

#### 项目结构 (V1 - 轻量)
```
nestjs-backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── news/
│   │   ├── news.controller.ts
│   │   └── news.service.ts
│   └── ai/
│       ├── ai.module.ts
│       ├── ai.service.ts
│       ├── minimax.provider.ts
│       └── deepseek.provider.ts

vue-frontend/
├── src/
│   ├── views/
│   │   ├── Home.vue (展示两个频道)
│   │   └── NewsDetail.vue (跳转原文)
│   └── services/
│       └── api.ts
```

#### API设计 (V1)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/news?channel=ai | 获取AI频道新闻 |
| GET | /api/news?channel=frontend | 获取前端频道新闻 |
| POST | /api/news/refresh | 手动刷新新闻 |

---

### V2: 爬虫 + AI分类 + 数据库 + 用户系统

**核心理念**: 爬取真实新闻源，AI只做分类判断，增加用户功能

#### 权限设计
- **公开**: 所有用户可查看新闻列表和详情，无需登录
- **收藏**: 点击收藏按钮 → 弹出注册/登录弹窗 → 登录后可收藏

---

#### 新增功能
- 爬取最新100条新闻存入数据库
- AI判断每条新闻属于哪个频道
- 用户注册/登录（用户名 + 密码）
- 收藏新闻功能
- 收藏列表页

#### 数据库设计

**news表**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 主键 |
| title | varchar(500) | 标题 |
| summary | text | 简介 |
| content | text | 完整内容 |
| source_url | varchar(1000) | 来源链接 |
| source_name | varchar(100) | 来源名称 |
| channel | enum | AI/前端 |
| published_at | datetime | 发布时间 |
| created_at | datetime | 创建时间 |

**news_source表**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 主键 |
| name | varchar(100) | 源名称 |
| url | varchar(1000) | 源地址 |
| type | enum | RSS/HTML |
| enabled | boolean | 是否启用 |

**user表**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 主键 |
| username | varchar(50) | 用户名(唯一) |
| password | varchar(255) | 密码(bcrypt加密) |
| created_at | datetime | 注册时间 |

**favorite表**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 主键 |
| user_id | int | 用户ID(FK) |
| news_id | int | 新闻ID(FK) |
| created_at | datetime | 收藏时间 |

#### 爬虫流程
```
定时任务 → 爬取新闻源 → 存入临时列表 → AI批量分类 → 入库
```

#### AI分类Prompt
```
判断以下新闻属于哪个分类（AI或前端技术）：

标题：{title}
内容：{summary}

只返回：AI 或 前端
```

#### 项目结构 (V2 - 完整)
```
nestjs-backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── news/           (新闻CRUD)
│   ├── sources/        (新闻源管理)
│   ├── crawler/        (爬虫模块)
│   ├── ai/             (AI服务)
│   ├── user/           (用户模块)
│   ├── favorite/       (收藏模块)
│   └── auth/           (认证模块)

vue-frontend/
├── src/
│   ├── views/
│   │   ├── Home.vue
│   │   ├── NewsList.vue
│   │   ├── NewsDetail.vue
│   │   ├── Login.vue
│   │   ├── Register.vue
│   │   └── Favorites.vue
│   ├── stores/         (Pinia状态管理)
│   └── services/       (API调用)
```

#### API设计 (V2)
**新闻**
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/news | 获取新闻列表 |
| GET | /api/news/:id | 获取详情 |
| POST | /api/news/refresh | 手动触发爬取 |

**用户认证**
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户名密码注册 |
| POST | /api/auth/login | 用户名密码登录 |
| GET | /api/auth/me | 获取当前用户信息 |

**收藏**
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/favorites | 获取收藏列表(需登录) |
| POST | /api/favorites/:newsId | 添加收藏(需登录) |
| DELETE | /api/favorites/:newsId | 取消收藏(需登录) |

---

## 实施步骤

### V1 实施 (3-4天)
1. **后端**: 初始化NestJS → AI服务封装 → 新闻接口
2. **前端**: 初始化Vue3 → 首页展示 → 频道切换
3. **调试**: 验证AI返回质量，调整Prompt

### V2 实施 (5-7天)
1. **数据库**: PostgreSQL配置 → 实体创建
2. **爬虫**: RSS解析 → HTML爬取 → 定时任务
3. **AI分类**: 批量分类逻辑 → 去重处理
4. **用户系统**: 注册登录 → JWT认证
5. **收藏功能**: 前后端联调
6. **部署**: Linux部署配置

---

## 验证方式

**V1验证**:
- 启动前后端，访问首页
- 两个频道各显示20条新闻
- 点击新闻跳转原文

**V2验证**:
- 数据库有100条新闻
- 新闻正确分类到AI/前端频道
- 用户可以注册登录并收藏新闻