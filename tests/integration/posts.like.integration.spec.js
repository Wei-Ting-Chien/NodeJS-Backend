const request = require('supertest');
const { expect } = require('chai');
const app = require('../../app');
const {
  setupTestDatabase,
  cleanupTestData,
  closeTestDatabase,
  createTestUserData,
} = require('../setup');

describe('POST /posts/:id/like - 按愛心與取消愛心功能整合測試', function () {
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
      username: 'testuser_like',
      email: 'testuser_like@example.com',
      password: 'password123',
    });

    const userResponse = await request(app)
      .post('/users/register')
      .send(userData);

    testUser = userResponse.body.data;

    // 創建測試貼文
    const postData = {
      content: '這是一篇測試貼文，用於測試按愛心與取消愛心功能',
    };

    const loginResponse = await request(app).post('/users/login').send({
      email: 'testuser_like@example.com',
      password: 'password123',
    });

    authToken = loginResponse.body.data.token;

    const postResponse = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send(postData);

    testPost = postResponse.body.data;
  });

  describe('✅ 按愛心功能測試', () => {
    it('測試案例 #1: 已登入用戶成功對指定貼文按愛心', async () => {
      const response = await request(app)
        .post(`/posts/${testPost.id}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      // 驗證回應格式
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', '按讚成功');
      expect(response.body).to.have.property('data');

      // 驗證按讚資料
      const likeData = response.body.data;
      expect(likeData).to.have.property('liked', true);
      expect(likeData).to.have.property('action', 'liked');
    });

    it('測試案例 #2: 對未按讚的貼文進行按讚操作', async () => {
      const response = await request(app)
        .post(`/posts/${testPost.id}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.data.liked).to.equal(true);
      expect(response.body.message).to.equal('按讚成功');
    });
  });

  describe('✅ 取消愛心功能測試', () => {
    it('測試案例 #3: 已登入用戶成功取消對指定貼文的愛心', async () => {
      // 先按讚
      await request(app)
        .post(`/posts/${testPost.id}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      // 再取消按讚
      const response = await request(app)
        .post(`/posts/${testPost.id}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      // 驗證回應格式
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', '取消按讚成功');
      expect(response.body).to.have.property('data');

      // 驗證取消按讚資料
      const unlikeData = response.body.data;
      expect(unlikeData).to.have.property('liked', false);
      expect(unlikeData).to.have.property('action', 'unliked');
    });

    it('測試案例 #4: 對已按讚的貼文再次按讚（切換功能）', async () => {
      // 第一次按讚
      const firstResponse = await request(app)
        .post(`/posts/${testPost.id}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(firstResponse.status).to.equal(200);
      expect(firstResponse.body.data.liked).to.equal(true);
      expect(firstResponse.body.message).to.equal('按讚成功');

      // 第二次按讚（應該會取消按讚）
      const secondResponse = await request(app)
        .post(`/posts/${testPost.id}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(secondResponse.status).to.equal(200);
      expect(secondResponse.body.data.liked).to.equal(false);
      expect(secondResponse.body.message).to.equal('取消按讚成功');
    });
  });

  describe('❌ 未授權存取情境', () => {
    it('測試案例 #5: 未登入用戶無法對貼文按愛心', async () => {
      const response = await request(app).post(`/posts/${testPost.id}/like`);

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Unauthorized access');
    });

    it('測試案例 #6: 無效的 token 無法對貼文按愛心', async () => {
      const response = await request(app)
        .post(`/posts/${testPost.id}/like`)
        .set('Authorization', 'Bearer invalid_token_123');

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Unauthorized access');
    });

    it('測試案例 #7: 未登入用戶無法取消對貼文的愛心', async () => {
      // 先按讚
      await request(app)
        .post(`/posts/${testPost.id}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      // 嘗試取消按讚（未登入）
      const response = await request(app).post(`/posts/${testPost.id}/like`);

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Unauthorized access');
    });

    it('測試案例 #8: 無效的 token 無法取消對貼文的愛心', async () => {
      // 先按讚
      await request(app)
        .post(`/posts/${testPost.id}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      // 嘗試取消按讚（無效 token）
      const response = await request(app)
        .post(`/posts/${testPost.id}/like`)
        .set('Authorization', 'Bearer invalid_token_123');

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Unauthorized access');
    });
  });

  describe('❌ 貼文不存在情境', () => {
    it('測試案例 #9: 嘗試對不存在的貼文按愛心', async () => {
      const nonExistentPostId = 99999;
      const response = await request(app)
        .post(`/posts/${nonExistentPostId}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      // 注意：根據現有程式碼，這個會回傳 400 而不是 404
      expect(response.status).to.equal(404);
      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Post does not exist');
    });

    it('測試案例 #10: 嘗試取消對不存在貼文的愛心', async () => {
      const nonExistentPostId = 99999;
      const response = await request(app)
        .post(`/posts/${nonExistentPostId}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      // 注意：根據現有程式碼，這個會回傳 400 而不是 404
      expect(response.status).to.equal(404);
      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Post does not exist');
    });
  });

  describe('📊 額外邊界測試', () => {
    it('應該處理無效的貼文 ID 格式', async () => {
      const response = await request(app)
        .post('/posts/invalid_id/like')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('success', false);
    });

    it('應該處理負數的貼文 ID', async () => {
      const response = await request(app)
        .post('/posts/-1/like')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('success', false);
    });

    it('應該處理零值的貼文 ID', async () => {
      const response = await request(app)
        .post('/posts/0/like')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('success', false);
    });
  });
});
