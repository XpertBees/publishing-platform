import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../config/database";

export class RssSource extends Model<
  InferAttributes<RssSource>,
  InferCreationAttributes<RssSource>
> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare url: string;
  declare category: string;
  declare active: CreationOptional<boolean>;
  declare fetchIntervalMinutes: CreationOptional<number>;
  declare lastFetchedAt: CreationOptional<Date | null>;
  declare lastItemCount: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

RssSource.init(
  {
    id: { defaultValue: DataTypes.UUIDV4, primaryKey: true, type: DataTypes.UUID },
    name: { allowNull: false, type: DataTypes.STRING(120) },
    url: { allowNull: false, type: DataTypes.STRING(500) },
    category: { allowNull: false, type: DataTypes.STRING(80) },
    active: { allowNull: false, defaultValue: true, type: DataTypes.BOOLEAN },
    fetchIntervalMinutes: { allowNull: false, defaultValue: 15, type: DataTypes.INTEGER },
    lastFetchedAt: { type: DataTypes.DATE },
    lastItemCount: { allowNull: false, defaultValue: 0, type: DataTypes.INTEGER },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { modelName: "RssSource", sequelize, tableName: "rssSources" },
);
