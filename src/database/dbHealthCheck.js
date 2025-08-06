const { sequelize, testConnection } = require('./sequelize');

async function dbHealthCheck() {
  try {
    console.log('🔍 Testing Sequelize connection...');

    // 測試資料庫連接
    const connectionResult = await testConnection();

    if (!connectionResult.success) {
      console.error('❌ Sequelize connection failed:', connectionResult.error);
      process.exit(1);
    }

    // 測試基本查詢（不依賴任何表）
    const result = await sequelize.query('SELECT 1 as test', {
      type: sequelize.QueryTypes.SELECT,
    });
    console.log('✅ Basic query test successful:', result);

    // 獲取資料庫資訊
    const dbInfo = await sequelize.query(
      'SELECT current_database() as database, version() as version',
      { type: sequelize.QueryTypes.SELECT },
    );
    console.log('📊 Database info:', dbInfo[0]);

    // 檢查資料庫表
    const tables = await sequelize.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public'`,
      { type: sequelize.QueryTypes.SELECT },
    );
    console.log(
      '📋 Available tables:',
      tables.map(t => t.table_name),
    );

    console.log('🎉 Sequelize setup completed successfully!');
  } catch (error) {
    console.error('❌ Sequelize connection test failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// 如果直接執行此檔案
if (require.main === module) {
  dbHealthCheck();
}

module.exports = dbHealthCheck;
