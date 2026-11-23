import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../config/database";

export class Author extends Model<InferAttributes<Author>, InferCreationAttributes<Author>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare slug: string;
  declare bio: CreationOptional<string | null>;
  declare avatar: CreationOptional<string | null>;
  declare role: CreationOptional<string | null>;
  declare socials: CreationOptional<Record<string, string> | null>;
  declare userId: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Author.init(
  {
    id: { defaultValue: DataTypes.UUIDV4, primaryKey: true, type: DataTypes.UUID },
    name: { allowNull: false, type: DataTypes.STRING(120) },
    slug: { allowNull: false, type: DataTypes.STRING(120), unique: true },
    bio: { type: DataTypes.TEXT },
    avatar: { type: DataTypes.STRING(500) },
    role: { type: DataTypes.STRING(80) },
    socials: { type: DataTypes.JSON },
    userId: { type: DataTypes.UUID, unique: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { modelName: "Author", sequelize, tableName: "authors" },
);
