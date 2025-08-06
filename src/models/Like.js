const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/sequelize');
const Post = require('./Post');

// 定義 Like 模型
const Like = sequelize.define(
  'Like',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    post_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'posts',
        key: 'id',
      },
      onDelete: 'CASCADE',
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
  },
  {
    tableName: 'likes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['post_id', 'user_id'],
      },
    ],
  },
);

// 根據貼文 ID 查找所有按讚
Like.findByPostId = async function (postId, limit = 20, offset = 0) {
  try {
    const likes = await Like.findAll({
      where: { post_id: postId },
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'username', 'age', 'city'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });
    return likes.map(like => like.toJSON());
  } catch (error) {
    console.error('Error finding likes by post id:', error);
    throw error;
  }
};

// 根據用戶 ID 查找所有按讚
Like.findByUserId = async function (userId, limit = 20, offset = 0) {
  try {
    const likes = await Like.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    // 分別查詢貼文資訊
    const likesWithPosts = await Promise.all(
      likes.map(async like => {
        const post = await Post.findByPk(like.post_id);
        return {
          ...like.toJSON(),
          post: post ? post.toJSON() : null,
        };
      }),
    );

    return likesWithPosts;
  } catch (error) {
    console.error('Error finding likes by user id:', error);
    throw error;
  }
};

// 計算貼文的按讚數量
Like.countByPostId = async function (postId) {
  try {
    const count = await Like.count({
      where: { post_id: postId },
    });
    return count;
  } catch (error) {
    console.error('Error counting likes by post id:', error);
    throw error;
  }
};

// 切換按讚狀態
Like.toggleLike = async function (postId, userId) {
  try {
    const existingLike = await Like.findOne({
      where: {
        post_id: postId,
        user_id: userId,
      },
    });

    if (existingLike) {
      // 如果已經按讚，則取消按讚
      await existingLike.destroy();
      return { action: 'unliked', liked: false };
    } else {
      // 如果尚未按讚，則按讚
      await Like.create({
        post_id: postId,
        user_id: userId,
      });
      return { action: 'liked', liked: true };
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};

module.exports = Like;
