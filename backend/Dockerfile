# 使用 Node.js 20 基础镜像
FROM node:20

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建 NestJS 应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动生产服务
CMD ["npm", "run", "start:prod"]