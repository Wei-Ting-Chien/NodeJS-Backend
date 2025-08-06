#!/bin/sh

# 等待資料庫準備就緒的函數
wait_for_db() {
    echo "Waiting for database to be ready..."
    
    # 嘗試連接資料庫，最多重試 30 次
    for i in $(seq 1 30); do
        if node -e "
            const { Sequelize } = require('sequelize');
            const config = require('./src/config');
            
            const sequelize = new Sequelize(config.database.url, {
                dialect: 'postgres',
                logging: false
            });
            
            sequelize.authenticate()
                .then(() => {
                    console.log('Database is ready!');
                    process.exit(0);
                })
                .catch(() => {
                    console.log('Database not ready yet...');
                    process.exit(1);
                });
        "; then
            echo "Database is ready!"
            return 0
        fi
        
        echo "Attempt $i/30: Database not ready yet, waiting..."
        sleep 2
    done
    
    echo "Database connection failed after 30 attempts"
    exit 1
}

# 初始化資料庫
init_database() {
    echo "Initializing database with Sequelize ORM..."
    npm run init-db
}

# 主執行流程
main() {
    echo "Starting application initialization..."
    
    # 等待資料庫準備就緒
    wait_for_db
    
    # 初始化資料庫
    init_database
    
    # 啟動應用程式
    echo "Starting application..."
    exec npm start
}

# 執行主流程
main