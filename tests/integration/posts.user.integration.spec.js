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
 * 取得使用者貼文 Integration 測試
 * 測試範圍：API 端點 → 路由 → 服務 → 資料庫
 *
 * 測試情境依據：api1.png 中的 1-4 取得使用者的貼文規格
 */
describe('GET /posts/user/:userId - 取得使用者貼文整合測試', function () {
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

  describe('✅ 正常取得使用者貼文情境', function () {
    it('測試案例 #1: 取得特定用戶的所有貼文成功', async function () {
      // 先創建一個用戶
      const userData = createTestUserData({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      // 註冊用戶
      const registerResponse = await request(app)
        .post('/users/register')
        .send(userData)
        .expect([200, 201]);

      const userId = registerResponse.body.data.id;

      // 登入取得 token
      const loginResponse = await request(app)
        .post('/users/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      const token = loginResponse.body.data.token;

      // 創建幾篇貼文
      const posts = [
        { content: '這是第一篇貼文' },
        { content: '這是第二篇貼文' },
        { content: '這是第三篇貼文' },
      ];

      for (const post of posts) {
        await request(app)
          .post('/posts')
          .set('Authorization', `Bearer ${token}`)
          .send(post)
          .expect(201);
      }

      // 取得用戶的貼文
      const response = await request(app)
        .get(`/posts/user/${userId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      // 驗證回應結構
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', '取得用戶貼文成功');
      expect(response.body).to.have.property('data');

      // 驗證回應資料
      const { data } = response.body;
      expect(data).to.be.an('array');
      expect(data).to.have.length(3);

      // 驗證分頁資訊
      expect(response.body).to.have.property('pagination');
      expect(response.body.pagination).to.have.property('limit');
      expect(response.body.pagination).to.have.property('offset');

      // 驗證貼文內容
      const postContents = data.map(post => post.content);
      expect(postContents).to.include('這是第一篇貼文');
      expect(postContents).to.include('這是第二篇貼文');
      expect(postContents).to.include('這是第三篇貼文');

      // 驗證貼文結構
      const firstPost = data[0];
      expect(firstPost).to.have.property('id');
      expect(firstPost).to.have.property('content');
      expect(firstPost.author).to.have.property('username', userData.username);
      expect(firstPost).to.have.property('created_at');
      expect(firstPost).to.have.property('updated_at');
      expect(firstPost).to.have.property('likes_count');
      expect(firstPost).to.have.property('comments');
      expect(firstPost.comments).to.be.an('array');
    });

    it('測試案例 #2: 取得沒有貼文的用戶', async function () {
      // 創建一個用戶但不發布貼文
      const userData = createTestUserData({
        username: 'emptyuser',
        email: 'empty@example.com',
        password: 'password123',
      });

      // 註冊用戶
      const registerResponse = await request(app)
        .post('/users/register')
        .send(userData)
        .expect([200, 201]);

      const userId = registerResponse.body.data.id;

      // 取得用戶的貼文
      const response = await request(app)
        .get(`/posts/user/${userId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      // 驗證回應
      expect(response.body).to.have.property('success', true);
      expect(response.body.data).to.be.an('array');
      expect(response.body.data).to.have.length(0);
    });
  });

  describe('❌ 用戶不存在情境', function () {
    it('測試案例 #3: 查詢不存在的用戶帳號', async function () {
      // 嘗試取得不存在用戶的貼文
      const nonExistentUserId = 999;

      const response = await request(app)
        .get(`/posts/user/${nonExistentUserId}`)
        .expect('Content-Type', /json/)
        .expect(404);

      // 驗證錯誤回應
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property(
        'message',
        'Account does not exist',
      );
    });
  });

  describe('📊 分頁功能測試', function () {
    it('應該支援分頁查詢', async function () {
      // 創建用戶
      const userData = createTestUserData({
        username: 'paginationuser',
        email: 'pagination@example.com',
        password: 'password123',
      });

      const registerResponse = await request(app)
        .post('/users/register')
        .send(userData)
        .expect([200, 201]);

      const userId = registerResponse.body.data.id;

      // 登入
      const loginResponse = await request(app)
        .post('/users/login')
        .send({
          email: 'pagination@example.com',
          password: 'password123',
        })
        .expect(200);

      const token = loginResponse.body.data.token;

      // 創建 5 篇貼文
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post('/posts')
          .set('Authorization', `Bearer ${token}`)
          .send({ content: `貼文 ${i}` })
          .expect(201);
      }

      // 測試第一頁（限制 2 篇）
      const firstPageResponse = await request(app)
        .get(`/posts/user/${userId}?limit=2&offset=0`)
        .expect(200);

      expect(firstPageResponse.body.data).to.have.length(2);
      expect(firstPageResponse.body.pagination.limit).to.equal(2);
      expect(firstPageResponse.body.pagination.offset).to.equal(0);

      // 測試第二頁
      const secondPageResponse = await request(app)
        .get(`/posts/user/${userId}?limit=2&offset=2`)
        .expect(200);

      expect(secondPageResponse.body.data).to.have.length(2);
      expect(secondPageResponse.body.pagination.offset).to.equal(2);
    });
  });

  describe('📊 額外邊界測試', function () {
    it('應該處理無效的用戶 ID 格式', async function () {
      // 嘗試使用無效的用戶 ID
      const response = await request(app)
        .get('/posts/user/invalid-id')
        .expect('Content-Type', /json/)
        .expect(400);

      // 驗證錯誤回應
      expect(response.body).to.have.property('success', false);
    });

    it('應該按發布時間排序（最新的在前）', async function () {
      // 創建用戶
      const userData = createTestUserData({
        username: 'sortuser',
        email: 'sort@example.com',
        password: 'password123',
      });

      const registerResponse = await request(app)
        .post('/users/register')
        .send(userData)
        .expect([200, 201]);

      const userId = registerResponse.body.data.id;

      // 登入
      const loginResponse = await request(app)
        .post('/users/login')
        .send({
          email: 'sort@example.com',
          password: 'password123',
        })
        .expect(200);

      const token = loginResponse.body.data.token;

      // 創建貼文
      await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: '第一篇' })
        .expect(201);

      // 等待一秒
      await new Promise(resolve => setTimeout(resolve, 1000));

      await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: '第二篇' })
        .expect(201);

      // 取得貼文
      const response = await request(app)
        .get(`/posts/user/${userId}`)
        .expect(200);

      // 驗證排序（最新的在前）
      expect(response.body.data[0].content).to.equal('第二篇');
      expect(response.body.data[1].content).to.equal('第一篇');
    });
  });
});
