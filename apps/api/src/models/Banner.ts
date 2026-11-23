import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../config/database";

export class Banner extends Model<InferAttributes<Banner>, InferCreationAttributes<Banner>> {
  declare id: CreationOptional<string>;
  declare title: string;
  declare imageUrl: string;
  declare linkUrl: CreationOptional<string | null>;
  declare placement: string;
  declare active: CreationOptional<boolean>;
  declare startsAt: CreationOptional<Date | null>;
  declare endsAt: CreationOptional<Date | null>;
  declare clicks: CreationOptional<number>;
  declare impressions: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Banner.init(
  {
    id: { defaultValue: DataTypes.UUIDV4, primaryKey: true, type: DataTypes.UUID },
    title: { allowNull: false, type: DataTypes.STRING(120) },
    imageUrl: { allowNull: false, type: DataTypes.STRING(500) },
    linkUrl: { type: DataTypes.STRING(500) },
    placement: { allowNull: false, type: DataTypes.STRING(80) },
    active: { allowNull: false, defaultValue: true, type: DataTypes.BOOLEAN },
    startsAt: { type: DataTypes.DATE },
    endsAt: { type: DataTypes.DATE },
    clicks: { allowNull: false, defaultValue: 0, type: DataTypes.INTEGER },
    impressions: { allowNull: false, defaultValue: 0, type: DataTypes.INTEGER },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    indexes: [{ fields: ["placement", "active"] }],
    modelName: "Banner",
    sequelize,
    tableName: "banners",
  },
);
