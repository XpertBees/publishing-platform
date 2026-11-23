import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../config/database";

export class Comment extends Model<InferAttributes<Comment>, InferCreationAttributes<Comment>> {
  declare id: CreationOptional<string>;
  declare postId: string;
  declare authorName: string;
  declare authorEmail: CreationOptional<string | null>;
  declare body: string;
  declare status: CreationOptional<"pending" | "approved" | "spam" | "rejected">;
  declare createdAt: CreationOptional<Date>;
}

Comment.init(
  {
    id: { defaultValue: DataTypes.UUIDV4, primaryKey: true, type: DataTypes.UUID },
    postId: { allowNull: false, type: DataTypes.UUID },
    authorName: { allowNull: false, type: DataTypes.STRING(120) },
    authorEmail: { type: DataTypes.STRING(190) },
    body: { allowNull: false, type: DataTypes.TEXT },
    status: {
      allowNull: false,
      defaultValue: "pending",
      type: DataTypes.ENUM("pending", "approved", "spam", "rejected"),
    },
    createdAt: { defaultValue: DataTypes.NOW, type: DataTypes.DATE },
  },
  {
    indexes: [{ fields: ["postId", "status"] }],
    modelName: "Comment",
    sequelize,
    tableName: "comments",
    timestamps: false,
  },
);
