import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const recordingsTable = pgTable("recordings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  tradition: text("tradition").notNull(),
  region: text("region").notNull(),
  country: text("country").notNull(),
  community: text("community").notNull(),
  instrument: text("instrument").notNull(),
  form: text("form").notNull(),
  description: text("description").notNull(),
  yearCollected: integer("year_collected").notNull(),
  duration: text("duration").notNull(),
  source: text("source").notNull(),
  audioUrl: text("audio_url"),
  imageUrl: text("image_url").notNull(),
  tags: text("tags").array().notNull(),
  featured: boolean("featured").notNull().default(false),
});

export const insertRecordingSchema = createInsertSchema(recordingsTable).omit({
  id: true,
});

export type InsertRecording = z.infer<typeof insertRecordingSchema>;
export type Recording = typeof recordingsTable.$inferSelect;