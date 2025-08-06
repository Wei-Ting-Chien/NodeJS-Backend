const User = require('../models/User');

// 驗證 JWT token 的中間件
// 強制要求 Token 認證， Bearer Token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized access',
    });
  }

  try {
    const decoded = User.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized access',
    });
  }
};

// 可選的身份驗證中間件（不強制要求登入）
// 有 token 就驗證，沒有就跳過
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = User.verifyToken(token);
      if (decoded) {
        req.user = decoded;
      }
    } catch (error) {
      // Token 無效，但不阻擋請求
    }
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
};
