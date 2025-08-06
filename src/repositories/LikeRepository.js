const Like = require('../models/Like');

/**
 * 按讚資料存取層
 * 只負責與 ORM 的資料操作，不包含業務邏輯
 */
class LikeRepository {
  /**
   * 根據貼文 ID 查找所有按讚
   * @param {number} postId - 貼文 ID
   * @param {number} limit - 限制數量
   * @param {number} offset - 偏移量
   * @returns {Promise<Array>} 按讚列表
   */
  async findByPostId(postId, limit = 20, offset = 0) {
    return await Like.findByPostId(postId, limit, offset);
  }

  /**
   * 根據用戶 ID 查找所有按讚
   * @param {number} userId - 用戶 ID
   * @param {number} limit - 限制數量
   * @param {number} offset - 偏移量
   * @returns {Promise<Array>} 按讚列表
   */
  async findByUserId(userId, limit = 20, offset = 0) {
    return await Like.findByUserId(userId, limit, offset);
  }

  /**
   * 計算貼文的按讚數量
   * @param {number} postId - 貼文 ID
   * @returns {Promise<number>} 按讚數量
   */
  async countByPostId(postId) {
    return await Like.countByPostId(postId);
  }

  /**
   * 切換按讚狀態
   * @param {number} postId - 貼文 ID
   * @param {number} userId - 用戶 ID
   * @returns {Promise<Object>} 切換結果
   */
  async toggle(postId, userId) {
    return await Like.toggleLike(postId, userId);
  }
}

module.exports = new LikeRepository();
