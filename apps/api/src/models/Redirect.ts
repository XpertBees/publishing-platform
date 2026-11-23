import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../config/database";

export class Redirect extends Model<InferAttributes<Redirect>, InferCreationAttributes<Redirect>> {
  declare id: CreationOptional<string>;
  declare from: string;
  declare to: string;
  declare statusCode: CreationOptional<number>;
  declare active: CreationOptional<boolean>;
  declare hits: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Redirect.init(
  {
    id: { defaultValue: DataTypes.UUIDV4, primaryKey: true, type: DataTypes.UUID },
    from: { allowNull: false, type: DataTypes.STRING(500), unique: true },
    to: { allowNull: false, type: DataTypes.STRING(500) },
    statusCode: { allowNull: false, defaultValue: 301, type: DataTypes.INTEGER },
    active: { allowNull: false, defaultValue: true, type: DataTypes.BOOLEAN },
    hits: { allowNull: false, defaultValue: 0, type: DataTypes.INTEGER },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { modelName: "Redirect", sequelize, tableName: "redirects" },
);
