const { Sequelize } = require('sequelize');
const config = require('../src/config');

/**
 * 測試環境設定
 * 處理資料庫連接、清理等共用邏輯
 */

let sequelize;

/**
 * 初始化測試資料庫連接
 */
async function setupTestDatabase() {
  try {
    // 使用測試環境配置
    sequelize = new Sequelize(
      config.database.name,
      config.database.username,
      config.database.password,
      {
        host: config.database.host,
        port: config.database.port,
        dialect: 'postgres',
        logging: false, // 關閉 SQL 日誌以保持測試輸出清晰
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
      },
    );

    await sequelize.authenticate();
    console.log('✅ 測試資料庫連接成功');
  } catch (error) {
    console.error('❌ 測試資料庫連接失敗:', error);
    throw error;
  }
}

/**
 * 清理測試資料
 * 在每個測試後清理資料庫，確保測試間的獨立性
 */
async function cleanupTestData() {
  try {
    if (sequelize) {
      // 按照外鍵相依性順序刪除資料
      await sequelize.query('DELETE FROM likes');
      await sequelize.query('DELETE FROM comments');
      await sequelize.query('DELETE FROM posts');
      await sequelize.query('DELETE FROM users');

      // 重置序列
      await sequelize.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
      await sequelize.query('ALTER SEQUENCE posts_id_seq RESTART WITH 1');
      await sequelize.query('ALTER SEQUENCE comments_id_seq RESTART WITH 1');
      await sequelize.query('ALTER SEQUENCE likes_id_seq RESTART WITH 1');
    }
  } catch (error) {
    console.warn('⚠️ 清理測試資料時發生錯誤:', error.message);
  }
}

/**
 * 關閉測試資料庫連接
 */
async function closeTestDatabase() {
  try {
    if (sequelize) {
      await sequelize.close();
      console.log('✅ 測試資料庫連接已關閉');
    }
  } catch (error) {
    console.error('❌ 關閉測試資料庫連接時發生錯誤:', error);
  }
}

/**
 * 創建測試用戶資料
 */
function createTestUserData(overrides = {}) {
  return {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    age: 25,
    city: 'Taipei',
    ...overrides,
  };
}

/**
 * 等待指定時間（毫秒）
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  setupTestDatabase,
  cleanupTestData,
  closeTestDatabase,
  createTestUserData,
  sleep,
  get sequelize() {
    return sequelize;
  },
};
