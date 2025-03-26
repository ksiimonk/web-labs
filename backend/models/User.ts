import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "@config/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

interface UserAttributes {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt?: Date;
  lastLoginIp?: string | null;
  ipHistory?: string[];
  deviceHistory?: string[];
  notificationPreferences?: {
    newDeviceAlert: boolean;
  };
}

interface UserCreationAttributes extends Optional<UserAttributes, "id" | "createdAt" | "ipHistory" | "deviceHistory" | "notificationPreferences"> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare name: string;
  declare email: string;
  declare password: string;
  declare createdAt: Date;
  declare lastLoginIp?: string | null;
  declare ipHistory: string[];
  declare deviceHistory: string[];
  declare notificationPreferences: {
    newDeviceAlert: boolean;
  };

  declare readonly updatedAt: Date;

  public async comparePassword(candidatePassword: string): Promise<boolean> {
    if (!this.password) throw new Error("Password not set");
    return bcrypt.compare(candidatePassword, this.password);
  }

  public static hashDevice(ua: string): string {
    return crypto.createHash("sha256").update(ua || "unknown").digest("hex");
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [8, 100],
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    lastLoginIp: {
      type: DataTypes.STRING,
      allowNull: true,
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
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true,
    defaultScope: {
      attributes: { exclude: ["password"] },
    },
    scopes: {
      withPassword: {
        attributes: { include: ["password"] },
      },
    },
  },
);

User.beforeCreate(async (user: User) => {
  if (!user.password) throw new Error("Password is required");
  const salt = await bcrypt.genSalt(12);
  user.password = await bcrypt.hash(user.password, salt);
  
  user.ipHistory = user.ipHistory || [];
  user.deviceHistory = user.deviceHistory || [];
  user.notificationPreferences = user.notificationPreferences || { newDeviceAlert: true };
});

User.beforeUpdate(async (user: User) => {
  if (user.changed('password')) {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

export default User;