const { Sequelize } = require('sequelize');
const config = require('../config');

// 建立 Sequelize 實例
const sequelize = new Sequelize(config.database.url, {
  dialect: 'postgres',
  logging: config.app.env === 'development' ? console.log : false,
  pool: {
    max: 20, // 最大連接數
    min: 0, // 最小連接數
    acquire: 30000, // 獲取連接的最大時間 (毫秒)
    idle: 10000, // 連接閒置時間 (毫秒)
  },
  dialectOptions: {
    ssl:
      config.app.env === 'production'
        ? {
          require: true,
          rejectUnauthorized: false,
        }
        : false,
  },
});

// 測試資料庫連接
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Sequelize connection has been established successfully.');
    return { success: true };
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    return { success: false, error: error.message };
  }
}

// 避免殭屍連接
process.on('beforeExit', async () => {
  try {
    await sequelize.close();
    console.log('🔌 Sequelize connection closed.');
  } catch (error) {
    console.error('Error closing Sequelize connection:', error);
  }
});

// 處理未捕獲的異常
process.on('uncaughtException', async error => {
  console.error('Uncaught Exception:', error);
  try {
    await sequelize.close();
  } catch (closeError) {
    console.error('Error closing Sequelize connection:', closeError);
  }
  process.exit(1);
});

module.exports = {
  sequelize,
  testConnection,
};
