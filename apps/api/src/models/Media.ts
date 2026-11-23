import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../config/database";

export class Media extends Model<InferAttributes<Media>, InferCreationAttributes<Media>> {
  declare id: CreationOptional<string>;
  declare filename: string;
  declare url: string;
  declare mimeType: string;
  declare size: number;
  declare width: CreationOptional<number | null>;
  declare height: CreationOptional<number | null>;
  declare alt: CreationOptional<string | null>;
  declare uploadedBy: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
}

Media.init(
  {
    id: { defaultValue: DataTypes.UUIDV4, primaryKey: true, type: DataTypes.UUID },
    filename: { allowNull: false, type: DataTypes.STRING(255) },
    url: { allowNull: false, type: DataTypes.STRING(500) },
    mimeType: { allowNull: false, type: DataTypes.STRING(100) },
    size: { allowNull: false, type: DataTypes.INTEGER },
    width: { type: DataTypes.INTEGER },
    height: { type: DataTypes.INTEGER },
    alt: { type: DataTypes.STRING(255) },
    uploadedBy: { type: DataTypes.UUID },
    createdAt: { defaultValue: DataTypes.NOW, type: DataTypes.DATE },
  },
  {
    indexes: [{ fields: ["uploadedBy"] }],
    modelName: "Media",
    sequelize,
    tableName: "media",
    timestamps: false,
  },
);
