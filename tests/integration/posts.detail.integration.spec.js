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
 * 取得特定貼文資訊 Integration 測試
 * 測試範圍：API 端點 → 路由 → 服務 → 資料庫
 *
 * 測試情境依據：api2.png 中的 2-3 取得特定貼文資訊規格
 */
describe('GET /posts/:id - 取得特定貼文資訊整合測試', function () {
  // 設定測試超時時間
  this.timeout(30000);

  let authToken;
  let testUser;
  let testPost;

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

    // 創建測試貼文
    const postData = {
      content: '這是一篇測試貼文內容',
    };

    const postResponse = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send(postData)
      .expect(201);

    testPost = postResponse.body.data;
  });

  afterEach(async function () {
    await cleanupTestData();
  });

  after(async function () {
    await closeTestDatabase();
  });

  describe('✅ 正常取得特定貼文情境', function () {
    it('測試案例 #1: 取得特定貼文成功', async function () {
      const response = await request(app)
        .get(`/posts/${testPost.id}`)
        .expect('Content-Type', /json/)
        .expect(200);

      // 驗證回應結構
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', '取得貼文成功');
      expect(response.body).to.have.property('data');

      // 驗證回應資料
      const { data } = response.body;
      expect(data).to.have.property('id', testPost.id);
      expect(data).to.have.property('content', testPost.content);
      expect(data).to.have.property('created_at');
      expect(data).to.have.property('updated_at');
      expect(data).to.have.property('author');
      expect(data.author).to.have.property('username', testUser.username);
      expect(data).to.have.property('comments');
      expect(data).to.have.property('likes_count');

      // 驗證資料類型
      expect(data.comments).to.be.an('array');
      expect(data.likes_count).to.be.a('number');
      expect(data.likes_count).to.equal(0); // 新貼文沒有按讚
    });

    it('測試案例 #2: 未登入用戶也能取得貼文', async function () {
      const response = await request(app)
        .get(`/posts/${testPost.id}`)
        .expect('Content-Type', /json/)
        .expect(200);

      // 驗證回應結構
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', '取得貼文成功');
      expect(response.body).to.have.property('data');

      // 驗證回應資料
      const { data } = response.body;
      expect(data).to.have.property('id', testPost.id);
      expect(data).to.have.property('content', testPost.content);
      expect(data).to.have.property('author');
      expect(data.author).to.have.property('username', testUser.username);
    });
  });

  describe('❌ 貼文不存在情境', function () {
    it('測試案例 #3: 查詢不存在的貼文 ID', async function () {
      const nonExistentId = 99999;

      const response = await request(app)
        .get(`/posts/${nonExistentId}`)
        .expect('Content-Type', /json/)
        .expect(404);

      // 驗證錯誤回應
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Post does not exist');
    });

    it('測試案例 #4: 查詢無效的貼文 ID 格式', async function () {
      const invalidId = 'invalid';

      const response = await request(app)
        .get(`/posts/${invalidId}`)
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
        .get(`/posts/${negativeId}`)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Request format error');
    });

    it('應該處理零值的貼文 ID', async function () {
      const zeroId = 0;

      const response = await request(app)
        .get(`/posts/${zeroId}`)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Request format error');
    });

    it('應該處理極大數值的貼文 ID', async function () {
      const hugeId = 999999999;

      const response = await request(app)
        .get(`/posts/${hugeId}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Post does not exist');
    });
  });
});
