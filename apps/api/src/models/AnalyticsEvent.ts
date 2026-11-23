import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../config/database";

/**
 * App-level event log. MySQL has no TTL indexes — rows are pruned by the
 * BullMQ cleanup job (apps/api/src/jobs/cleanup.ts).
 */
export class AnalyticsEvent extends Model<
  InferAttributes<AnalyticsEvent>,
  InferCreationAttributes<AnalyticsEvent>
> {
  declare id: CreationOptional<string>;
  declare type: string;
  declare postId: CreationOptional<string | null>;
  declare path: CreationOptional<string | null>;
  declare referrer: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
}

AnalyticsEvent.init(
  {
    id: { defaultValue: DataTypes.UUIDV4, primaryKey: true, type: DataTypes.UUID },
    type: { allowNull: false, type: DataTypes.STRING(60) },
    postId: { type: DataTypes.UUID },
    path: { type: DataTypes.STRING(500) },
    referrer: { type: DataTypes.STRING(500) },
    createdAt: { defaultValue: DataTypes.NOW, type: DataTypes.DATE },
  },
  {
    indexes: [{ fields: ["type", "createdAt"] }, { fields: ["postId"] }],
    modelName: "AnalyticsEvent",
    sequelize,
    tableName: "analyticsEvents",
    timestamps: false,
  },
);
