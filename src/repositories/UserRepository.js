const User = require('../models/User');

/**
 * 用戶資料存取層
 * 只負責與 ORM 的資料操作，不包含業務邏輯
 */
class UserRepository {
  /**
   * 創建用戶
   * @param {Object} userData - 用戶資料
   * @returns {Promise<Object>} 創建的用戶
   */
  async create(userData) {
    return await User.createUser(userData);
  }

  /**
   * 根據 Email 查找用戶
   * @param {string} email - 用戶郵箱
   * @returns {Promise<Object|null>} 用戶資料或 null
   */
  async findByEmail(email) {
    return await User.findByEmail(email);
  }

  /**
   * 根據 ID 查找用戶
   * @param {number} id - 用戶 ID
   * @returns {Promise<Object|null>} 用戶資料或 null
   */
  async findById(id) {
    return await User.findById(id);
  }

  /**
   * 根據用戶名查找用戶
   * @param {string} username - 用戶名
   * @returns {Promise<Object|null>} 用戶資料或 null
   */
  async findByUsername(username) {
    return await User.findByUsername(username);
  }

  /**
   * 更新用戶資料
   * @param {number} id - 用戶 ID
   * @param {Object} updateData - 更新資料
   * @returns {Promise<Object|null>} 更新後的用戶或 null
   */
  async update(id, updateData) {
    return await User.updateUser(id, updateData);
  }

  /**
   * 驗證用戶密碼
   * @param {Object} user - 用戶資料
   * @param {string} password - 密碼
   * @returns {Promise<boolean>} 驗證結果
   */
  async verifyPassword(user, password) {
    return await User.verifyPassword(user, password);
  }

  /**
   * 生成 JWT Token
   * @param {Object} user - 用戶資料
   * @returns {string} JWT Token
   */
  generateToken(user) {
    return User.generateToken(user);
  }

  /**
   * 驗證 JWT Token
   * @param {string} token - JWT Token
   * @returns {Object|null} 解碼後的 Token 資料或 null
   */
  verifyToken(token) {
    return User.verifyToken(token);
  }
}

module.exports = new UserRepository();
