import { DataTypes, Model, type InferAttributes, type InferCreationAttributes } from "sequelize";
import { sequelize } from "../config/database";

/** Join table for the post ↔ tag many-to-many. No surrogate id. */
export class PostTag extends Model<InferAttributes<PostTag>, InferCreationAttributes<PostTag>> {
  declare postId: string;
  declare tagId: string;
}

PostTag.init(
  {
    postId: { primaryKey: true, type: DataTypes.UUID },
    tagId: { primaryKey: true, type: DataTypes.UUID },
  },
  { modelName: "PostTag", sequelize, tableName: "postTags", timestamps: false },
);
