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
 * 用戶註冊 Integration 測試
 * 測試範圍：API 端點 → 路由 → 服務 → 資料庫
 *
 * 測試情境依據：vibe-story/13-test_spec.md
 */
describe('POST /users/register - 用戶註冊整合測試', function () {
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

  describe('✅ 正常註冊情境', function () {
    it('測試案例 #1: 正常註冊成功', async function () {
      // 準備測試資料
      const userData = createTestUserData({
        username: 'alice',
        email: 'alice@example.com',
        password: 'secret6',
        age: 20,
        city: 'Taipei',
      });

      // 執行註冊請求
      const response = await request(app)
        .post('/users/register')
        .send(userData)
        .expect('Content-Type', /json/);

      // 驗證回應狀態碼（201 或 200）
      expect([200, 201]).to.include(response.status);

      // 驗證回應結構
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', '註冊成功');
      expect(response.body).to.have.property('data');

      // 驗證回應資料
      const { data } = response.body;
      expect(data).to.have.property('id');
      expect(data).to.have.property('username', userData.username);
      expect(data).to.have.property('email', userData.email);
      expect(data).to.have.property('age', userData.age);
      expect(data).to.have.property('city', userData.city);
      expect(data).to.not.have.property('password');
      expect(data).to.not.have.property('password_hash');
    });
  });

  describe('❌ 重複資料錯誤情境', function () {
    it('測試案例 #2: 帳號（username）已存在', async function () {
      // 先創建一個用戶
      const existingUser = createTestUserData({
        username: 'alice',
        email: 'alice@example.com',
        password: 'secret6',
      });

      await request(app)
        .post('/users/register')
        .send(existingUser)
        .expect([200, 201]);

      // 嘗試使用相同 username 再次註冊
      const duplicateUser = createTestUserData({
        username: 'alice', // 相同的 username
        email: 'alice2@example.com', // 不同的 email
        password: 'secret7',
      });

      const response = await request(app)
        .post('/users/register')
        .send(duplicateUser)
        .expect('Content-Type', /json/)
        .expect(400);

      // 驗證錯誤回應
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property(
        'message',
        'Account already exists',
      );
    });

    it('測試案例 #3: Email 已存在', async function () {
      // 先創建一個用戶
      const existingUser = createTestUserData({
        username: 'alice',
        email: 'alice@example.com',
        password: 'secret6',
      });

      await request(app)
        .post('/users/register')
        .send(existingUser)
        .expect([200, 201]);

      // 嘗試使用相同 email 再次註冊
      const duplicateUser = createTestUserData({
        username: 'alice2', // 不同的 username
        email: 'alice@example.com', // 相同的 email
        password: 'secret7',
      });

      const response = await request(app)
        .post('/users/register')
        .send(duplicateUser)
        .expect('Content-Type', /json/)
        .expect(400);

      // 驗證錯誤回應
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Email already exists');
    });
  });

  describe('❌ 密碼驗證錯誤情境', function () {
    it('測試案例 #4: 密碼太短 (< 6)', async function () {
      const userData = createTestUserData({
        password: '12345', // 只有 5 個字符
      });

      const response = await request(app)
        .post('/users/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);

      // 驗證錯誤回應
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.match(
        /password 長度不符|密碼至少需要 6 個字符/i,
      );
    });

    it('測試案例 #5: 密碼太長 (> 12)', async function () {
      const userData = createTestUserData({
        password: 'thisIsWayTooLong', // 16 個字符，超過 12
      });

      const response = await request(app)
        .post('/users/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);

      // 驗證錯誤回應
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.match(
        /password 長度不符|密碼不能超過 12 個字符/i,
      );
    });
  });

  describe('❌ 必填欄位缺失錯誤情境', function () {
    it('測試案例 #6: 缺少 username', async function () {
      const userData = createTestUserData();
      delete userData.username; // 移除 username 欄位

      const response = await request(app)
        .post('/users/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);

      // 驗證錯誤回應
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.match(/username 為必填|用戶名為必填項/i);
    });

    it('測試案例 #7: 缺少 email', async function () {
      const userData = createTestUserData();
      delete userData.email; // 移除 email 欄位

      const response = await request(app)
        .post('/users/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);

      // 驗證錯誤回應
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.match(/email 為必填|郵箱為必填項/i);
    });

    it('測試案例 #8: 缺少 password', async function () {
      const userData = createTestUserData();
      delete userData.password; // 移除 password 欄位

      const response = await request(app)
        .post('/users/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);

      // 驗證錯誤回應
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.match(/password 為必填|密碼為必填項/i);
    });
  });

  describe('📊 額外邊界測試', function () {
    it('應該接受最小有效密碼長度 (6 字符)', async function () {
      const userData = createTestUserData({
        password: '123456', // 剛好 6 個字符
      });

      const response = await request(app)
        .post('/users/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect([200, 201]);

      expect(response.body).to.have.property('success', true);
    });

    it('應該接受最大有效密碼長度 (12 字符)', async function () {
      const userData = createTestUserData({
        password: '123456789012', // 剛好 12 個字符
      });

      const response = await request(app)
        .post('/users/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect([200, 201]);

      expect(response.body).to.have.property('success', true);
    });

    it('應該接受沒有 age 和 city 的註冊', async function () {
      const userData = createTestUserData();
      delete userData.age;
      delete userData.city;

      const response = await request(app)
        .post('/users/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect([200, 201]);

      expect(response.body).to.have.property('success', true);
      expect(response.body.data).to.have.property(
        'username',
        userData.username,
      );
    });
  });
});
