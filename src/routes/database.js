const express = require('express');
const router = express.Router();
const { testConnection } = require('../database/sequelize');
const { sequelize } = require('../database/sequelize');
const config = require('../config');

// 測試資料庫連接
router.get('/test', async (req, res) => {
  try {
    const result = await testConnection();
    if (result.success) {
      res.json({
        status: 'success',
        message: 'Database connection successful',
        data: result.data,
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Database connection failed',
        error: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database test failed',
      error: error.message,
    });
  }
});

// 獲取資料庫連接資訊
router.get('/info', async (req, res) => {
  try {
    const result = await testConnection();
    if (result.success) {
      res.json({
        status: 'success',
        message: 'Database connection successful',
        data: {
          host: config.database.host,
          port: config.database.port,
          database: config.database.name,
          user: config.database.username,
          dialect: 'postgres',
        },
      });
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database info failed',
      error: error.message,
    });
  }
});

// 創建測試表
router.post('/create-table', async (req, res) => {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sequelize.query(createTableQuery);

    res.json({
      status: 'success',
      message: 'Test table created successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to create test table',
      error: error.message,
    });
  }
});

// 插入測試數據
router.post('/insert-test-data', async (req, res) => {
  try {
    const insertQuery = `
      INSERT INTO test_table (name) 
      VALUES ($1) 
      RETURNING id, name, created_at
    `;

    const result = await sequelize.query(insertQuery, {
      replacements: ['Test User ' + Date.now()],
      type: sequelize.QueryTypes.SELECT,
    });

    res.json({
      status: 'success',
      message: 'Test data inserted successfully',
      data: result[0],
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to insert test data',
      error: error.message,
    });
  }
});

// 查詢測試數據
router.get('/test-data', async (req, res) => {
  try {
    const selectQuery =
      'SELECT * FROM test_table ORDER BY created_at DESC LIMIT 10';
    const result = await sequelize.query(selectQuery, {
      type: sequelize.QueryTypes.SELECT,
    });

    res.json({
      status: 'success',
      message: 'Test data retrieved successfully',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve test data',
      error: error.message,
    });
  }
});

// 獲取資料庫統計信息
router.get('/stats', async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE schemaname = 'public'
      LIMIT 10
    `;

    const result = await sequelize.query(statsQuery, {
      type: sequelize.QueryTypes.SELECT,
    });

    res.json({
      status: 'success',
      message: 'Database stats retrieved successfully',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve database stats',
      error: error.message,
    });
  }
});

module.exports = router;
