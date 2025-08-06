const UserRepository = require('../repositories/UserRepository');
const LikeRepository = require('../repositories/LikeRepository');

/**
 * 用戶業務邏輯層
 * 包含所有用戶相關的業務規則和用例
 */
class UserService {
  /**
   * 用戶註冊
   * @param {Object} userData - 用戶資料
   * @returns {Promise<Object>} 註冊結果
   */
  async register(userData) {
    try {
      // 業務邏輯：檢查用戶名是否已存在
      const existingUsername = await UserRepository.findByUsername(
        userData.username,
      );
      if (existingUsername) {
        throw new Error('Account already exists');
      }

      // 業務邏輯：檢查郵箱是否已存在
      const existingEmail = await UserRepository.findByEmail(userData.email);
      if (existingEmail) {
        throw new Error('Email already exists');
      }

      // 創建用戶
      const user = await UserRepository.create(userData);

      return {
        success: true,
        message: '註冊成功',
        data: user,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 用戶登入
   * @param {string} email - 郵箱
   * @param {string} password - 密碼
   * @returns {Promise<Object>} 登入結果
   */
  async login(email, password) {
    try {
      // 業務邏輯：查找用戶
      const user = await UserRepository.findByEmail(email);
      if (!user) {
        throw new Error('Account does not exist');
      }

      // 業務邏輯：驗證密碼
      const isPasswordValid = await UserRepository.verifyPassword(
        user,
        password,
      );
      if (!isPasswordValid) {
        throw new Error('Incorrect account or password');
      }

      // 生成 Token
      const token = UserRepository.generateToken(user);

      // 移除密碼資訊
      const { password_hash, ...userWithoutPassword } = user;

      return {
        success: true,
        message: '登入成功',
        data: {
          user: userWithoutPassword,
          token,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 取得用戶個人資料
   * @param {number} userId - 用戶 ID
   * @returns {Promise<Object>} 用戶資料
   */
  async getProfile(userId) {
    try {
      const user = await UserRepository.findById(userId);
      if (!user) {
        throw new Error('Account does not exist');
      }

      // 移除敏感資訊
      const { password_hash, ...userProfile } = user;

      return {
        success: true,
        message: '取得個人資料成功',
        data: userProfile,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 更新用戶個人資料
   * @param {number} userId - 用戶 ID
   * @param {Object} updateData - 更新資料
   * @returns {Promise<Object>} 更新結果
   */
  async updateProfile(userId, updateData) {
    try {
      // 業務邏輯：檢查用戶是否存在
      const existingUser = await UserRepository.findById(userId);
      if (!existingUser) {
        throw new Error('Account does not exist');
      }

      // 業務邏輯：過濾允許更新的欄位
      const allowedFields = ['age', 'city'];
      const filteredData = {};

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      }

      // 更新用戶資料
      const updatedUser = await UserRepository.update(userId, filteredData);

      return {
        success: true,
        message: '個人資料更新成功',
        data: updatedUser,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 根據用戶名查找用戶（公開資訊）
   * @param {string} username - 用戶名
   * @returns {Promise<Object>} 用戶公開資訊
   */
  async getUserByUsername(username) {
    try {
      const user = await UserRepository.findByUsername(username);
      if (!user) {
        throw new Error('Account does not exist');
      }

      // 只返回公開資訊
      const { password_hash, email, ...publicInfo } = user;

      return {
        success: true,
        message: '查找用戶成功',
        data: publicInfo,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 驗證 JWT Token
   * @param {string} token - JWT Token
   * @returns {Promise<Object>} 驗證結果
   */
  async verifyToken(token) {
    try {
      const decoded = UserRepository.verifyToken(token);
      if (!decoded) {
        throw new Error('Token 無效');
      }

      // 檢查用戶是否仍然存在
      const user = await UserRepository.findById(decoded.id);
      if (!user) {
        throw new Error('Account does not exist');
      }

      return {
        success: true,
        message: 'Token 有效',
        data: decoded,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 取得使用者按過愛心的貼文
   * @param {number} userId - 用戶 ID
   * @param {number} limit - 限制數量
   * @param {number} offset - 偏移量
   * @returns {Promise<Object>} 用戶按讚的貼文列表
   */
  async getUserLikedPosts(userId, limit = 15, offset = 0) {
    try {
      // 業務邏輯：檢查用戶是否存在
      const user = await UserRepository.findById(userId);
      if (!user) {
        throw new Error('Account does not exist');
      }

      // 業務邏輯：限制分頁參數
      const validatedLimit = Math.min(Math.max(1, parseInt(limit)), 50);
      const validatedOffset = Math.max(0, parseInt(offset));

      // 透過 LikeRepository 取得用戶的按讚記錄
      const likedPosts = await LikeRepository.findByUserId(
        userId,
        validatedLimit,
        validatedOffset,
      );

      return {
        success: true,
        message: '取得用戶按讚貼文成功',
        data: likedPosts,
        pagination: {
          limit: validatedLimit,
          offset: validatedOffset,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

module.exports = new UserService();
