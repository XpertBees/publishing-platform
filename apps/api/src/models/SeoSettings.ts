import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../config/database";

/** Single-row table — the service layer upserts the row with id "default". */
export class SeoSettings extends Model<
  InferAttributes<SeoSettings>,
  InferCreationAttributes<SeoSettings>
> {
  declare id: CreationOptional<string>;
  declare defaultTitle: string;
  declare defaultDescription: string;
  declare defaultOgImage: CreationOptional<string | null>;
  declare twitterHandle: CreationOptional<string | null>;
  declare googleNewsEnabled: CreationOptional<boolean>;
  declare robotsTxt: CreationOptional<string | null>;
  declare updatedAt: CreationOptional<Date>;
}

SeoSettings.init(
  {
    id: { defaultValue: DataTypes.UUIDV4, primaryKey: true, type: DataTypes.UUID },
    defaultTitle: { allowNull: false, type: DataTypes.STRING(160) },
    defaultDescription: { allowNull: false, type: DataTypes.TEXT },
    defaultOgImage: { type: DataTypes.STRING(500) },
    twitterHandle: { type: DataTypes.STRING(80) },
    googleNewsEnabled: { allowNull: false, defaultValue: true, type: DataTypes.BOOLEAN },
    robotsTxt: { type: DataTypes.TEXT },
    updatedAt: DataTypes.DATE,
  },
  { modelName: "SeoSettings", sequelize, tableName: "seoSettings", timestamps: false },
);
