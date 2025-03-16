const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const User = require("./User");

const Event = sequelize.define("Event", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: "id",
        },
    },
});

// Связь "Один ко многим"
User.hasMany(Event, { foreignKey: "createdBy", onDelete: "CASCADE" });
Event.belongsTo(User, { foreignKey: "createdBy" });

module.exports = Event;
