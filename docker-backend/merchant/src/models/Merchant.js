const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

/**
 * 商家模型
 * 用于管理商家账户信息
 */
module.exports = (sequelize, DataTypes) => {
    const Merchant = sequelize.define('Merchant', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                len: [3, 50]
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        address: {
            type: DataTypes.STRING,
            allowNull: true
        },
        businessLicense: {
            type: DataTypes.STRING,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'suspended'),
            defaultValue: 'active'
        },
        avatar: {
            type: DataTypes.STRING,
            allowNull: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        shopName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        shopLogo: {
            type: DataTypes.STRING,
            allowNull: true
        },
        shopBanner: {
            type: DataTypes.STRING,
            allowNull: true
        },
        shopDescription: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        businessHours: {
            type: DataTypes.STRING,
            allowNull: true
        },
        deliveryFee: {
            type: DataTypes.FLOAT,
            allowNull: true,
            defaultValue: 0
        },
        minOrderAmount: {
            type: DataTypes.FLOAT,
            allowNull: true,
            defaultValue: 0
        },
        role: {
            type: DataTypes.ENUM('merchant', 'admin'),
            defaultValue: 'merchant'
        },
        lastLoginAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        lastLogoutAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        loginAttempts: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        lockUntil: {
            type: DataTypes.DATE,
            allowNull: true
        },
        resetPasswordToken: {
            type: DataTypes.STRING,
            allowNull: true
        },
        resetPasswordExpires: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        timestamps: true,
        hooks: {
            beforeCreate: async (merchant) => {
                if (merchant.password) {
                    const salt = await bcrypt.genSalt(10);
                    merchant.password = await bcrypt.hash(merchant.password, salt);
                }
            },
            beforeUpdate: async (merchant) => {
                if (merchant.changed('password')) {
                    const salt = await bcrypt.genSalt(10);
                    merchant.password = await bcrypt.hash(merchant.password, salt);
                }
            }
        }
    });

    /**
     * 比较密码是否匹配
     * @param {string} candidatePassword - 待验证的密码
     * @returns {boolean} - 密码是否匹配
     */
    Merchant.prototype.comparePassword = async function(candidatePassword) {
        return bcrypt.compare(candidatePassword, this.password);
    };

    /**
     * 生成重置密码的令牌
     */
    Merchant.prototype.generateResetToken = function() {
        const token = require('crypto').randomBytes(20).toString('hex');
        this.resetPasswordToken = token;
        this.resetPasswordExpires = Date.now() + 3600000; // 1小时内有效
        return token;
    };

    /**
     * 重置密码
     * @param {string} newPassword - 新密码
     */
    Merchant.prototype.resetPassword = async function(newPassword) {
        this.password = newPassword;
        this.resetPasswordToken = null;
        this.resetPasswordExpires = null;
        this.loginAttempts = 0;
        this.lockUntil = null;
        return this.save();
    };

    /**
     * 检查商家是否被锁定
     * @returns {boolean} - 是否被锁定
     */
    Merchant.prototype.isLocked = function() {
        return this.lockUntil && this.lockUntil > new Date();
    };

    return Merchant;
}; 