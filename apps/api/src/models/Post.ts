import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../config/database";

export class Post extends Model<InferAttributes<Post>, InferCreationAttributes<Post>> {
  declare id: CreationOptional<string>;
  declare slug: string;
  declare title: string;
  declare headline: CreationOptional<string | null>;
  declare summary: CreationOptional<string | null>;
  /** Structured rich-text blocks (portable JSON, not raw HTML). */
  declare body: CreationOptional<Record<string, unknown>[] | Record<string, unknown> | null>;
  declare featuredImage: CreationOptional<string | null>;
  declare gallery: CreationOptional<string[] | null>;
  declare externalUrl: CreationOptional<string | null>;
  declare ctaLabel: CreationOptional<string>;
  declare categoryId: string;
  declare authorId: CreationOptional<string | null>;
  declare postType: CreationOptional<
    | "editorial"
    | "news"
    | "link_card"
    | "product_recommendation"
    | "sponsored"
    | "guide"
    | "review"
    | "comparison"
    | "digital_product"
  >;
  declare language: CreationOptional<string>;
  declare status: CreationOptional<"draft" | "review" | "published" | "scheduled">;
  declare publishedAt: CreationOptional<Date | null>;
  declare seo: CreationOptional<Record<string, unknown> | null>;
  declare sponsored: CreationOptional<boolean>;
  declare affiliateDisclosure: CreationOptional<boolean>;
  declare canonicalUrl: CreationOptional<string | null>;
  declare sourceName: CreationOptional<string | null>;
  declare sourceUrl: CreationOptional<string | null>;
  declare views: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Post.init(
  {
    id: { defaultValue: DataTypes.UUIDV4, primaryKey: true, type: DataTypes.UUID },
    slug: { allowNull: false, type: DataTypes.STRING(190), unique: true },
    title: { allowNull: false, type: DataTypes.STRING(255) },
    headline: { type: DataTypes.STRING(200) },
    summary: { type: DataTypes.TEXT },
    body: { type: DataTypes.JSON },
    featuredImage: { type: DataTypes.STRING(500) },
    gallery: { type: DataTypes.JSON },
    externalUrl: { type: DataTypes.STRING(500) },
    ctaLabel: { allowNull: false, defaultValue: "Read More", type: DataTypes.STRING(80) },
    categoryId: { allowNull: false, type: DataTypes.UUID },
    authorId: { type: DataTypes.UUID },
    postType: {
      allowNull: false,
      type: DataTypes.ENUM(
        "editorial",
        "news",
        "link_card",
        "product_recommendation",
        "sponsored",
        "guide",
        "review",
        "comparison",
        "digital_product",
      ),
    },
    language: { allowNull: false, defaultValue: "en", type: DataTypes.STRING(10) },
    status: {
      allowNull: false,
      defaultValue: "draft",
      type: DataTypes.ENUM("draft", "review", "published", "scheduled"),
    },
    publishedAt: { type: DataTypes.DATE },
    seo: { type: DataTypes.JSON },
    sponsored: { allowNull: false, defaultValue: false, type: DataTypes.BOOLEAN },
    affiliateDisclosure: { allowNull: false, defaultValue: false, type: DataTypes.BOOLEAN },
    canonicalUrl: { type: DataTypes.STRING(500) },
    sourceName: { type: DataTypes.STRING(120) },
    sourceUrl: { type: DataTypes.STRING(500) },
    views: { allowNull: false, defaultValue: 0, type: DataTypes.INTEGER },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    indexes: [
      { fields: ["categoryId"] },
      { fields: ["authorId"] },
      { fields: ["status", "publishedAt"] },
      { fields: ["postType"] },
    ],
    modelName: "Post",
    sequelize,
    tableName: "posts",
  },
);
