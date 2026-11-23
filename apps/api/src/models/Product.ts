import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../config/database";

export class Product extends Model<InferAttributes<Product>, InferCreationAttributes<Product>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare slug: string;
  declare description: CreationOptional<string | null>;
  /** Price in minor units (paise/cents). */
  declare price: number;
  declare currency: CreationOptional<string>;
  declare fileUrl: CreationOptional<string | null>;
  declare coverImage: CreationOptional<string | null>;
  declare active: CreationOptional<boolean>;
  declare sales: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Product.init(
  {
    id: { defaultValue: DataTypes.UUIDV4, primaryKey: true, type: DataTypes.UUID },
    name: { allowNull: false, type: DataTypes.STRING(160) },
    slug: { allowNull: false, type: DataTypes.STRING(120), unique: true },
    description: { type: DataTypes.TEXT },
    price: { allowNull: false, type: DataTypes.INTEGER },
    currency: { allowNull: false, defaultValue: "INR", type: DataTypes.STRING(10) },
    fileUrl: { type: DataTypes.STRING(500) },
    coverImage: { type: DataTypes.STRING(500) },
    active: { allowNull: false, defaultValue: true, type: DataTypes.BOOLEAN },
    sales: { allowNull: false, defaultValue: 0, type: DataTypes.INTEGER },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { modelName: "Product", sequelize, tableName: "products" },
);
