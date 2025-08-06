# Backend Social Application

一個完整的 NodeJS Express 後端專案，提供社交媒體應用程式的核心 API 服務。

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 環境設置

```bash
# 複製環境變數範本
cp .env.example .env

# 編輯環境變數
nano .env
```

### 3. 資料庫設置

```bash
# 測試資料庫連接
docker compose exec app npm run db:quick
docker compose exec app npm run db:health
```

### 4. 啟動應用程式

```bash
docker compose up -d
```

## 🧪 測試

| 指令                                            | 描述           |
| ----------------------------------------------- | -------------- |
| `docker compose exec app npm test`              | 執行所有測試   |
| `docker compose exec app npm run test:coverage` | 生成覆蓋率報告 |
| `docker compose exec app npm run test:ci`       | CI/CD 測試     |

## 🔧 程式碼品質

| 指令               | 描述               |
| ------------------ | ------------------ |
| `npm run lint`     | 檢查程式碼風格     |
| `npm run lint:fix` | 自動修復程式碼問題 |
| `npm run format`   | 格式化程式碼       |

## 📁 專案結構

```
backend-social-application/
├── 📄 應用程式核心
│   ├── app.js                    # Express 應用程式主文件
│   └── bin/www                   # 伺服器啟動文件
│
├── 📂 src/                       # 核心功能模組
│   ├── 📂 config/               # 配置檔案
│   ├── 📂 database/             # 資料庫相關
│   │   ├── sequelize.js         # Sequelize 配置
│   │   ├── initDatabase.js      # 資料庫初始化
│   │   └── dbHealthCheck.js     # 資料庫健康檢查
│   ├── 📂 models/               # 資料模型
│   │   ├── User.js              # 用戶模型
│   │   ├── Post.js              # 貼文模型
│   │   ├── Comment.js           # 評論模型
│   │   └── Like.js              # 按讚模型
│   ├── 📂 routes/               # API 路由
│   │   ├── index.js             # 主路由
│   │   ├── users.js             # 用戶路由
│   │   └── posts.js             # 貼文路由
│   ├── 📂 middlewares/          # 中間件
│   │   ├── auth.js              # 身份驗證
│   │   └── validation.js        # 資料驗證
│   ├── 📂 services/             # 業務邏輯層
│   │   ├── UserService.js       # 用戶服務
│   │   └── PostService.js       # 貼文服務
│   ├── 📂 repositories/         # 資料存取層
│   │   ├── UserRepository.js    # 用戶資料庫操作
│   │   ├── PostRepository.js    # 貼文資料庫操作
│   │   ├── CommentRepository.js # 評論資料庫操作
│   │   └── LikeRepository.js    # 按讚資料庫操作
│   └── 📂 validations/          # 驗證規則
│       └── schemas.js           # Joi 驗證模式
│
├── 📂 tests/                    # 測試檔案
│   ├── 📂 integration/          # 整合測試
│   │   ├── posts.*.spec.js      # 貼文相關測試
│   │   └── users.*.spec.js      # 用戶相關測試
│   └── setup.js                 # 測試環境設置
│
├── 📂 api/                      # API 文件
├── 📂 request/                  # API 測試請求
├── 📂 views/                    # EJS 模板
├── 📂 .husky/                   # Git hooks
├── 📄 docker-compose.yml        # Docker 容器配置
├── 📄 docker-compose-ci.yml     # Gitlab CI 容器配置
├── 📄 Dockerfile                # Docker 映像檔配置
└── 📄 package.json              # 專案配置
```

## 📦 主要依賴

### 核心依賴

| 套件                 | 用途         |
| -------------------- | ------------ |
| `express`            | Web 框架     |
| `helmet`             | 安全性中間件 |
| `cors`               | CORS 支援    |
| `dotenv`             | 環境變數管理 |
| `express-rate-limit` | API 速率限制 |
| `express-validator`  | 請求驗證     |
| `bcryptjs`           | 密碼加密     |
| `jsonwebtoken`       | JWT 認證     |

### 資料庫相關

| 套件         | 用途     |
| ------------ | -------- |
| `sequelize`  | ORM 框架 |
| `postgreSQL` | 資料庫   |

### 開發依賴

| 套件          | 用途         |
| ------------- | ------------ |
| `mocha`       | 測試框架     |
| `chai`        | 斷言庫       |
| `sinon`       | 模擬庫       |
| `supertest`   | HTTP 測試    |
| `eslint`      | 程式碼檢查   |
| `prettier`    | 程式碼格式化 |
| `husky`       | Git hooks    |
| `lint-staged` | 暫存文件檢查 |

## 🔗 API 端點

### 用戶相關

| 方法   | 端點                  | 描述         |
| ------ | --------------------- | ------------ |
| `POST` | `/api/users/register` | 用戶註冊     |
| `POST` | `/api/users/login`    | 用戶登入     |
| `GET`  | `/api/users/profile`  | 取得用戶資料 |
| `PUT`  | `/api/users/profile`  | 更新用戶資料 |

### 貼文相關

| 方法     | 端點                  | 描述         |
| -------- | --------------------- | ------------ |
| `GET`    | `/api/posts`          | 取得貼文列表 |
| `POST`   | `/api/posts`          | 建立新貼文   |
| `GET`    | `/api/posts/:id`      | 取得貼文詳情 |
| `PUT`    | `/api/posts/:id`      | 更新貼文     |
| `DELETE` | `/api/posts/:id`      | 刪除貼文     |
| `POST`   | `/api/posts/:id/like` | 按讚貼文     |
| `DELETE` | `/api/posts/:id/like` | 取消按讚     |

### 評論相關

| 方法     | 端點                      | 描述         |
| -------- | ------------------------- | ------------ |
| `GET`    | `/api/posts/:id/comments` | 取得貼文評論 |
| `POST`   | `/api/posts/:id/comments` | 新增評論     |
| `PUT`    | `/api/comments/:id`       | 更新評論     |
| `DELETE` | `/api/comments/:id`       | 刪除評論     |

## 🐳 Docker 部署

```bash
# 啟動所有服務
docker compose up -d

# 查看服務狀態
docker compose ps

# 停止服務
docker compose down

```
