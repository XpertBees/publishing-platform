import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../config/database";

export class AffiliateLink extends Model<
  InferAttributes<AffiliateLink>,
  InferCreationAttributes<AffiliateLink>
> {
  declare id: CreationOptional<string>;
  declare title: string;
  declare targetUrl: string;
  /** Public redirect path: /go/<slug>. */
  declare slug: string;
  declare category: CreationOptional<string | null>;
  declare clicks: CreationOptional<number>;
  declare active: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

AffiliateLink.init(
  {
    id: { defaultValue: DataTypes.UUIDV4, primaryKey: true, type: DataTypes.UUID },
    title: { allowNull: false, type: DataTypes.STRING(160) },
    targetUrl: { allowNull: false, type: DataTypes.STRING(1000) },
    slug: { allowNull: false, type: DataTypes.STRING(80), unique: true },
    category: { type: DataTypes.STRING(80) },
    clicks: { allowNull: false, defaultValue: 0, type: DataTypes.INTEGER },
    active: { allowNull: false, defaultValue: true, type: DataTypes.BOOLEAN },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { modelName: "AffiliateLink", sequelize, tableName: "affiliateLinks" },
);
