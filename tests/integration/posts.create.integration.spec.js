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
 * 發布貼文 Integration 測試
 * 測試範圍：API 端點 → 路由 → 服務 → 資料庫
 *
 * 測試情境依據：api2.png 中的 2-1 發布貼文規格
 */
describe('POST /posts - 發布貼文整合測試', function () {
  // 設定測試超時時間
  this.timeout(30000);

  let authToken;
  let testUser;

  before(async function () {
    await setupTestDatabase();
  });

  beforeEach(async function () {
    // 創建測試用戶並登入
    const userData = createTestUserData({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });

    // 註冊用戶
    await request(app)
      .post('/users/register')
      .send(userData)
      .expect([200, 201]);

    // 登入獲取 token
    const loginResponse = await request(app)
      .post('/users/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      })
      .expect(200);

    authToken = loginResponse.body.data.token;
    testUser = loginResponse.body.data.user;
  });

  afterEach(async function () {
    await cleanupTestData();
  });

  after(async function () {
    await closeTestDatabase();
  });

  describe('✅ 正常發布貼文情境', function () {
    it('測試案例 #1: 已登入用戶成功發布貼文', async function () {
      const postData = {
        content: '這是一篇測試貼文內容',
      };

      const response = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect('Content-Type', /json/)
        .expect(201);

      // 驗證回應結構
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', '貼文創建成功');
      expect(response.body).to.have.property('data');

      // 驗證回應資料
      const { data } = response.body;
      expect(data).to.have.property('id');
      expect(data).to.have.property('content', postData.content);
      expect(data).to.have.property('created_at');
      expect(data).to.have.property('updated_at');

      // 驗證貼文 ID 為數字
      expect(data.id).to.be.a('number');
      expect(data.id).to.be.greaterThan(0);

      // 驗證時間格式
      expect(data.created_at).to.be.a('string');
      expect(data.updated_at).to.be.a('string');
    });
  });

  describe('❌ 未授權存取情境', function () {
    it('測試案例 #2: 未登入用戶無法發布貼文', async function () {
      const postData = {
        content: '這是一篇測試貼文內容',
      };

      const response = await request(app)
        .post('/posts')
        .send(postData)
        .expect('Content-Type', /json/)
        .expect(401);

      // 驗證錯誤回應
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Unauthorized access');
    });

    it('測試案例 #3: 無效 token 無法發布貼文', async function () {
      const postData = {
        content: '這是一篇測試貼文內容',
      };

      const response = await request(app)
        .post('/posts')
        .set('Authorization', 'Bearer invalid_token_here')
        .send(postData)
        .expect('Content-Type', /json/)
        .expect(401);

      // 驗證錯誤回應
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Unauthorized access');
    });
  });

  describe('❌ 內容驗證錯誤情境', function () {
    it('測試案例 #4: 內容為空無法發布貼文', async function () {
      const postData = {
        content: '',
      };

      const response = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect('Content-Type', /json/)
        .expect(400);

      // 驗證錯誤回應
      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Request format error');
    });

    it('測試案例 #5: 內容超過300字符無法發布貼文', async function () {
      // 創建超過300字符的內容
      const longContent = 'a'.repeat(301); // 確保超過300字符

      const postData = {
        content: longContent,
      };

      const response = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect('Content-Type', /json/)
        .expect(400);

      // 驗證錯誤回應
      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Request format error');
    });

    it('測試案例 #6: 缺少內容欄位無法發布貼文', async function () {
      const postData = {};

      const response = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect('Content-Type', /json/)
        .expect(400);

      // 驗證錯誤回應
      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Request format error');
    });
  });

  describe('📊 額外邊界測試', function () {
    it('應該處理內容為空字串的情況', async function () {
      const postData = {
        content: '   ', // 只有空白字符
      };

      const response = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).to.have.property('success', false);
    });

    it('應該處理內容為 null 的情況', async function () {
      const postData = {
        content: null,
      };

      const response = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).to.have.property('success', false);
    });
  });
});
