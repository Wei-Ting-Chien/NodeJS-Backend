const express = require('express');
const router = express.Router();
const { testConnection } = require('../database/sequelize');

/* GET home page. */
router.get('/', function (req, res, _next) {
  res.render('index', { title: 'Express' });
});

/* GET health check endpoint */
router.get('/health', async function (req, res, _next) {
  try {
    // 測試資料庫連接
    const dbResult = await testConnection();

    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        connected: dbResult.success,
        error: dbResult.success ? null : dbResult.error,
      },
    };

    const statusCode = dbResult.success ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        connected: false,
        error: error.message,
      },
    });
  }
});

module.exports = router;
