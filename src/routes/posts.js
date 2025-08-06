const express = require('express');
const router = express.Router();

// Services
const PostService = require('../services/PostService');

// Middlewares
const { authenticateToken } = require('../middlewares/auth');
const {
  validateBody,
  validateQuery,
  validateParams,
} = require('../middlewares/validation');

// Validation Schemas
const {
  postCreationSchema,
  postUpdateSchema,
  commentCreationSchema,
  idParamSchema,
  userIdParamSchema,
  paginationSchema,
} = require('../validations/schemas');

/**
 * 貼文路由層
 * 只負責：驗證 → 授權 → Service → 回應
 */

// 輔助函數：根據錯誤訊息返回適當的 HTTP 狀態碼
function getErrorStatus(errorMessage) {
  if (
    errorMessage.includes('Post does not exist') ||
    errorMessage.includes('Account does not exist')
  ) {
    return 404;
  }
  if (errorMessage.includes('Unauthorized access')) {
    return 401;
  }
  return 400; // 預設為 400 Bad Request
}

// =============================================================================
// 創建貼文
// =============================================================================
router.post(
  '/',
  authenticateToken,
  validateBody(postCreationSchema),
  async (req, res) => {
    try {
      const result = await PostService.createPost(req.body, req.user.id);

      if (result.success) {
        res.status(201).json(result);
      } else {
        const statusCode = getErrorStatus(result.message);
        res.status(statusCode).json(result);
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
// 取得所有公開貼文
// =============================================================================
router.get('/', validateQuery(paginationSchema), async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const result = await PostService.getAllPosts(limit, offset);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '伺服器內部錯誤',
    });
  }
});

// =============================================================================
// 根據 ID 取得單一貼文
// =============================================================================
router.get('/:id', validateParams(idParamSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null; // 可能沒有登入
    const result = await PostService.getPostById(id, userId);

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
// 更新貼文
// =============================================================================
router.put(
  '/:id',
  authenticateToken,
  validateParams(idParamSchema),
  validateBody(postUpdateSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const result = await PostService.updatePost(id, req.body, req.user.id);

      if (result.success) {
        res.json(result);
      } else {
        const statusCode = getErrorStatus(result.message);
        res.status(statusCode).json(result);
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
// 刪除貼文
// =============================================================================
router.delete(
  '/:id',
  authenticateToken,
  validateParams(idParamSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const result = await PostService.deletePost(id, req.user.id);

      if (result.success) {
        res.json(result);
      } else {
        const statusCode = getErrorStatus(result.message);
        res.status(statusCode).json(result);
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
// 取得用戶的貼文
// =============================================================================
router.get(
  '/user/:userId',
  validateParams(userIdParamSchema),
  validateQuery(paginationSchema),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit, offset } = req.query;
      const requestUserId = req.user?.id || null;

      const result = await PostService.getUserPosts(
        userId,
        requestUserId,
        limit,
        offset,
      );

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
// 按讚/取消按讚貼文
// =============================================================================
router.post(
  '/:id/like',
  authenticateToken,
  validateParams(idParamSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const result = await PostService.toggleLike(id, req.user.id);

      if (result.success) {
        res.json(result);
      } else {
        const statusCode = getErrorStatus(result.message);
        res.status(statusCode).json(result);
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
// 新增留言
// =============================================================================
router.post(
  '/:id/comments',
  authenticateToken,
  validateParams(idParamSchema),
  validateBody(commentCreationSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const result = await PostService.addComment(id, content, req.user.id);

      if (result.success) {
        res.status(201).json(result);
      } else {
        const statusCode = getErrorStatus(result.message);
        res.status(statusCode).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '伺服器內部錯誤',
      });
    }
  },
);

module.exports = router;
