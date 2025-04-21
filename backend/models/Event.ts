import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";
import User from "./User";

interface EventAttributes {
  id: string;
  title: string;
  description?: string | null;
  date: Date;
  createdBy: string;
  participants: string[];
  participantsCount: number;
}

interface EventCreationAttributes
  extends Optional<EventAttributes, "id" | "date" | "participants" | "participantsCount"> {}

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
 *           nullable: true
 *         date:
 *           type: string
 *           format: date-time
 *         createdBy:
 *           type: string
 *           format: uuid
 *         participants:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *         participantsCount:
 *           type: integer
 *       required:
 *         - title
 *         - date
 *         - createdBy
 *         - participants
 *         - participantsCount
 */

class Event extends Model<EventAttributes, EventCreationAttributes> implements EventAttributes {
  declare id: string;
  declare title: string;
  declare description?: string | null;
  declare date: Date;
  declare createdBy: string;
  declare participants: string[];
  declare participantsCount: number;

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
      defaultValue: DataTypes.NOW,
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
    participants: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: false,
      defaultValue: [],
    },
    participantsCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "Event",
    tableName: "events",
    timestamps: true,
    hooks: {
      beforeSave: (event) => {
        if (event.changed("participants")) {
          event.participantsCount = event.participants.length;
        }
      },
    },
  },
);

Event.belongsToMany(User, {
  through: "EventParticipants",
  as: "participantsInfo",
  foreignKey: "eventId",
  otherKey: "userId",
});

User.belongsToMany(Event, {
  through: "EventParticipants",
  as: "participatedEvents",
  foreignKey: "userId",
  otherKey: "eventId",
});

export default Event;
