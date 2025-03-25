const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = sequelize.define("User", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    lastLoginIp: {
        type: DataTypes.STRING,
    },
    ipHistory: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
    },
    deviceHistory: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
    },
    notificationPreferences: {
        type: DataTypes.JSONB,
        defaultValue: { newDeviceAlert: true },
    },
});

User.beforeCreate(async (user) => {
    if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
    }
});

User.prototype.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

User.hashDevice = function(ua) {
    return crypto.createHash("sha256").update(ua).digest("hex");
};

module.exports = User;