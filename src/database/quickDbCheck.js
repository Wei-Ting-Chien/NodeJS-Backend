const { sequelize } = require('./sequelize');

async function quickDbCheck() {
  try {
    console.log('🔍 Testing database connection to social_platform...');

    // 測試連接
    await sequelize.authenticate();

    console.log('✅ Database connection successful!');
    console.log('📊 Connected to database:', sequelize.config.database);
    console.log('🏠 Host:', sequelize.config.host);
    console.log('🔌 Port:', sequelize.config.port);
    console.log('👤 User:', sequelize.config.username);
    console.log('🎉 Connection test completed successfully!');

    return { success: true };
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    // 關閉連接
    await sequelize.close();
  }
}

// 如果直接執行此檔案
if (require.main === module) {
  quickDbCheck()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { quickDbCheck };
