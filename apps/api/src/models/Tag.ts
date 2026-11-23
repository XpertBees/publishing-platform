import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../config/database";

export class Tag extends Model<InferAttributes<Tag>, InferCreationAttributes<Tag>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare slug: string;
  declare createdAt: CreationOptional<Date>;
}

Tag.init(
  {
    id: { defaultValue: DataTypes.UUIDV4, primaryKey: true, type: DataTypes.UUID },
    name: { allowNull: false, type: DataTypes.STRING(60) },
    slug: { allowNull: false, type: DataTypes.STRING(60), unique: true },
    createdAt: { defaultValue: DataTypes.NOW, type: DataTypes.DATE },
  },
  { modelName: "Tag", sequelize, tableName: "tags", timestamps: false },
);
