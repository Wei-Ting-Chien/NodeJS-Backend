const request = require('supertest');
const { expect } = require('chai');
const app = require('../../app');
const {
  setupTestDatabase,
  cleanupTestData,
  closeTestDatabase,
  createTestUserData,
} = require('../setup');

describe('POST /posts/:id/comments - 留言功能整合測試', function () {
  let testUser, testPost, authToken;

  // 設定測試超時時間
  this.timeout(30000);

  before(async function () {
    await setupTestDatabase();
  });

  afterEach(async function () {
    await cleanupTestData();
  });

  after(async function () {
    await closeTestDatabase();
  });

  beforeEach(async function () {
    // 創建測試用戶
    const userData = createTestUserData({
      username: 'testuser_comment',
      email: 'testuser_comment@example.com',
      password: 'password123',
    });

    const userResponse = await request(app)
      .post('/users/register')
      .send(userData);

    // 檢查用戶註冊是否成功
    if (!userResponse.body.success || !userResponse.body.data) {
      console.error('❌ 用戶註冊失敗:', userResponse.body);
      throw new Error('User registration failed');
    }

    testUser = userResponse.body.data;
    console.log('✅ 測試用戶創建成功:', {
      id: testUser.id,
      username: testUser.username,
    });

    // 創建測試貼文
    const postData = {
      content: '這是一篇測試貼文，用於測試留言功能',
    };

    const loginResponse = await request(app).post('/users/login').send({
      email: 'testuser_comment@example.com',
      password: 'password123',
    });

    // 檢查登入是否成功
    if (!loginResponse.body.success || !loginResponse.body.data.token) {
      console.error('❌ 用戶登入失敗:', loginResponse.body);
      throw new Error('User login failed');
    }

    authToken = loginResponse.body.data.token;
    console.log('✅ 用戶登入成功，取得 token');

    const postResponse = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send(postData);

    // 檢查貼文創建是否成功
    if (!postResponse.body.success || !postResponse.body.data) {
      console.error('❌ 貼文創建失敗:', postResponse.body);
      throw new Error('Post creation failed');
    }

    testPost = postResponse.body.data;
    console.log('✅ 測試貼文創建成功:', {
      id: testPost.id,
      content: testPost.content,
    });

    // 最終檢查所有測試資料是否正確設定
    if (!testUser || !testUser.id) {
      throw new Error('testUser is not properly set');
    }
    if (!testPost || !testPost.id) {
      throw new Error('testPost is not properly set');
    }
    if (!authToken) {
      throw new Error('authToken is not properly set');
    }
  });

  describe('✅ 正常留言成功情境', () => {
    it('測試案例 #1: 已登入用戶成功對指定貼文新增留言', async () => {
      const commentContent = '這是一個測試留言，內容符合150字符限制';

      const response = await request(app)
        .post(`/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: commentContent,
        });

      // 驗證回應格式
      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', '留言創建成功');
      expect(response.body).to.have.property('data');

      // 驗證留言資料完整性
      const comment = response.body.data;
      expect(comment).to.have.property('id');
      expect(comment).to.have.property('content', commentContent);
      expect(comment).to.have.property('user_id', testUser.id);
      expect(comment).to.have.property('post_id', testPost.id);
      expect(comment).to.have.property('created_at');
      expect(comment).to.have.property('updated_at');

      // 驗證留言者資訊（如果有的話）
      if (comment.user) {
        expect(comment.user).to.have.property('id', testUser.id);
        expect(comment.user).to.have.property('username', testUser.username);
      }
    });
  });

  describe('❌ 未授權存取情境', () => {
    it('測試案例 #2: 未登入用戶無法對貼文新增留言', async () => {
      const response = await request(app)
        .post(`/posts/${testPost.id}/comments`)
        .send({
          content: '未登入用戶的留言',
        });

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Unauthorized access');
    });

    it('測試案例 #3: 無效的 token 無法對貼文新增留言', async () => {
      const response = await request(app)
        .post(`/posts/${testPost.id}/comments`)
        .set('Authorization', 'Bearer invalid_token_123')
        .send({
          content: '無效token的留言',
        });

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Unauthorized access');
    });
  });

  describe('❌ 內容驗證錯誤情境', () => {
    it('測試案例 #4: 內容超過150字符無法新增留言', async () => {
      const longContent =
        '這是一個超過150字符的留言內容，用來測試系統的字符限制功能。'.repeat(
          10,
        );

      const response = await request(app)
        .post(`/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: longContent,
        });

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Request format error');
    });

    it('測試案例 #5: 內容為空無法新增留言', async () => {
      const response = await request(app)
        .post(`/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '',
        });

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Request format error');
    });

    it('測試案例 #6: 缺少內容欄位無法新增留言', async () => {
      const response = await request(app)
        .post(`/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Request format error');
    });
  });

  describe('📊 額外邊界測試', () => {
    it('應該處理內容為空字串的情況', async () => {
      const response = await request(app)
        .post(`/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '   ', // 只有空白字符
        });

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Request format error');
    });

    it('應該處理內容為 null 的情況', async () => {
      const response = await request(app)
        .post(`/posts/${testPost.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: null,
        });

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('success', false);
    });

    it('應該處理貼文不存在的情況', async () => {
      const nonExistentPostId = 99999;
      const response = await request(app)
        .post(`/posts/${nonExistentPostId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '對不存在貼文的留言',
        });

      // 注意：根據現有程式碼，這個會回傳 400 而不是 404
      expect(response.status).to.equal(404);
      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Post does not exist');
    });
  });
});
