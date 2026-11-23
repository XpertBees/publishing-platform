import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../config/database";

/**
 * Admin activity log. MySQL has no TTL indexes — rows are pruned by the
 * BullMQ cleanup job (apps/api/src/jobs/cleanup.ts).
 */
export class AuditLog extends Model<InferAttributes<AuditLog>, InferCreationAttributes<AuditLog>> {
  declare id: CreationOptional<string>;
  declare userId: CreationOptional<string | null>;
  declare action: string;
  declare entity: string;
  declare entityId: CreationOptional<string | null>;
  declare meta: CreationOptional<Record<string, unknown> | null>;
  declare createdAt: CreationOptional<Date>;
}

AuditLog.init(
  {
    id: { defaultValue: DataTypes.UUIDV4, primaryKey: true, type: DataTypes.UUID },
    userId: { type: DataTypes.UUID },
    action: { allowNull: false, type: DataTypes.STRING(120) },
    entity: { allowNull: false, type: DataTypes.STRING(80) },
    entityId: { type: DataTypes.STRING(100) },
    meta: { type: DataTypes.JSON },
    createdAt: { defaultValue: DataTypes.NOW, type: DataTypes.DATE },
  },
  {
    indexes: [{ fields: ["entity", "createdAt"] }, { fields: ["userId"] }],
    modelName: "AuditLog",
    sequelize,
    tableName: "auditLogs",
    timestamps: false,
  },
);
