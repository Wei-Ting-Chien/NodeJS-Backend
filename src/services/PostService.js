const PostRepository = require('../repositories/PostRepository');
const CommentRepository = require('../repositories/CommentRepository');
const LikeRepository = require('../repositories/LikeRepository');
const UserRepository = require('../repositories/UserRepository');

/**
 * 貼文業務邏輯層
 * 包含所有貼文相關的業務規則和用例
 */
class PostService {
  /**
   * 創建貼文
   * @param {Object} postData - 貼文資料
   * @param {number} userId - 用戶 ID
   * @returns {Promise<Object>} 創建結果
   */
  async createPost(postData, userId) {
    try {
      // 業務邏輯：檢查用戶是否存在
      const user = await UserRepository.findById(userId);
      if (!user) {
        throw new Error('Account does not exist');
      }

      // 業務邏輯：過濾和驗證貼文資料
      const validatedData = {
        user_id: userId,
        content: postData.content?.trim(),
      };

      // 創建貼文
      const post = await PostRepository.create(validatedData);

      return {
        success: true,
        message: '貼文創建成功',
        data: post,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 取得所有貼文
   * @param {number} limit - 限制數量
   * @param {number} offset - 偏移量
   * @returns {Promise<Object>} 貼文列表
   */
  async getAllPosts(limit = 15, offset = 0) {
    try {
      // 業務邏輯：限制分頁參數
      const validatedLimit = Math.min(Math.max(1, parseInt(limit)), 50);
      const validatedOffset = Math.max(0, parseInt(offset));

      const posts = await PostRepository.findAll(
        validatedLimit,
        validatedOffset,
      );

      return {
        success: true,
        message: '取得貼文成功',
        data: posts,
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

  /**
   * 根據 ID 取得單一貼文
   * @param {number} postId - 貼文 ID
   * @param {number|null} userId - 請求用戶 ID（用於權限檢查）
   * @returns {Promise<Object>} 貼文資料
   */
  async getPostById(postId, userId = null) {
    try {
      const post = await PostRepository.findById(postId);
      if (!post) {
        throw new Error('Post does not exist');
      }

      return {
        success: true,
        message: '取得貼文成功',
        data: post,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 取得用戶的貼文
   * @param {number} targetUserId - 目標用戶 ID
   * @param {number|null} requestUserId - 請求用戶 ID
   * @param {number} limit - 限制數量
   * @param {number} offset - 偏移量
   * @returns {Promise<Object>} 用戶貼文列表
   */
  async getUserPosts(
    targetUserId,
    requestUserId = null,
    limit = 10,
    offset = 0,
  ) {
    try {
      // 業務邏輯：檢查目標用戶是否存在
      const targetUser = await UserRepository.findById(targetUserId);
      if (!targetUser) {
        throw new Error('Account does not exist');
      }

      // 業務邏輯：限制分頁參數
      const validatedLimit = Math.min(Math.max(1, parseInt(limit)), 50);
      const validatedOffset = Math.max(0, parseInt(offset));

      // 取得用戶的貼文
      const posts = await PostRepository.findByUserId(
        targetUserId,
        validatedLimit,
        validatedOffset,
      );

      return {
        success: true,
        message: '取得用戶貼文成功',
        data: posts,
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

  /**
   * 更新貼文
   * @param {number} postId - 貼文 ID
   * @param {Object} updateData - 更新資料
   * @param {number} userId - 用戶 ID
   * @returns {Promise<Object>} 更新結果
   */
  async updatePost(postId, updateData, userId) {
    try {
      // 業務邏輯：檢查貼文是否存在且屬於當前用戶
      const existingPost = await PostRepository.findById(postId);
      if (!existingPost) {
        throw new Error('Post does not exist');
      }

      if (existingPost.user_id !== userId) {
        throw new Error('Unauthorized access');
      }

      // 業務邏輯：過濾允許更新的欄位
      const allowedFields = ['content'];
      const filteredData = {};

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field]?.trim();
        }
      }

      // 更新貼文
      const updatedPost = await PostRepository.update(postId, filteredData);

      return {
        success: true,
        message: '貼文更新成功',
        data: updatedPost,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 刪除貼文
   * @param {number} postId - 貼文 ID
   * @param {number} userId - 用戶 ID
   * @returns {Promise<Object>} 刪除結果
   */
  async deletePost(postId, userId) {
    try {
      // 業務邏輯：檢查貼文是否存在且屬於當前用戶
      const existingPost = await PostRepository.findById(postId);
      if (!existingPost) {
        throw new Error('Post does not exist');
      }

      if (existingPost.user_id !== userId) {
        throw new Error('Unauthorized access');
      }

      // 刪除貼文
      const deleted = await PostRepository.delete(postId, userId);
      if (!deleted) {
        throw new Error('刪除失敗');
      }

      return {
        success: true,
        message: '貼文刪除成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 切換貼文按讚狀態
   * @param {number} postId - 貼文 ID
   * @param {number} userId - 用戶 ID
   * @returns {Promise<Object>} 按讚結果
   */
  async toggleLike(postId, userId) {
    try {
      // 業務邏輯：檢查貼文是否存在
      const post = await PostRepository.findById(postId);
      if (!post) {
        throw new Error('Post does not exist');
      }

      // 切換按讚狀態
      const result = await LikeRepository.toggle(postId, userId);

      return {
        success: true,
        message: result.liked ? '按讚成功' : '取消按讚成功',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 新增留言
   * @param {number} postId - 貼文 ID
   * @param {string} content - 留言內容
   * @param {number} userId - 用戶 ID
   * @returns {Promise<Object>} 留言結果
   */
  async addComment(postId, content, userId) {
    try {
      // 業務邏輯：檢查貼文是否存在
      const post = await PostRepository.findById(postId);
      if (!post) {
        throw new Error('Post does not exist');
      }

      // 業務邏輯：驗證留言內容
      const trimmedContent = content?.trim();
      if (!trimmedContent || trimmedContent.length === 0) {
        throw new Error('Request format error');
      }

      if (trimmedContent.length > 150) {
        throw new Error('Request format error');
      }

      // 創建留言
      const comment = await CommentRepository.create({
        post_id: postId,
        user_id: userId,
        content: trimmedContent,
      });

      return {
        success: true,
        message: '留言創建成功',
        data: comment,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 取得貼文的留言
   * @param {number} postId - 貼文 ID
   * @param {number|null} userId - 用戶 ID（用於權限檢查）
   * @param {number} limit - 限制數量
   * @param {number} offset - 偏移量
   * @returns {Promise<Object>} 留言列表
   */
  async getPostComments(postId, userId = null, limit = 20, offset = 0) {
    try {
      // 業務邏輯：檢查貼文是否存在
      const post = await PostRepository.findById(postId);
      if (!post) {
        throw new Error('Post does not exist');
      }

      // 業務邏輯：限制分頁參數
      const validatedLimit = Math.min(Math.max(1, parseInt(limit)), 100);
      const validatedOffset = Math.max(0, parseInt(offset));

      const comments = await CommentRepository.findByPostId(
        postId,
        validatedLimit,
        validatedOffset,
      );

      return {
        success: true,
        message: '取得留言成功',
        data: comments,
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

  /**
   * 取得特定貼文資訊
   * @param {number} postId - 貼文 ID
   * @returns {Promise<Object>} 貼文資料
   */
  async getSpecificPost(postId) {
    try {
      const post = await PostRepository.findById(postId);
      if (!post) {
        throw new Error('Post does not exist');
      }

      return {
        success: true,
        message: '取得貼文成功',
        data: post,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

module.exports = new PostService();
