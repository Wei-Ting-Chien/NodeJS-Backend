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
 * 取得使用者按過愛心貼文 Integration 測試
 * 測試範圍：API 端點 → 路由 → 服務 → 資料庫
 *
 * 測試情境依據：api1.png 中的 1-5 取得使用者按過愛心的貼文規格
 */
describe('GET /users/:userId/liked-posts - 取得使用者按過愛心貼文整合測試', function () {
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

  describe('✅ 正常取得使用者按過愛心貼文情境', function () {
    it('測試案例 #1: 取得特定用戶按過愛心的貼文成功', async function () {
      // 創建兩個用戶
      const user1Data = createTestUserData({
        username: 'user1',
        email: 'user1@example.com',
        password: 'password123',
      });

      const user2Data = createTestUserData({
        username: 'user2',
        email: 'user2@example.com',
        password: 'password123',
      });

      // 註冊用戶1
      const user1Response = await request(app)
        .post('/users/register')
        .send(user1Data)
        .expect([200, 201]);

      const user1Id = user1Response.body.data.id;

      // 註冊用戶2
      const user2Response = await request(app)
        .post('/users/register')
        .send(user2Data)
        .expect([200, 201]);

      const user2Id = user2Response.body.data.id;

      // 用戶2登入
      const loginResponse = await request(app)
        .post('/users/login')
        .send({
          email: 'user2@example.com',
          password: 'password123',
        })
        .expect(200);

      const token = loginResponse.body.data.token;

      // 用戶2創建幾篇貼文
      const posts = [
        { content: '用戶2的第一篇貼文' },
        { content: '用戶2的第二篇貼文' },
        { content: '用戶2的第三篇貼文' },
      ];

      const postIds = [];
      for (const post of posts) {
        const postResponse = await request(app)
          .post('/posts')
          .set('Authorization', `Bearer ${token}`)
          .send(post)
          .expect(201);

        postIds.push(postResponse.body.data.id);
      }

      // 用戶1登入
      const user1LoginResponse = await request(app)
        .post('/users/login')
        .send({
          email: 'user1@example.com',
          password: 'password123',
        })
        .expect(200);

      const user1Token = user1LoginResponse.body.data.token;

      // 用戶1對前兩篇貼文按讚
      await request(app)
        .post(`/posts/${postIds[0]}/like`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      await request(app)
        .post(`/posts/${postIds[1]}/like`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // 取得用戶1按過愛心的貼文
      const response = await request(app)
        .get(`/users/${user1Id}/liked-posts`)
        .expect('Content-Type', /json/)
        .expect(200);

      // 驗證回應結構
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', '取得用戶按讚貼文成功');
      expect(response.body).to.have.property('data');

      // 驗證回應資料
      const { data } = response.body;
      expect(data).to.be.an('array');
      expect(data).to.have.length(2);

      // 驗證分頁資訊
      expect(response.body).to.have.property('pagination');
      expect(response.body.pagination).to.have.property('limit');
      expect(response.body.pagination).to.have.property('offset');

      // 驗證貼文內容
      const postContents = data.map(like => like.post.content);
      expect(postContents).to.include('用戶2的第一篇貼文');
      expect(postContents).to.include('用戶2的第二篇貼文');
      expect(postContents).to.not.include('用戶2的第三篇貼文');

      // 驗證貼文結構
      const firstLike = data[0];
      expect(firstLike).to.have.property('id');
      expect(firstLike).to.have.property('post_id');
      expect(firstLike).to.have.property('user_id');
      expect(firstLike).to.have.property('created_at');
      expect(firstLike).to.have.property('post');
      expect(firstLike.post).to.have.property('id');
      expect(firstLike.post).to.have.property('content');
      expect(firstLike.post).to.have.property('user_id');
      expect(firstLike.post).to.have.property('created_at');
      expect(firstLike.post).to.have.property('updated_at');
    });

    it('測試案例 #2: 取得沒有按過愛心貼文的用戶', async function () {
      // 創建一個用戶
      const userData = createTestUserData({
        username: 'nolikeuser',
        email: 'nolike@example.com',
        password: 'password123',
      });

      // 註冊用戶
      const registerResponse = await request(app)
        .post('/users/register')
        .send(userData)
        .expect([200, 201]);

      const userId = registerResponse.body.data.id;

      // 取得用戶按過愛心的貼文
      const response = await request(app)
        .get(`/users/${userId}/liked-posts`)
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
      // 嘗試取得不存在用戶按過愛心的貼文
      const nonExistentUserId = 999;

      const response = await request(app)
        .get(`/users/${nonExistentUserId}/liked-posts`)
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
    it('應該支援分頁查詢（建議每頁15篇）', async function () {
      // 創建兩個用戶
      const user1Data = createTestUserData({
        username: 'paginationuser1',
        email: 'pagination1@example.com',
        password: 'password123',
      });

      const user2Data = createTestUserData({
        username: 'paginationuser2',
        email: 'pagination2@example.com',
        password: 'password123',
      });

      // 註冊用戶
      const user1Response = await request(app)
        .post('/users/register')
        .send(user1Data)
        .expect([200, 201]);

      const user1Id = user1Response.body.data.id;

      await request(app)
        .post('/users/register')
        .send(user2Data)
        .expect([200, 201]);

      // 用戶2登入並創建貼文
      const loginResponse = await request(app)
        .post('/users/login')
        .send({
          email: 'pagination2@example.com',
          password: 'password123',
        })
        .expect(200);

      const token = loginResponse.body.data.token;

      // 創建 5 篇貼文
      const postIds = [];
      for (let i = 1; i <= 5; i++) {
        const postResponse = await request(app)
          .post('/posts')
          .set('Authorization', `Bearer ${token}`)
          .send({ content: `貼文 ${i}` })
          .expect(201);

        postIds.push(postResponse.body.data.id);
      }

      // 用戶1登入
      const user1LoginResponse = await request(app)
        .post('/users/login')
        .send({
          email: 'pagination1@example.com',
          password: 'password123',
        })
        .expect(200);

      const user1Token = user1LoginResponse.body.data.token;

      // 用戶1對所有貼文按讚
      for (const postId of postIds) {
        await request(app)
          .post(`/posts/${postId}/like`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);
      }

      // 測試第一頁（限制 2 篇）
      const firstPageResponse = await request(app)
        .get(`/users/${user1Id}/liked-posts?limit=2&offset=0`)
        .expect(200);

      expect(firstPageResponse.body.data).to.have.length(2);
      expect(firstPageResponse.body.pagination.limit).to.equal(2);
      expect(firstPageResponse.body.pagination.offset).to.equal(0);

      // 測試第二頁
      const secondPageResponse = await request(app)
        .get(`/users/${user1Id}/liked-posts?limit=2&offset=2`)
        .expect(200);

      expect(secondPageResponse.body.data).to.have.length(2);
      expect(secondPageResponse.body.pagination.offset).to.equal(2);

      // 測試第三頁
      const thirdPageResponse = await request(app)
        .get(`/users/${user1Id}/liked-posts?limit=2&offset=4`)
        .expect(200);

      expect(thirdPageResponse.body.data).to.have.length(1);
      expect(thirdPageResponse.body.pagination.offset).to.equal(4);
    });
  });

  describe('📊 額外邊界測試', function () {
    it('應該處理無效的用戶 ID 格式', async function () {
      // 嘗試使用無效的用戶 ID
      const response = await request(app)
        .get('/users/invalid-id/liked-posts')
        .expect('Content-Type', /json/)
        .expect(404);

      // 驗證錯誤回應
      expect(response.body).to.have.property('success', false);
    });

    it('應該按按讚時間排序（最新的在前）', async function () {
      // 創建兩個用戶
      const user1Data = createTestUserData({
        username: 'sortuser1',
        email: 'sort1@example.com',
        password: 'password123',
      });

      const user2Data = createTestUserData({
        username: 'sortuser2',
        email: 'sort2@example.com',
        password: 'password123',
      });

      // 註冊用戶
      const user1Response = await request(app)
        .post('/users/register')
        .send(user1Data)
        .expect([200, 201]);

      const user1Id = user1Response.body.data.id;

      await request(app)
        .post('/users/register')
        .send(user2Data)
        .expect([200, 201]);

      // 用戶2登入並創建貼文
      const loginResponse = await request(app)
        .post('/users/login')
        .send({
          email: 'sort2@example.com',
          password: 'password123',
        })
        .expect(200);

      const token = loginResponse.body.data.token;

      // 創建兩篇貼文
      const post1Response = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: '第一篇貼文' })
        .expect(201);

      const post2Response = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: '第二篇貼文' })
        .expect(201);

      // 用戶1登入
      const user1LoginResponse = await request(app)
        .post('/users/login')
        .send({
          email: 'sort1@example.com',
          password: 'password123',
        })
        .expect(200);

      const user1Token = user1LoginResponse.body.data.token;

      // 用戶1先對第一篇按讚
      await request(app)
        .post(`/posts/${post1Response.body.data.id}/like`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // 等待一秒
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 用戶1再對第二篇按讚
      await request(app)
        .post(`/posts/${post2Response.body.data.id}/like`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // 取得用戶1按過愛心的貼文
      const response = await request(app)
        .get(`/users/${user1Id}/liked-posts`)
        .expect(200);

      // 驗證排序（最新按讚的在前）
      expect(response.body.data[0].post.content).to.equal('第二篇貼文');
      expect(response.body.data[1].post.content).to.equal('第一篇貼文');
    });
  });
});
