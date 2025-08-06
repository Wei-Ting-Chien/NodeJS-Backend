// 資料庫初始化、導入測試資料

const { initializeDatabase, createTestData } = require('../models');

async function initDatabaseWithModels() {
  try {
    // 初始化資料庫連接並同步模型
    const initResult = await initializeDatabase();

    // 錯誤處理機制
    if (!initResult.success) {
      console.error('❌ Database initialization failed:', initResult.error);
      process.exit(1);
    }

    // 檢查是否需要創建測試數據，測試環境用
    if (
      process.env.CREATE_TEST_DATA === 'true' ||
      process.argv.includes('--test-data')
    ) {
      console.log('📝 Creating test data');
      const testDataResult = await createTestData();

      if (testDataResult.success) {
        console.log('✅ Test data created successfully');
      } else {
        console.warn('⚠️ Failed to create test data:', testDataResult.error);
      }
    }

    console.log('Database initialization completed successfully.');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  initDatabaseWithModels();
}

module.exports = { initDatabaseWithModels };
