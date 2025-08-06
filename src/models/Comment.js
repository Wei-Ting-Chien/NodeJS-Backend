const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/sequelize');

// 定義 Comment 模型
const Comment = sequelize.define(
  'Comment',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      // 自動遞增，每次 +1
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 150],
      },
    },
  },
  {
    tableName: 'comments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);

// 靜態方法：創建留言
Comment.createComment = async function (commentData) {
  try {
    const comment = await Comment.create(commentData);
    return comment.toJSON();
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

// 靜態方法：根據貼文 ID 查找留言
Comment.findByPostId = async function (postId, limit = 20, offset = 0) {
  try {
    const comments = await Comment.findAll({
      where: { post_id: postId },
      include: [
        {
          model: sequelize.models.User,
          as: 'author',
          attributes: ['id', 'username', 'age', 'city'],
        },
      ],
      order: [['created_at', 'ASC']],
      limit,
      offset,
    });
    return comments.map(comment => comment.toJSON());
  } catch (error) {
    console.error('Error finding comments by post id:', error);
    throw error;
  }
};

// 靜態方法：根據用戶 ID 查找留言
Comment.findByUserId = async function (userId, limit = 20, offset = 0) {
  try {
    const comments = await Comment.findAll({
      where: { user_id: userId },
      include: [
        {
          model: sequelize.models.User,
          as: 'author',
          attributes: ['id', 'username', 'age', 'city'],
        },
        {
          model: sequelize.models.Post,
          as: 'post',
          attributes: ['id', 'content', 'user_id'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });
    return comments.map(comment => comment.toJSON());
  } catch (error) {
    console.error('Error finding comments by user id:', error);
    throw error;
  }
};

// 靜態方法：更新留言
Comment.updateComment = async function (id, updateData, userId) {
  try {
    const [affectedRows] = await Comment.update(updateData, {
      where: {
        id,
        user_id: userId, // 只能更新自己的留言
      },
      returning: true,
    });

    if (affectedRows === 0) {
      return null;
    }

    const updatedComment = await Comment.findByPk(id);
    return updatedComment ? updatedComment.toJSON() : null;
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
};

// 靜態方法：刪除留言
Comment.deleteComment = async function (id, userId) {
  try {
    const deletedRows = await Comment.destroy({
      where: {
        id,
        user_id: userId, // 只能刪除自己的留言
      },
    });
    return deletedRows > 0;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

// 靜態方法：計算貼文的留言數量
Comment.countByPostId = async function (postId) {
  try {
    const count = await Comment.count({
      where: { post_id: postId },
    });
    return count;
  } catch (error) {
    console.error('Error counting comments by post id:', error);
    throw error;
  }
};

module.exports = Comment;
