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
 * 取得所有貼文資訊 Integration 測試
 * 測試範圍：API 端點 → 路由 → 服務 → 資料庫
 *
 * 測試情境依據：api2.png 中的 2-2 取得所有貼文資訊規格
 */
describe('GET /posts - 取得所有貼文資訊整合測試', function () {
  // 設定測試超時時間
  this.timeout(30000);

  let authToken1, authToken2;
  let user1, user2;

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
  });

  afterEach(async function () {
    await cleanupTestData();
  });

  after(async function () {
    await closeTestDatabase();
  });

  describe('✅ 正常取得所有貼文情境', function () {
    it('測試案例 #1: 取得所有貼文成功', async function () {
      // 先創建一些測試貼文
      const postData1 = { content: '這是第一篇測試貼文' };
      const postData2 = { content: '這是第二篇測試貼文' };
      const postData3 = { content: '這是第三篇測試貼文' };

      await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(postData1)
        .expect(201);

      await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken2}`)
        .send(postData2)
        .expect(201);

      await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(postData3)
        .expect(201);

      // 取得所有貼文
      const response = await request(app)
        .get('/posts')
        .expect('Content-Type', /json/)
        .expect(200);

      // 驗證回應結構
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', '取得貼文成功');
      expect(response.body).to.have.property('data');
      expect(response.body).to.have.property('pagination');

      // 驗證回應資料
      const { data, pagination } = response.body;
      expect(data).to.be.an('array');
      expect(data).to.have.length(3);

      // 驗證貼文資料結構
      data.forEach(post => {
        expect(post).to.have.property('id');
        expect(post).to.have.property('content');
        expect(post).to.have.property('created_at');
        expect(post).to.have.property('updated_at');
        expect(post).to.have.property('author');
        expect(post.author).to.have.property('username');
        expect(post).to.have.property('comments');
        expect(post).to.have.property('likes_count');
      });

      // 驗證分頁資訊
      expect(pagination).to.have.property('limit');
      expect(pagination).to.have.property('offset');
      expect(pagination.limit).to.be.a('number');
      expect(pagination.offset).to.be.a('number');
    });

    it('測試案例 #2: 取得空貼文列表', async function () {
      // 不創建任何貼文，直接取得列表
      const response = await request(app)
        .get('/posts')
        .expect('Content-Type', /json/)
        .expect(200);

      // 驗證回應結構
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', '取得貼文成功');
      expect(response.body).to.have.property('data');
      expect(response.body).to.have.property('pagination');

      // 驗證回應資料
      const { data, pagination } = response.body;
      expect(data).to.be.an('array');
      expect(data).to.have.length(0);

      // 驗證分頁資訊
      expect(pagination).to.have.property('limit');
      expect(pagination).to.have.property('offset');
    });
  });

  describe('📊 分頁功能測試', function () {
    it('測試案例 #3: 支援分頁查詢', async function () {
      // 創建多篇貼文
      const posts = [];
      for (let i = 1; i <= 20; i++) {
        posts.push({ content: `這是第${i}篇測試貼文` });
      }

      // 批量創建貼文
      for (const postData of posts) {
        await request(app)
          .post('/posts')
          .set('Authorization', `Bearer ${authToken1}`)
          .send(postData)
          .expect(201);
      }

      // 測試第一頁（預設15篇）
      const response1 = await request(app)
        .get('/posts?limit=15&offset=0')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response1.body.data).to.have.length(15);
      expect(response1.body.pagination.limit).to.equal(15);
      expect(response1.body.pagination.offset).to.equal(0);

      // 測試第二頁
      const response2 = await request(app)
        .get('/posts?limit=15&offset=15')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response2.body.data).to.have.length(5); // 剩餘5篇
      expect(response2.body.pagination.limit).to.equal(15);
      expect(response2.body.pagination.offset).to.equal(15);
    });

    it('測試案例 #4: 自定義分頁參數', async function () {
      // 創建10篇貼文
      for (let i = 1; i <= 10; i++) {
        await request(app)
          .post('/posts')
          .set('Authorization', `Bearer ${authToken1}`)
          .send({ content: `這是第${i}篇測試貼文` })
          .expect(201);
      }

      // 測試自定義分頁
      const response = await request(app)
        .get('/posts?limit=5&offset=3')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.data).to.have.length(5);
      expect(response.body.pagination.limit).to.equal(5);
      expect(response.body.pagination.offset).to.equal(3);
    });
  });

  describe('📊 額外邊界測試', function () {
    it('應該處理無效的分頁參數', async function () {
      const response = await request(app)
        .get('/posts?limit=invalid&offset=invalid')
        .expect('Content-Type', /json/)
        .expect(400); // 無效參數應該返回錯誤

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Request format error');
    });

    it('應該按發布時間排序（最新的在前）', async function () {
      // 創建貼文並等待時間差
      await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ content: '第一篇貼文' })
        .expect(201);

      // 等待1秒
      await new Promise(resolve => setTimeout(resolve, 1000));

      await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ content: '第二篇貼文' })
        .expect(201);

      // 取得貼文列表
      const response = await request(app).get('/posts').expect(200);

      const { data } = response.body;
      expect(data).to.have.length(2);

      // 驗證排序（最新的在前）
      const firstPost = new Date(data[0].created_at);
      const secondPost = new Date(data[1].created_at);
      expect(firstPost.getTime()).to.be.greaterThan(secondPost.getTime());
    });
  });
});
