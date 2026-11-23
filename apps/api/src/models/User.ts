import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../config/database";

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare email: string;
  declare passwordHash: string;
  declare role: CreationOptional<
    | "super_admin"
    | "admin"
    | "editor"
    | "author"
    | "news_editor"
    | "seo_manager"
    | "marketing_manager"
    | "analyst"
  >;
  declare isActive: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

User.init(
  {
    id: { defaultValue: DataTypes.UUIDV4, primaryKey: true, type: DataTypes.UUID },
    name: { allowNull: false, type: DataTypes.STRING(120) },
    email: { allowNull: false, type: DataTypes.STRING(190), unique: true },
    passwordHash: { allowNull: false, type: DataTypes.STRING(255) },
    role: {
      allowNull: false,
      defaultValue: "author",
      type: DataTypes.ENUM(
        "super_admin",
        "admin",
        "editor",
        "author",
        "news_editor",
        "seo_manager",
        "marketing_manager",
        "analyst",
      ),
    },
    isActive: { allowNull: false, defaultValue: true, type: DataTypes.BOOLEAN },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { modelName: "User", sequelize, tableName: "users" },
);
