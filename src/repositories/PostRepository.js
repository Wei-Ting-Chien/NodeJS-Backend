const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Like = require('../models/Like');

/**
 * 貼文資料存取層
 * 只負責與 ORM 的資料操作，不包含業務邏輯
 */
class PostRepository {
  /**
   * 創建貼文
   * @param {Object} postData - 貼文資料
   * @returns {Promise<Object>} 創建的貼文
   */
  async create(postData) {
    return await Post.createPost(postData);
  }

  /**
   * 根據 ID 查找貼文
   * @param {number} id - 貼文 ID
   * @returns {Promise<Object|null>} 貼文資料或 null
   */
  async findById(id) {
    return await Post.findById(id);
  }

  /**
   * 根據用戶 ID 查找貼文
   * @param {number} userId - 用戶 ID
   * @param {number} limit - 限制數量
   * @param {number} offset - 偏移量
   * @returns {Promise<Array>} 貼文列表
   */
  async findByUserId(userId, limit = 10, offset = 0) {
    return await Post.findByUserId(userId, limit, offset);
  }

  /**
   * 取得所有貼文
   * @param {number} limit - 限制數量
   * @param {number} offset - 偏移量
   * @returns {Promise<Array>} 貼文列表
   */
  async findAll(limit = 10, offset = 0) {
    return await Post.getAll(limit, offset);
  }

  /**
   * 更新貼文
   * @param {number} id - 貼文 ID
   * @param {Object} updateData - 更新資料
   * @returns {Promise<Object|null>} 更新後的貼文或 null
   */
  async update(id, updateData) {
    return await Post.updatePost(id, updateData);
  }

  /**
   * 刪除貼文
   * @param {number} id - 貼文 ID
   * @param {number} userId - 用戶 ID
   * @returns {Promise<boolean>} 刪除是否成功
   */
  async delete(id, userId) {
    return await Post.deletePost(id, userId);
  }
}

module.exports = new PostRepository();
