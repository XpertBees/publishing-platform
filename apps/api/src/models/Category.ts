import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../config/database";

export class Category extends Model<InferAttributes<Category>, InferCreationAttributes<Category>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare slug: string;
  declare description: CreationOptional<string | null>;
  declare parentId: CreationOptional<string | null>;
  declare order: CreationOptional<number>;
  declare isVertical: CreationOptional<boolean>;
  declare seo: CreationOptional<Record<string, unknown> | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Category.init(
  {
    id: { defaultValue: DataTypes.UUIDV4, primaryKey: true, type: DataTypes.UUID },
    name: { allowNull: false, type: DataTypes.STRING(80) },
    slug: { allowNull: false, type: DataTypes.STRING(80), unique: true },
    description: { type: DataTypes.TEXT },
    parentId: { type: DataTypes.UUID },
    order: { allowNull: false, defaultValue: 0, type: DataTypes.INTEGER },
    isVertical: { allowNull: false, defaultValue: false, type: DataTypes.BOOLEAN },
    seo: { type: DataTypes.JSON },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { modelName: "Category", sequelize, tableName: "categories" },
);
