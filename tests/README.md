# 測試說明文件

## 📋 測試架構概述

本專案使用 **Mocha + Chai + Sinon + Supertest** 技術棧進行測試，測試分為三個層級：

- **Unit Tests** (`tests/unit/`): 單元測試，測試個別函數或類別
- **Integration Tests** (`tests/integration/`): 整合測試，測試多個組件間的協作
- **E2E Tests** (`tests/e2e/`): 端到端測試，測試完整的用戶流程

## 🚀 執行測試

### 前置需求

1. 確保 Docker 容器正在運行（PostgreSQL 資料庫）
2. 確保環境變數正確設定

### 執行指令

```bash
# 執行所有測試
npm run test:all

# 執行特定類型的測試
npm run test:unit
npm run test:integration
npm run test:e2e

# 執行特定檔案
npm run test:integration -- --grep "用戶註冊"

# 監視模式（開發時使用）
npm run test:watch

# 產生覆蓋率報告
npm run test:coverage
```

## 📁 測試檔案結構

```
tests/
├── config.js                           # 測試環境配置
├── setup.js                           # 測試設定工具
├── mocha.env.js                        # Mocha 環境設定
├── README.md                           # 本檔案
├── unit/                               # 單元測試
│   ├── models/                         # Model 層測試
│   ├── services/                       # Service 層測試
│   └── routes/                         # Route 層測試
├── integration/                        # 整合測試
│   └── users.register.integration.spec.js  # 用戶註冊整合測試
└── e2e/                               # 端到端測試
```

## 🧪 用戶註冊測試 (Integration)

### 測試檔案位置

`tests/integration/users.register.integration.spec.js`

### 測試案例說明

基於 `vibe-story/13-test_spec.md` 規格實作，包含以下 8 個測試案例：

| #   | 測試情境           | 期望狀態碼 | 期望回應            |
| --- | ------------------ | ---------- | ------------------- |
| 1   | ✅ 正常註冊成功    | 200/201    | 成功訊息 + 用戶資料 |
| 2   | ❌ 帳號已存在      | 400/409    | 錯誤訊息            |
| 3   | ❌ Email 已存在    | 400/409    | 錯誤訊息            |
| 4   | ❌ 密碼太短 (< 6)  | 400        | 驗證錯誤訊息        |
| 5   | ❌ 密碼太長 (> 12) | 400        | 驗證錯誤訊息        |
| 6   | ❌ 缺少 username   | 400        | 必填欄位錯誤        |
| 7   | ❌ 缺少 email      | 400        | 必填欄位錯誤        |
| 8   | ❌ 缺少 password   | 400        | 必填欄位錯誤        |

### 測試範圍

- **API 端點**: `POST /users/register`
- **測試層級**: Route → Service → Repository → Database
- **驗證項目**:
  - HTTP 狀態碼
  - 回應格式
  - 資料驗證
  - 業務邏輯
  - 資料庫操作

## 🛠️ 測試工具說明

### 共用工具 (`tests/setup.js`)

- `setupTestDatabase()`: 初始化測試資料庫連接
- `cleanupTestData()`: 清理測試資料，確保測試間獨立性
- `closeTestDatabase()`: 關閉資料庫連接
- `createTestUserData()`: 產生測試用戶資料
- `sleep()`: 延遲執行工具

### 測試配置 (`tests/config.js`)

- 環境變數設定
- 資料庫配置
- JWT 設定
- 測試超時設定

## 🔧 開發測試指南

### 新增測試檔案

1. 根據測試類型選擇適當的資料夾 (`unit/`, `integration/`, `e2e/`)
2. 檔案命名格式: `[功能名稱].[測試類型].spec.js`
3. 引入必要的測試工具和設定

### 測試撰寫最佳實踐

1. **測試獨立性**: 每個測試應該獨立運行，不依賴其他測試
2. **資料清理**: 使用 `afterEach` 清理測試資料
3. **描述性命名**: 測試名稱應清楚描述測試情境
4. **適當分組**: 使用 `describe` 將相關測試分組
5. **邊界測試**: 包含正常情況和邊界條件的測試

### Docker 環境測試

本專案使用 Docker 執行服務，測試時需要：

1. 確保 Docker 容器正在運行
2. 資料庫服務可正常連接
3. 環境變數正確設定

```bash
# 啟動 Docker 服務
docker-compose up -d

# 檢查服務狀態
docker-compose ps

# 執行測試
npm run test:integration
```

## 📊 測試覆蓋率

執行 `npm run test:coverage` 產生覆蓋率報告，報告會包含：

- 行覆蓋率 (Line Coverage)
- 分支覆蓋率 (Branch Coverage)
- 函數覆蓋率 (Function Coverage)
- 語句覆蓋率 (Statement Coverage)

目標覆蓋率: **≥ 80%**

## 🐛 故障排除

### 常見問題

1. **資料庫連接失敗**
   - 檢查 Docker 容器狀態
   - 驗證環境變數設定
   - 確認網路連接

2. **測試超時**
   - 調整 `.mocharc.json` 中的 timeout 設定
   - 檢查資料庫查詢效能

3. **測試間互相影響**
   - 確保使用 `cleanupTestData()` 清理資料
   - 檢查測試執行順序

### 除錯技巧

```bash
# 執行單一測試檔案並顯示詳細資訊
npx mocha tests/integration/users.register.integration.spec.js --reporter spec

# 只執行特定測試案例
npx mocha tests/integration/users.register.integration.spec.js --grep "正常註冊成功"

# 開啟除錯模式
DEBUG=* npm run test:integration
```
