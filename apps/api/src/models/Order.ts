import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../config/database";

export class Order extends Model<InferAttributes<Order>, InferCreationAttributes<Order>> {
  declare id: CreationOptional<string>;
  declare productId: string;
  declare productName: string;
  declare buyerEmail: string;
  declare amount: number;
  declare currency: CreationOptional<string>;
  declare status: CreationOptional<"pending" | "paid" | "failed" | "refunded">;
  declare provider: CreationOptional<string | null>;
  declare providerRef: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Order.init(
  {
    id: { defaultValue: DataTypes.UUIDV4, primaryKey: true, type: DataTypes.UUID },
    productId: { allowNull: false, type: DataTypes.UUID },
    productName: { allowNull: false, type: DataTypes.STRING(160) },
    buyerEmail: { allowNull: false, type: DataTypes.STRING(190) },
    amount: { allowNull: false, type: DataTypes.INTEGER },
    currency: { allowNull: false, defaultValue: "INR", type: DataTypes.STRING(10) },
    status: {
      allowNull: false,
      defaultValue: "pending",
      type: DataTypes.ENUM("pending", "paid", "failed", "refunded"),
    },
    provider: { type: DataTypes.STRING(80) },
    providerRef: { type: DataTypes.STRING(190) },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    indexes: [{ fields: ["productId"] }, { fields: ["buyerEmail"] }],
    modelName: "Order",
    sequelize,
    tableName: "orders",
  },
);
