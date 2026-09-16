import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
export const investigations = sqliteTable(
  "investigations",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    title: text("title").notNull(),
    state: text("state").notNull(),
    revision: integer("revision").notNull().default(1),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [index("idx_investigations_owner_updated").on(t.ownerId, t.updatedAt)],
);
export const quotas = sqliteTable("quotas", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
});
export const inferenceJobs = sqliteTable(
  "inference_jobs",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    investigationId: text("investigation_id").notNull(),
    sourceRevision: integer("source_revision").notNull(),
    day: text("day").notNull(),
    status: text("status").notNull(),
    startedAt: text("started_at").notNull(),
    result: text("result"),
  },
  (t) => [
    index("idx_jobs_owner_day").on(t.ownerId, t.day),
    index("idx_jobs_day").on(t.day),
    index("idx_jobs_investigation_status").on(t.investigationId, t.status),
  ],
);
