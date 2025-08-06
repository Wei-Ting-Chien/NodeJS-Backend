const Joi = require('joi');

/**
 * 純驗證邏輯層
 * 只描述「資料長相」，不包含業務邏輯
 */

// =============================================================================
// 用戶相關驗證 Schema
// =============================================================================

const userRegistrationSchema = Joi.object({
  username: Joi.string().min(3).max(50).required().messages({
    'string.min': '用戶名至少需要 3 個字符',
    'string.max': '用戶名不能超過 50 個字符',
    'any.required': '用戶名為必填項',
  }),
  email: Joi.string().email().required().messages({
    'string.email': '請提供有效的郵箱地址',
    'any.required': '郵箱為必填項',
  }),
  password: Joi.string().min(6).max(12).required().messages({
    'string.min': '密碼至少需要 6 個字符',
    'string.max': '密碼不能超過 12 個字符',
    'any.required': '密碼為必填項',
  }),
  age: Joi.number().integer().min(1).max(150).optional().messages({
    'number.base': '年齡必須是數字',
    'number.integer': '年齡必須是整數',
    'number.min': '年齡最小值為1',
    'number.max': '年齡最大值為150',
  }),
  city: Joi.string().max(100).optional().messages({
    'string.max': '城市名稱不能超過 100 個字符',
  }),
});

const userLoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': '請提供有效的郵箱地址',
    'any.required': '郵箱為必填項',
  }),
  password: Joi.string().required().messages({
    'any.required': '密碼為必填項',
  }),
});

const userUpdateSchema = Joi.object({
  age: Joi.number().integer().min(1).max(150).optional().messages({
    'number.base': '年齡必須是數字',
    'number.integer': '年齡必須是整數',
    'number.min': '年齡最小值為1',
    'number.max': '年齡最大值為150',
  }),
  city: Joi.string().max(100).optional().messages({
    'string.max': '城市名稱不能超過 100 個字符',
  }),
});

// =============================================================================
// 貼文相關驗證 Schema
// =============================================================================

const postCreationSchema = Joi.object({
  content: Joi.string().min(1).max(300).required().messages({
    'string.min': '貼文內容不能為空',
    'string.max': '貼文內容不能超過 300 個字符',
    'any.required': '貼文內容為必填項',
  }),
});

const postUpdateSchema = Joi.object({
  content: Joi.string().min(1).max(300).optional().messages({
    'string.min': '貼文內容不能為空',
    'string.max': '貼文內容不能超過 300 個字符',
  }),
});

// =============================================================================
// 留言相關驗證 Schema
// =============================================================================

const commentCreationSchema = Joi.object({
  content: Joi.string().min(1).max(150).required().messages({
    'string.min': '留言內容不能為空',
    'string.max': '留言內容不能超過 150 個字符',
    'any.required': '留言內容為必填項',
  }),
});

// =============================================================================
// 參數驗證 Schema
// =============================================================================

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID必須是數字',
    'number.integer': 'ID必須是整數',
    'number.positive': 'ID必須是正數',
    'any.required': 'ID為必填項',
  }),
});

const userIdParamSchema = Joi.object({
  userId: Joi.number().integer().positive().required().messages({
    'number.base': 'UserId必須是數字',
    'number.integer': 'UserId必須是整數',
    'number.positive': 'UserId必須是正數',
    'any.required': 'UserId為必填項',
  }),
});

const paginationSchema = Joi.object({
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .messages({
      'number.base': 'limit必須是數字',
      'number.integer': 'limit必須是整數',
      'number.min': 'limit最小值為1',
      'number.max': 'limit最大值為100',
    }),
  offset: Joi.number().integer().min(0).optional().default(0).messages({
    'number.base': 'offset必須是數字',
    'number.integer': 'offset必須是整數',
    'number.min': 'offset最小值為0',
  }),
});

// =============================================================================
// 導出所有 Schema
// =============================================================================

module.exports = {
  // 用戶相關
  userRegistrationSchema,
  userLoginSchema,
  userUpdateSchema,

  // 貼文相關
  postCreationSchema,
  postUpdateSchema,

  // 留言相關
  commentCreationSchema,

  // 參數相關
  idParamSchema,
  userIdParamSchema,
  paginationSchema,
};
