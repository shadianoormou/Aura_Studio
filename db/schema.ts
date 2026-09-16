import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// A compact, typed content ledger keeps each CMS collection independently
// publishable while allowing the public site to query only live records.
export const contentRecords = sqliteTable("content_records", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  slug: text("slug"),
  title: text("title").notNull(),
  status: text("status").notNull().default("draft"),
  position: integer("position").notNull().default(0),
  data: text("data").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("idx_content_records_type_status_position").on(table.type, table.status, table.position),
]);

export const contactInquiries = sqliteTable("contact_inquiries", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  brand: text("brand"),
  email: text("email").notNull(),
  projectType: text("project_type"),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"),
  payload: text("payload").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("idx_contact_inquiries_status_created_at").on(table.status, table.createdAt),
]);

export const mediaAssets = sqliteTable("media_assets", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  byteSize: integer("byte_size").notNull(),
  createdAt: text("created_at").notNull(),
});
