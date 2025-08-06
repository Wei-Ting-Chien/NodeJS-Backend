const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/sequelize');

// 定義 Post 模型
const Post = sequelize.define(
  'Post',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 300],
      },
    },
  },
  {
    tableName: 'posts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);

// 創建貼文（保持向後兼容）
Post.createPost = async function (postData) {
  try {
    const post = await Post.create(postData);
    return post.toJSON();
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

// 根據 ID 查找貼文
Post.findById = async function (id) {
  try {
    const { User, Comment, Like } = require('./index');

    const post = await Post.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['username'], // 只獲取作者名稱
        },
        {
          model: Comment,
          as: 'comments',
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['username'],
            },
          ],
        },
        {
          model: Like,
          as: 'likes',
          attributes: ['id'], // 只需要 ID 來計算數量
        },
      ],
    });

    if (!post) {
      return null;
    }

    // 格式化回應數據
    const postData = post.toJSON();
    return {
      id: postData.id,
      user_id: postData.user_id, // 添加 user_id 以支持權限檢查
      content: postData.content,
      created_at: postData.created_at,
      updated_at: postData.updated_at,
      author: {
        username: postData.author.username,
      },
      comments: postData.comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        author: {
          username: comment.author.username,
        },
      })),
      likes_count: postData.likes.length,
    };
  } catch (error) {
    console.error('Error finding post by id:', error);
    throw error;
  }
};

// 根據用戶 ID 查找貼文
Post.findByUserId = async function (userId, limit = 10, offset = 0) {
  try {
    const { User, Comment, Like } = require('./index');

    const posts = await Post.findAll({
      where: {
        user_id: userId,
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['username'], // 只獲取作者名稱
        },
        {
          model: Comment,
          as: 'comments',
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['username'],
            },
          ],
        },
        {
          model: Like,
          as: 'likes',
          attributes: ['id'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    // 格式化回應數據
    return posts.map(post => {
      const postData = post.toJSON();
      return {
        id: postData.id,
        content: postData.content,
        created_at: postData.created_at,
        updated_at: postData.updated_at,
        author: {
          username: postData.author.username,
        },
        comments: postData.comments.map(comment => ({
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          author: {
            username: comment.author.username,
          },
        })),
        likes_count: postData.likes.length,
      };
    });
  } catch (error) {
    console.error('Error finding posts by user id:', error);
    throw error;
  }
};

// 取得所有貼文
Post.getAll = async function (limit = 10, offset = 0) {
  try {
    const { User, Comment, Like } = require('./index');

    const posts = await Post.findAll({
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['username'], // 只獲取作者名稱
        },
        {
          model: Comment,
          as: 'comments',
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['username'],
            },
          ],
        },
        {
          model: Like,
          as: 'likes',
          attributes: ['id'], // 只需要 ID 來計算數量
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    // 格式化回應數據
    return posts.map(post => {
      const postData = post.toJSON();
      return {
        id: postData.id,
        content: postData.content,
        created_at: postData.created_at,
        updated_at: postData.updated_at,
        author: {
          username: postData.author.username,
        },
        comments: postData.comments.map(comment => ({
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          author: {
            username: comment.author.username,
          },
        })),
        likes_count: postData.likes.length,
      };
    });
  } catch (error) {
    console.error('Error getting all posts:', error);
    throw error;
  }
};

// 更新貼文
Post.updatePost = async function (id, updateData) {
  try {
    const [affectedRows] = await Post.update(updateData, {
      where: { id },
      returning: true,
    });

    if (affectedRows === 0) {
      return null;
    }

    const updatedPost = await Post.findByPk(id);
    return updatedPost ? updatedPost.toJSON() : null;
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
};

// 刪除貼文
Post.deletePost = async function (id, userId) {
  try {
    const deletedRows = await Post.destroy({
      where: {
        id,
        user_id: userId,
      },
    });
    return deletedRows > 0;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

module.exports = Post;
