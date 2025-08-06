/**
 * Mocha 測試環境設定
 * 在所有測試執行前載入，確保環境變數和依賴正確設定
 */

// 載入測試配置
require('./config');

// 設定全域測試 hooks
before(function () {
  console.log('🚀 開始執行測試套件...');
  console.log(`📊 測試環境: ${process.env.NODE_ENV}`);
  console.log(
    `🗄️  資料庫: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  );
});

after(function () {
  console.log('✅ 測試套件執行完成');
});

// 處理未捕獲的 Promise 拒絕
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未處理的 Promise 拒絕:', promise, 'reason:', reason);
  process.exit(1);
});

// 處理未捕獲的異常
process.on('uncaughtException', error => {
  console.error('❌ 未捕獲的異常:', error);
  process.exit(1);
});
