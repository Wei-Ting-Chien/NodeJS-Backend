const Joi = require('joi');

/**
 * 驗證中間件
 * 與 HTTP Request/Response 流直接相關
 */

/**
 * 統一錯誤處理
 */
const handleValidationError = (error, req, res, next) => {
  if (error && error.isJoi) {
    return res.status(400).json({
      success: false,
      message: `Request format error: ${error.details[0].message}`,
    });
  }
  next(error);
};

/**
 * 請求體驗證中間件
 * @param {Object} schema - Joi 驗證 Schema
 * @returns {Function} Express 中間件函數
 */
const validateBody = schema => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: `Request format error: ${error.details[0].message}`,
      });
    }
    // 將驗證後的值替換原始請求體
    req.body = value;
    next();
  };
};

/**
 * 查詢參數驗證中間件
 * @param {Object} schema - Joi 驗證 Schema
 * @returns {Function} Express 中間件函數
 */
const validateQuery = schema => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: `Request format error: ${error.details[0].message}`,
      });
    }
    // 將驗證後的值替換原始查詢參數
    req.query = value;
    next();
  };
};

/**
 * 路徑參數驗證中間件
 * @param {Object} schema - Joi 驗證 Schema
 * @returns {Function} Express 中間件函數
 */
const validateParams = schema => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params);
    if (error) {
      return res.status(400).json({
        success: false,
        message: `Request format error: ${error.details[0].message}`,
      });
    }
    // 將驗證後的值替換原始路徑參數
    req.params = value;
    next();
  };
};

module.exports = {
  handleValidationError,
  validateBody,
  validateQuery,
  validateParams,
};
