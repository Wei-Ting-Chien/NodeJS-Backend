# 使用 Node.js 18 作為基礎映像
FROM node:18-alpine

# 安裝 curl 用於健康檢查
RUN apk add --no-cache curl

# 設定工作目錄
WORKDIR /usr/src/app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

RUN echo '#!/bin/sh\n\
    echo "Waiting for database to be ready..."\n\
    sleep 10\n\
    echo "Initializing database..."\n\
    npm run init-db\n\
    echo "Starting application..."\n\
    npm start' > /usr/src/app/start.sh && chmod +x /usr/src/app/start.sh
# 啟用正式環境、沒有測試的話用這行
# RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# 啟用開發環境、要跑測試的話用這行
RUN npm ci --ignore-scripts && npm cache clean --force

# 複製應用程式程式碼
COPY . .

# 創建非 root 使用者
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 變更檔案擁有者
RUN chown -R nodejs:nodejs /usr/src/app
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# 啟動應用程式
CMD ["/usr/src/app/start.sh"]

#CMD ['npm','start']