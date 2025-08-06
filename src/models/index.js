const { sequelize } = require('../database/sequelize');

const User = require('./User');
const Post = require('./Post');
const Comment = require('./Comment');
const Like = require('./Like');

// 定義模型關聯關係

// User 與 Post 的關聯，一對多
User.hasMany(Post, {
  foreignKey: 'user_id',
  as: 'posts',
  onDelete: 'CASCADE',
});

Post.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'author',
});

// User 與 Comment 的關聯，一對多
User.hasMany(Comment, {
  foreignKey: 'user_id',
  as: 'comments',
  onDelete: 'CASCADE',
});

Comment.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'author',
});

// Post 與 Comment 的關聯，一對多
Post.hasMany(Comment, {
  foreignKey: 'post_id',
  as: 'comments',
  onDelete: 'CASCADE',
});

Comment.belongsTo(Post, {
  foreignKey: 'post_id',
  as: 'post',
});

// 形成多對多
// User 與 Like 的關聯，一對多
User.hasMany(Like, {
  foreignKey: 'user_id',
  as: 'likes',
  onDelete: 'CASCADE',
});

Like.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// Post 與 Like 的關聯，一對多
Post.hasMany(Like, {
  foreignKey: 'post_id',
  as: 'likes',
  onDelete: 'CASCADE',
});

Like.belongsTo(Post, {
  foreignKey: 'post_id',
  as: 'post',
});

// 模型集合
const models = {
  User,
  Post,
  Comment,
  Like,
  sequelize,
};

// 同步所有模型到資料庫
// 啟動時自行同步
async function syncModels(options = {}) {
  try {
    console.log('🔄 Synchronizing models with database...');

    // 預設選項
    const syncOptions = {
      force: false, // 不刪除現有表
      alter: true, // 允許修改表結構
      ...options,
    };

    await sequelize.sync(syncOptions);

    console.log('✅ All models synchronized successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Model synchronization failed:', error);
    return { success: false, error: error.message };
  }
}

// 重置資料庫（刪除所有表並重新建立）
async function resetDatabase() {
  try {
    console.log('Resetting database...');

    await sequelize.sync({ force: true });

    console.log('✅ Database reset successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    return { success: false, error: error.message };
  }
}

// 檢查資料庫連接並同步模型
async function initializeDatabase() {
  try {
    console.log('Testing database connection');

    // 測試連接
    await sequelize.authenticate();
    console.log('Database connection successfully');

    // 同步模型
    const syncResult = await syncModels();

    if (!syncResult.success) {
      throw new Error(syncResult.error);
    }

    console.log('Database initialization completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Database initialization failed:', error);
    return { success: false, error: error.message };
  }
}

// 創建測試資料，配合 Docker-compose.yml 與 initDatabase.js 決定使用
async function createTestData() {
  try {
    console.log('📝 Creating test data...');

    // 創建測試用戶
    const testUser = await User.createUser({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      age: 25,
      city: 'Taipei',
    });

    console.log('👤 Test user created:', testUser.username);

    // 創建測試貼文
    const testPost = await Post.createPost({
      user_id: testUser.id,
      content: 'This is a test post created by Sequelize ORM!',
    });

    console.log('📝 Test post created:', testPost.id);

    // 創建測試留言
    const testComment = await Comment.createComment({
      post_id: testPost.id,
      user_id: testUser.id,
      content: 'This is a test comment!',
    });

    console.log('💬 Test comment created:', testComment.id);

    // 創建測試按讚
    const testLike = await Like.createLike(testPost.id, testUser.id);

    console.log('❤️ Test like created:', testLike?.id);

    console.log('✅ Test data created successfully');
    return {
      success: true,
      data: {
        user: testUser,
        post: testPost,
        comment: testComment,
        like: testLike,
      },
    };
  } catch (error) {
    console.error('❌ Failed to create test data:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  ...models,
  syncModels,
  resetDatabase,
  initializeDatabase,
  createTestData,
};
