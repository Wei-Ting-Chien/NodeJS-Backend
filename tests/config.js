/**
 * 測試環境配置
 * 設定測試專用的環境變數和配置
 */

// 確保在測試環境中
process.env.NODE_ENV = 'test';

// 設定測試資料庫配置（如果有專用的測試資料庫）
// 這裡保持與開發環境相同，但在實際專案中建議使用專門的測試資料庫
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.DB_NAME = process.env.DB_NAME || 'social_platform';
process.env.DB_USER = process.env.DB_USER || 'admin';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'pg123456';

// JWT 測試配置
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test_jwt_secret_key_for_testing_only';

// 關閉不必要的中間件在測試時的日誌
process.env.LOG_LEVEL = 'error';

// 設定測試超時時間
process.env.TEST_TIMEOUT = '30000';

module.exports = {
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    name: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '24h',
  },
  test: {
    timeout: parseInt(process.env.TEST_TIMEOUT),
  },
};
