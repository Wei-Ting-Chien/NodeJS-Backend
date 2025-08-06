require('dotenv').config();

const config = {
  // 應用程式配置
  app: {
    port: parseInt(process.env.PORT) || 3000,
    env: process.env.NODE_ENV,
    // 跨域請求控制
    corsOrigin: process.env.CORS_ORIGIN,
  },

  // 資料庫配置
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    name: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    // 動態獲取 Database URL
    get url() {
      return (
        process.env.DATABASE_URL ||
        `postgresql://${this.username}:${this.password}@${this.host}:${this.port}/${this.name}?schema=public`
      );
    },
  },

  // JWT 配置
  jwt: {
    // 這個是測試用的，正式環境要改成用強隨機 Secret
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // 安全性配置
  security: {
    // 密碼迭代 12 Round, 遵守 OWASP 標準
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  },

  // 速率限制配置，防止 DDOS 或高流量
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500000,
  },
};

module.exports = config;
