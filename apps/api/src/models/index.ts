import { sequelize } from "../config/database";
import { AffiliateLink } from "./AffiliateLink";
import { AnalyticsEvent } from "./AnalyticsEvent";
import { AuditLog } from "./AuditLog";
import { Author } from "./Author";
import { Banner } from "./Banner";
import { Category } from "./Category";
import { Comment } from "./Comment";
import { Media } from "./Media";
import { NewsletterSubscriber } from "./NewsletterSubscriber";
import { Order } from "./Order";
import { Post } from "./Post";
import { PostTag } from "./PostTag";
import { Product } from "./Product";
import { Redirect } from "./Redirect";
import { RssItem } from "./RssItem";
import { RssSource } from "./RssSource";
import { SeoSettings } from "./SeoSettings";
import { SiteSettings } from "./SiteSettings";
import { Tag } from "./Tag";
import { User } from "./User";

// ── Categories ───────────────────────────────────────────────────────────
Category.hasMany(Post, { foreignKey: "categoryId", onDelete: "RESTRICT" });
Post.belongsTo(Category, { foreignKey: "categoryId", onDelete: "RESTRICT" });

Category.hasMany(Category, { as: "children", foreignKey: "parentId", onDelete: "SET NULL" });
Category.belongsTo(Category, { as: "parent", foreignKey: "parentId", onDelete: "SET NULL" });

// ── Authors & users ──────────────────────────────────────────────────────
Author.hasMany(Post, { foreignKey: "authorId", onDelete: "SET NULL" });
Post.belongsTo(Author, { foreignKey: "authorId", onDelete: "SET NULL" });

User.hasOne(Author, { foreignKey: "userId", onDelete: "SET NULL" });
Author.belongsTo(User, { foreignKey: "userId", onDelete: "SET NULL" });

// ── Posts ↔ tags ─────────────────────────────────────────────────────────
Post.belongsToMany(Tag, { through: PostTag, foreignKey: "postId", otherKey: "tagId" });
Tag.belongsToMany(Post, { through: PostTag, foreignKey: "tagId", otherKey: "postId" });

// ── RSS ──────────────────────────────────────────────────────────────────
RssSource.hasMany(RssItem, { foreignKey: "sourceId", onDelete: "CASCADE" });
RssItem.belongsTo(RssSource, { foreignKey: "sourceId", onDelete: "CASCADE" });

Post.hasMany(RssItem, { foreignKey: "postId", onDelete: "SET NULL" });
RssItem.belongsTo(Post, { foreignKey: "postId", onDelete: "SET NULL" });

// ── Commerce ─────────────────────────────────────────────────────────────
Product.hasMany(Order, { foreignKey: "productId", onDelete: "RESTRICT" });
Order.belongsTo(Product, { foreignKey: "productId", onDelete: "RESTRICT" });

// ── Engagement ───────────────────────────────────────────────────────────
Post.hasMany(Comment, { foreignKey: "postId", onDelete: "CASCADE" });
Comment.belongsTo(Post, { foreignKey: "postId", onDelete: "CASCADE" });

Post.hasMany(AnalyticsEvent, { foreignKey: "postId", onDelete: "SET NULL" });
AnalyticsEvent.belongsTo(Post, { foreignKey: "postId", onDelete: "SET NULL" });

// ── Files & audit ────────────────────────────────────────────────────────
User.hasMany(Media, { foreignKey: "uploadedBy", onDelete: "SET NULL" });
Media.belongsTo(User, { foreignKey: "uploadedBy", onDelete: "SET NULL" });

User.hasMany(AuditLog, { foreignKey: "userId", onDelete: "SET NULL" });
AuditLog.belongsTo(User, { foreignKey: "userId", onDelete: "SET NULL" });

export {
  AffiliateLink,
  AnalyticsEvent,
  AuditLog,
  Author,
  Banner,
  Category,
  Comment,
  Media,
  NewsletterSubscriber,
  Order,
  Post,
  PostTag,
  Product,
  Redirect,
  RssItem,
  RssSource,
  SeoSettings,
  SiteSettings,
  Tag,
  User,
  sequelize,
};
