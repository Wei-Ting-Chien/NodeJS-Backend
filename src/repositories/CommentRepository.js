const Comment = require('../models/Comment');

/**
 * 留言資料存取層
 * 只負責與 ORM 的資料操作，不包含業務邏輯
 */
class CommentRepository {
  /**
   * 創建留言
   * @param {Object} commentData - 留言資料
   * @returns {Promise<Object>} 創建的留言
   */
  async create(commentData) {
    return await Comment.createComment(commentData);
  }

  /**
   * 根據貼文 ID 查找留言
   * @param {number} postId - 貼文 ID
   * @param {number} limit - 限制數量
   * @param {number} offset - 偏移量
   * @returns {Promise<Array>} 留言列表
   */
  async findByPostId(postId, limit = 20, offset = 0) {
    return await Comment.findByPostId(postId, limit, offset);
  }

  /**
   * 根據用戶 ID 查找留言
   * @param {number} userId - 用戶 ID
   * @param {number} limit - 限制數量
   * @param {number} offset - 偏移量
   * @returns {Promise<Array>} 留言列表
   */
  async findByUserId(userId, limit = 20, offset = 0) {
    return await Comment.findByUserId(userId, limit, offset);
  }

  /**
   * 更新留言
   * @param {number} id - 留言 ID
   * @param {Object} updateData - 更新資料
   * @param {number} userId - 用戶 ID
   * @returns {Promise<Object|null>} 更新後的留言或 null
   */
  async update(id, updateData, userId) {
    return await Comment.updateComment(id, updateData, userId);
  }

  /**
   * 刪除留言
   * @param {number} id - 留言 ID
   * @param {number} userId - 用戶 ID
   * @returns {Promise<boolean>} 刪除是否成功
   */
  async delete(id, userId) {
    return await Comment.deleteComment(id, userId);
  }

  /**
   * 計算貼文的留言數量
   * @param {number} postId - 貼文 ID
   * @returns {Promise<number>} 留言數量
   */
  async countByPostId(postId) {
    return await Comment.countByPostId(postId);
  }
}

module.exports = new CommentRepository();
