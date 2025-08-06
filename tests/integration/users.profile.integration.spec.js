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
 * 用戶個人資料取得 Integration 測試
 * 測試範圍：API 端點 → 路由 → 服務 → 資料庫
 *
 * 測試情境依據：api1.png 中的 1-3 取得個人資料規格
 */
describe('GET /users/profile - 用戶個人資料取得整合測試', function () {
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

  describe('✅ 正常取得個人資料情境', function () {
    it('測試案例 #1: 已登入用戶取得個人資料成功', async function () {
      // 先創建一個用戶
      const userData = createTestUserData({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        age: 25,
        city: 'Taipei',
      });

      // 註冊用戶
      await request(app)
        .post('/users/register')
        .send(userData)
        .expect([200, 201]);

      // 登入取得 token
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const loginResponse = await request(app)
        .post('/users/login')
        .send(loginData)
        .expect(200);

      const token = loginResponse.body.data.token;

      // 使用 token 取得個人資料
      const response = await request(app)
        .get('/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(200);

      // 驗證回應結構
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', '取得個人資料成功');
      expect(response.body).to.have.property('data');

      // 驗證回應資料
      const { data } = response.body;
      expect(data).to.have.property('id');
      expect(data).to.have.property('username', userData.username);
      expect(data).to.have.property('email', userData.email);
      expect(data).to.have.property('age', userData.age);
      expect(data).to.have.property('city', userData.city);
      expect(data).to.have.property('created_at');
      expect(data).to.have.property('updated_at');

      // 驗證不包含敏感資訊
      expect(data).to.not.have.property('password');
      expect(data).to.not.have.property('password_hash');
    });
  });

  describe('❌ 未授權存取情境', function () {
    it('測試案例 #2: 未登入用戶無法取得個人資料', async function () {
      // 直接請求個人資料而不提供 token
      const response = await request(app)
        .get('/users/profile')
        .expect('Content-Type', /json/)
        .expect(401);

      // 驗證錯誤回應
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Unauthorized access');
    });

    it('測試案例 #3: 無效的 token 無法取得個人資料', async function () {
      // 使用無效的 token
      const invalidToken = 'invalid.token.here';

      const response = await request(app)
        .get('/users/profile')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect('Content-Type', /json/)
        .expect(401);

      // 驗證錯誤回應
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Unauthorized access');
    });
  });

  describe('❌ 用戶不存在情境', function () {
    it('測試案例 #4: 查詢不存在的用戶帳號', async function () {
      // 創建一個用戶並登入
      const userData = createTestUserData({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      await request(app)
        .post('/users/register')
        .send(userData)
        .expect([200, 201]);

      const loginResponse = await request(app)
        .post('/users/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      const token = loginResponse.body.data.token;

      // 刪除用戶（模擬用戶不存在的情況）
      await cleanupTestData();

      // 嘗試取得個人資料
      const response = await request(app)
        .get('/users/profile')
        .set('Authorization', `Bearer ${token}`)
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

  describe('📊 額外邊界測試', function () {
    it('應該處理沒有 age 和 city 的用戶資料', async function () {
      // 創建沒有 age 和 city 的用戶
      const userData = {
        username: 'simpleuser',
        email: 'simple@example.com',
        password: 'password123',
        // 不包含 age 和 city
      };

      // 註冊用戶
      await request(app)
        .post('/users/register')
        .send(userData)
        .expect([200, 201]);

      // 登入取得 token
      const loginResponse = await request(app)
        .post('/users/login')
        .send({
          email: 'simple@example.com',
          password: 'password123',
        })
        .expect(200);

      const token = loginResponse.body.data.token;

      // 取得個人資料
      const response = await request(app)
        .get('/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // 驗證回應
      expect(response.body.data).to.have.property('username', 'simpleuser');
      expect(response.body.data).to.have.property(
        'email',
        'simple@example.com',
      );
      // age 和 city 應該是 null 或 undefined
      expect(response.body.data.age).to.be.oneOf([null, undefined]);
      expect(response.body.data.city).to.be.oneOf([null, undefined]);
    });
  });
});
