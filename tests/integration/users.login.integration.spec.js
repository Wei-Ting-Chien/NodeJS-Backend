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
 * 用戶登入 Integration 測試
 * 測試範圍：API 端點 → 路由 → 服務 → 資料庫
 *
 * 測試情境依據：api1.png 中的 1-2 登入規格
 */
describe('POST /users/login - 用戶登入整合測試', function () {
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

  describe('✅ 正常登入情境', function () {
    it('測試案例 #1: 正常登入成功', async function () {
      // 先創建一個用戶
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

      // 執行登入請求
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/users/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(200);

      // 驗證回應結構
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', '登入成功');
      expect(response.body).to.have.property('data');

      // 驗證回應資料
      const { data } = response.body;
      expect(data).to.have.property('token');
      expect(data).to.have.property('user');

      // 驗證用戶資料
      const { user } = data;
      expect(user).to.have.property('id');
      expect(user).to.have.property('username', userData.username);
      expect(user).to.have.property('email', userData.email);
      expect(user).to.not.have.property('password');
      expect(user).to.not.have.property('password_hash');

      // 驗證 JWT Token 格式
      expect(data.token).to.be.a('string');
      expect(data.token).to.have.length.greaterThan(0);
    });
  });

  describe('❌ 帳號密碼錯誤情境', function () {
    it('測試案例 #2: 帳號不存在', async function () {
      // 嘗試登入不存在的帳號
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/users/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(404);

      // 驗證錯誤回應
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property(
        'message',
        'Account does not exist',
      );
    });

    it('測試案例 #3: 密碼錯誤', async function () {
      // 先創建一個用戶
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

      // 嘗試使用錯誤密碼登入
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app)
        .post('/users/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(401);

      // 驗證錯誤回應
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property(
        'message',
        'Incorrect account or password',
      );
    });
  });

  describe('❌ 必填欄位缺失錯誤情境', function () {
    it('測試案例 #4: 缺少 email', async function () {
      const loginData = {
        password: 'password123',
        // 缺少 email 欄位
      };

      const response = await request(app)
        .post('/users/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(400);

      // 驗證錯誤回應
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.match(/郵箱為必填項|email.*required/i);
    });

    it('測試案例 #5: 缺少 password', async function () {
      const loginData = {
        email: 'test@example.com',
        // 缺少 password 欄位
      };

      const response = await request(app)
        .post('/users/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(400);

      // 驗證錯誤回應
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.match(
        /密碼為必填項|password.*required/i,
      );
    });
  });

  describe('📊 額外邊界測試', function () {
    it('應該拒絕無效的 email 格式', async function () {
      const loginData = {
        email: 'invalid-email-format',
        password: 'password123',
      };

      const response = await request(app)
        .post('/users/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.match(
        /請提供有效的郵箱地址|email.*valid/i,
      );
    });

    it('應該處理空字串的 email', async function () {
      const loginData = {
        email: '',
        password: 'password123',
      };

      const response = await request(app)
        .post('/users/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).to.have.property('success', false);
    });

    it('應該處理空字串的 password', async function () {
      const loginData = {
        email: 'test@example.com',
        password: '',
      };

      const response = await request(app)
        .post('/users/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).to.have.property('success', false);
    });

    it('應該處理空物件請求', async function () {
      const loginData = {};

      const response = await request(app)
        .post('/users/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).to.have.property('success', false);
    });
  });
});
