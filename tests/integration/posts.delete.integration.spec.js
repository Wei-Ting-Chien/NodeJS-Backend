const { expect } = require('chai');
const request = require('supertest');
const app = require('../../app');
const {
  setupTestDatabase,
  cleanupTestData,
  closeTestDatabase,
  createTestUserData,
} = require('../setup');

/**
 * 刪除貼文 Integration 測試
 * 測試範圍：API 端點 → 路由 → 服務 → 資料庫
 *
 * 測試情境依據：api2.png 中的 2-5 刪除貼文規格
 */
describe('DELETE /posts/:id - 刪除貼文整合測試', function () {
  // 設定測試超時時間
  this.timeout(30000);

  let authToken1, authToken2;
  let user1, user2;
  let post1, post2;

  before(async function () {
    await setupTestDatabase();
  });

  beforeEach(async function () {
    // 創建兩個測試用戶
    const userData1 = createTestUserData({
      username: 'user1',
      email: 'user1@example.com',
      password: 'password123',
    });

    const userData2 = createTestUserData({
      username: 'user2',
      email: 'user2@example.com',
      password: 'password123',
    });

    // 註冊用戶
    await request(app)
      .post('/users/register')
      .send(userData1)
      .expect([200, 201]);

    await request(app)
      .post('/users/register')
      .send(userData2)
      .expect([200, 201]);

    // 登入獲取 token
    const loginResponse1 = await request(app)
      .post('/users/login')
      .send({
        email: 'user1@example.com',
        password: 'password123',
      })
      .expect(200);

    const loginResponse2 = await request(app)
      .post('/users/login')
      .send({
        email: 'user2@example.com',
        password: 'password123',
      })
      .expect(200);

    authToken1 = loginResponse1.body.data.token;
    authToken2 = loginResponse2.body.data.token;
    user1 = loginResponse1.body.data.user;
    user2 = loginResponse2.body.data.user;

    // 創建測試貼文
    const postData1 = { content: '這是用戶1的測試貼文' };
    const postData2 = { content: '這是用戶2的測試貼文' };

    const postResponse1 = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${authToken1}`)
      .send(postData1)
      .expect(201);

    const postResponse2 = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${authToken2}`)
      .send(postData2)
      .expect(201);

    post1 = postResponse1.body.data;
    post2 = postResponse2.body.data;
  });

  afterEach(async function () {
    await cleanupTestData();
  });

  after(async function () {
    await closeTestDatabase();
  });

  describe('✅ 正常刪除貼文情境', function () {
    it('測試案例 #1: 已登入用戶成功刪除自己的貼文', async function () {
      const response = await request(app)
        .delete(`/posts/${post1.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect('Content-Type', /json/)
        .expect(200);

      // 驗證回應結構
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', '貼文刪除成功');

      // 驗證貼文已被刪除
      const getResponse = await request(app)
        .get(`/posts/${post1.id}`)
        .expect(404);

      expect(getResponse.body).to.have.property('success', false);
      expect(getResponse.body).to.have.property(
        'message',
        'Post does not exist',
      );
    });
  });

  describe('❌ 未授權存取情境', function () {
    it('測試案例 #2: 未登入用戶無法刪除貼文', async function () {
      const response = await request(app)
        .delete(`/posts/${post1.id}`)
        .expect('Content-Type', /json/)
        .expect(401);

      // 驗證錯誤回應
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Unauthorized access');

      // 驗證貼文仍然存在
      const getResponse = await request(app)
        .get(`/posts/${post1.id}`)
        .expect(200);

      expect(getResponse.body).to.have.property('success', true);
    });

    it('測試案例 #3: 無效 token 無法刪除貼文', async function () {
      const response = await request(app)
        .delete(`/posts/${post1.id}`)
        .set('Authorization', 'Bearer invalid_token_here')
        .expect('Content-Type', /json/)
        .expect(401);

      // 驗證錯誤回應
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Unauthorized access');

      // 驗證貼文仍然存在
      const getResponse = await request(app)
        .get(`/posts/${post1.id}`)
        .expect(200);

      expect(getResponse.body).to.have.property('success', true);
    });
  });

  describe('❌ 權限不足情境', function () {
    it('測試案例 #4: 嘗試刪除他人的貼文', async function () {
      const response = await request(app)
        .delete(`/posts/${post2.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect('Content-Type', /json/)
        .expect(401);

      // 驗證錯誤回應
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Unauthorized access');

      // 驗證貼文仍然存在
      const getResponse = await request(app)
        .get(`/posts/${post2.id}`)
        .expect(200);

      expect(getResponse.body).to.have.property('success', true);
    });
  });

  describe('❌ 貼文不存在情境', function () {
    it('測試案例 #5: 嘗試刪除不存在的貼文 ID', async function () {
      const nonExistentId = 99999;

      const response = await request(app)
        .delete(`/posts/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect('Content-Type', /json/)
        .expect(404);

      // 驗證錯誤回應
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Post does not exist');
    });

    it('測試案例 #6: 嘗試刪除無效的貼文 ID 格式', async function () {
      const invalidId = 'invalid';

      const response = await request(app)
        .delete(`/posts/${invalidId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect('Content-Type', /json/)
        .expect(400);

      // 驗證錯誤回應
      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Request format error');
    });
  });

  describe('📊 額外邊界測試', function () {
    it('應該處理負數的貼文 ID', async function () {
      const negativeId = -1;

      const response = await request(app)
        .delete(`/posts/${negativeId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Request format error');
    });

    it('應該處理零值的貼文 ID', async function () {
      const zeroId = 0;

      const response = await request(app)
        .delete(`/posts/${zeroId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Request format error');
    });

    it('應該處理極大數值的貼文 ID', async function () {
      const hugeId = 999999999;

      const response = await request(app)
        .delete(`/posts/${hugeId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Post does not exist');
    });

    it('應該處理已刪除的貼文再次刪除', async function () {
      // 先刪除貼文
      await request(app)
        .delete(`/posts/${post1.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      // 再次嘗試刪除同一貼文
      const response = await request(app)
        .delete(`/posts/${post1.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Post does not exist');
    });
  });
});
