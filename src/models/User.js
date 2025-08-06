const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

// 定義 User 模型
const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
      validate: {
        len: [3, 50],
        notEmpty: true,
      },
    },
    email: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 150,
      },
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: async user => {
        if (user.password) {
          user.password_hash = await bcrypt.hash(
            user.password,
            config.security.bcryptRounds,
          );
          delete user.dataValues.password; // 移除明文密碼
        }
      },
      beforeUpdate: async user => {
        if (user.password) {
          user.password_hash = await bcrypt.hash(
            user.password,
            config.security.bcryptRounds,
          );
          delete user.dataValues.password; // 移除明文密碼
        }
      },
    },
  },
);

// 創建用戶（保持向後兼容）
User.createUser = async function (userData) {
  try {
    // 手動處理密碼雜湊
    const { password, ...otherData } = userData;
    const password_hash = await bcrypt.hash(
      password,
      config.security.bcryptRounds,
    );

    const user = await User.create({
      ...otherData,
      password_hash,
    });

    // 返回不含密碼的用戶資料
    const { password_hash: _, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// 根據 Email 查找用戶
User.findByEmail = async function (email) {
  try {
    const user = await User.findOne({
      where: { email },
    });
    return user ? user.toJSON() : null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
};

// 根據 ID 查找用戶
User.findById = async function (id) {
  try {
    const user = await User.findByPk(id);
    return user ? user.toJSON() : null;
  } catch (error) {
    console.error('Error finding user by id:', error);
    throw error;
  }
};

// 根據用戶名查找用戶
User.findByUsername = async function (username) {
  try {
    const user = await User.findOne({
      where: { username },
    });
    return user ? user.toJSON() : null;
  } catch (error) {
    console.error('Error finding user by username:', error);
    throw error;
  }
};

// 更新用戶
User.updateUser = async function (id, updateData) {
  try {
    const [affectedRows] = await User.update(updateData, {
      where: { id },
      returning: true,
    });

    if (affectedRows === 0) {
      return null;
    }

    const updatedUser = await User.findByPk(id);
    const { password_hash, ...userWithoutPassword } = updatedUser.toJSON();
    return userWithoutPassword;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// 驗證密碼
User.verifyPassword = async function (user, password) {
  try {
    return await bcrypt.compare(password, user.password_hash);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
};

// 生成 JWT Token
User.generateToken = function (user) {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

// 驗證 JWT Token
User.verifyToken = function (token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    return null;
  }
};

module.exports = User;
