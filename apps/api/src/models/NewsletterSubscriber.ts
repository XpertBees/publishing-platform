import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../config/database";

export class NewsletterSubscriber extends Model<
  InferAttributes<NewsletterSubscriber>,
  InferCreationAttributes<NewsletterSubscriber>
> {
  declare id: CreationOptional<string>;
  declare email: string;
  declare status: CreationOptional<"subscribed" | "unsubscribed">;
  declare source: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
}

NewsletterSubscriber.init(
  {
    id: { defaultValue: DataTypes.UUIDV4, primaryKey: true, type: DataTypes.UUID },
    email: { allowNull: false, type: DataTypes.STRING(190), unique: true },
    status: {
      allowNull: false,
      defaultValue: "subscribed",
      type: DataTypes.ENUM("subscribed", "unsubscribed"),
    },
    source: { type: DataTypes.STRING(80) },
    createdAt: { defaultValue: DataTypes.NOW, type: DataTypes.DATE },
  },
  {
    modelName: "NewsletterSubscriber",
    sequelize,
    tableName: "newsletterSubscribers",
    timestamps: false,
  },
);
