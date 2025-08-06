const express = require('express');
const router = express.Router();
const Joi = require('joi');

// Services
const UserService = require('../services/UserService');

// Middlewares
const { authenticateToken } = require('../middlewares/auth');
const {
  validateBody,
  validateQuery,
  validateParams,
} = require('../middlewares/validation');

// Validation Schemas
const {
  userRegistrationSchema,
  userLoginSchema,
  userUpdateSchema,
  idParamSchema,
  paginationSchema,
} = require('../validations/schemas');

/**
 * 用戶路由層
 * 只負責：驗證 → 授權 → Service → 回應
 */

router.post(
  '/register',
  validateBody(userRegistrationSchema),
  async (req, res) => {
    try {
      const result = await UserService.register(req.body);

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '伺服器內部錯誤',
      });
    }
  },
);

// =============================================================================
// 用戶登入
// =============================================================================
router.post('/login', validateBody(userLoginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await UserService.login(email, password);

    if (result.success) {
      res.json(result);
    } else {
      // 根據錯誤訊息決定狀態碼
      const statusCode =
        result.message === 'Account does not exist' ? 404 : 401;
      res.status(statusCode).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '伺服器內部錯誤',
    });
  }
});

// =============================================================================
// 取得個人資料
// =============================================================================
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await UserService.getProfile(req.user.id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '伺服器內部錯誤',
    });
  }
});

// =============================================================================
// 更新個人資料
// =============================================================================
router.put(
  '/profile',
  authenticateToken,
  validateBody(userUpdateSchema),
  async (req, res) => {
    try {
      const result = await UserService.updateProfile(req.user.id, req.body);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '伺服器內部錯誤',
      });
    }
  },
);

// =============================================================================
// 取得使用者按過愛心的貼文
// =============================================================================
router.get(
  '/:userId/liked-posts',
  validateQuery(paginationSchema),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit, offset } = req.query;
      const result = await UserService.getUserLikedPosts(userId, limit, offset);

      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '伺服器內部錯誤',
      });
    }
  },
);

// =============================================================================
// 根據用戶名查找用戶（公開資訊）
// =============================================================================
router.get('/username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const result = await UserService.getUserByUsername(username);

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '伺服器內部錯誤',
    });
  }
});

// =============================================================================
// 驗證 Token
// =============================================================================
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    // 如果通過了 authenticateToken 中間件，表示 Token 有效
    res.json({
      success: true,
      message: 'Token 有效',
      data: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '伺服器內部錯誤',
    });
  }
});

module.exports = router;
