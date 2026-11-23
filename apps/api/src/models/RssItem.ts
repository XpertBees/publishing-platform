import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../config/database";

export class RssItem extends Model<InferAttributes<RssItem>, InferCreationAttributes<RssItem>> {
  declare id: CreationOptional<string>;
  /** Deduplication key — unique index, ingestion upserts on this. */
  declare guid: string;
  declare link: string;
  declare title: string;
  declare summary: CreationOptional<string | null>;
  declare sourceId: string;
  declare sourceName: string;
  declare category: string;
  declare publishedAt: CreationOptional<Date | null>;
  declare imported: CreationOptional<boolean>;
  declare postId: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
}

RssItem.init(
  {
    id: { defaultValue: DataTypes.UUIDV4, primaryKey: true, type: DataTypes.UUID },
    guid: { allowNull: false, type: DataTypes.STRING(500), unique: true },
    link: { allowNull: false, type: DataTypes.STRING(500) },
    title: { allowNull: false, type: DataTypes.STRING(500) },
    summary: { type: DataTypes.TEXT },
    sourceId: { allowNull: false, type: DataTypes.UUID },
    sourceName: { allowNull: false, type: DataTypes.STRING(120) },
    category: { allowNull: false, type: DataTypes.STRING(80) },
    publishedAt: { type: DataTypes.DATE },
    imported: { allowNull: false, defaultValue: false, type: DataTypes.BOOLEAN },
    postId: { type: DataTypes.UUID },
    createdAt: { defaultValue: DataTypes.NOW, type: DataTypes.DATE },
  },
  {
    indexes: [{ fields: ["sourceId"] }, { fields: ["publishedAt"] }],
    modelName: "RssItem",
    sequelize,
    tableName: "rssItems",
    timestamps: false,
    updatedAt: false,
  },
);
