import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../config/database";

/** Single-row table — the service layer upserts the row with id "default". */
export class SiteSettings extends Model<
  InferAttributes<SiteSettings>,
  InferCreationAttributes<SiteSettings>
> {
  declare id: CreationOptional<string>;
  declare siteName: CreationOptional<string>;
  declare tagline: CreationOptional<string | null>;
  declare logoUrl: CreationOptional<string | null>;
  declare faviconUrl: CreationOptional<string | null>;
  declare primaryColor: CreationOptional<string>;
  declare adsenseClientId: CreationOptional<string | null>;
  declare gaMeasurementId: CreationOptional<string | null>;
  declare socialLinks: CreationOptional<Record<string, string> | null>;
  declare updatedAt: CreationOptional<Date>;
}

SiteSettings.init(
  {
    id: { defaultValue: DataTypes.UUIDV4, primaryKey: true, type: DataTypes.UUID },
    siteName: { allowNull: false, defaultValue: "The Daily Pulse", type: DataTypes.STRING(120) },
    tagline: { type: DataTypes.STRING(200) },
    logoUrl: { type: DataTypes.STRING(500) },
    faviconUrl: { type: DataTypes.STRING(500) },
    primaryColor: { allowNull: false, defaultValue: "#1d4ed8", type: DataTypes.STRING(20) },
    adsenseClientId: { type: DataTypes.STRING(80) },
    gaMeasurementId: { type: DataTypes.STRING(40) },
    socialLinks: { type: DataTypes.JSON },
    updatedAt: DataTypes.DATE,
  },
  { modelName: "SiteSettings", sequelize, tableName: "siteSettings", timestamps: false },
);
