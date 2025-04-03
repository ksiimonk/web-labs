import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";
import User from "./User";

interface EventAttributes {
  id: string;
  title: string;
  description?: string | null;
  date: Date;
  createdBy: string;
}

interface EventCreationAttributes extends Optional<EventAttributes, "id"> {}

/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *         createdBy:
 *           type: string
 *           format: uuid
 *       required:
 *         - title
 *         - date
 *         - createdBy
 */
class Event extends Model<EventAttributes, EventCreationAttributes> implements EventAttributes {
  declare id: string;
  declare title: string;
  declare description?: string | null;
  declare date: Date;
  declare createdBy: string;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Event.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
      },
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
  },
  {
    sequelize,
    modelName: "Event",
    tableName: "events",
    timestamps: true,
  },
);

User.hasMany(Event, {
  foreignKey: "createdBy",
  as: "events",
  onDelete: "CASCADE",
});

Event.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
});

export default Event;
