import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with role-based access control
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  role: text("role").$type<"student" | "staff" | "admin">().notNull().default("student"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reports/Incidents table
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'bullying', 'fight', 'theft', 'vandalism', 'other'
  description: text("description").notNull(),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  reporterId: varchar("reporter_id").references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, reviewed, resolved
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Urgent notices table
export const notices = pgTable("notices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  message: text("message").notNull(),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Visitors table
export const visitors = pgTable("visitors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  document: text("document").notNull(),
  purpose: text("purpose").notNull(),
  entryTime: timestamp("entry_time").defaultNow().notNull(),
  exitTime: timestamp("exit_time"),
  registeredBy: varchar("registered_by").references(() => users.id).notNull(),
});

// Occurrences table
export const occurrences = pgTable("occurrences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull().default("medium"), // low, medium, high
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Safety checklist items
export const checklistItems = pgTable("checklist_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedBy: varchar("completed_by").references(() => users.id),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Emergency drills calendar
export const drills = pgTable("drills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  scheduledDate: timestamp("scheduled_date").notNull(),
  type: text("type").notNull().default("evacuation"), // evacuation, fire, earthquake, etc
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Educational campaigns
export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // digital_safety, traffic_education, general
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Emergency alerts
export const emergencyAlerts = pgTable("emergency_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  message: text("message").notNull(),
  location: text("location"),
  triggeredBy: varchar("triggered_by").references(() => users.id).notNull(),
  isResolved: boolean("is_resolved").notNull().default(false),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  firebaseUid: true,
  role: true,
});

export const insertReportSchema = createInsertSchema(reports).pick({
  type: true,
  description: true,
  isAnonymous: true,
});

export const insertNoticeSchema = createInsertSchema(notices).pick({
  title: true,
  message: true,
});

export const insertVisitorSchema = createInsertSchema(visitors).pick({
  name: true,
  document: true,
  purpose: true,
});

export const insertOccurrenceSchema = createInsertSchema(occurrences).pick({
  title: true,
  description: true,
  severity: true,
});

export const insertChecklistItemSchema = createInsertSchema(checklistItems).pick({
  title: true,
  description: true,
});

export const insertDrillSchema = createInsertSchema(drills).pick({
  title: true,
  description: true,
  scheduledDate: true,
  type: true,
}).extend({
  scheduledDate: z.coerce.date(),
});

export const insertCampaignSchema = createInsertSchema(campaigns).pick({
  title: true,
  content: true,
  category: true,
});

export const insertEmergencyAlertSchema = createInsertSchema(emergencyAlerts).pick({
  message: true,
  location: true,
});

// Update schemas for PATCH operations
export const updateUserSchema = insertUserSchema.partial();
export const updateNoticeSchema = insertNoticeSchema.partial();
export const updateCampaignSchema = insertCampaignSchema.partial();
export const updateChecklistItemSchema = insertChecklistItemSchema.partial().extend({
  isCompleted: z.boolean().optional(),
});

// Report status update schema
export const reportStatusSchema = z.object({
  status: z.enum(["pending", "reviewed", "resolved"]),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Notice = typeof notices.$inferSelect;
export type InsertNotice = z.infer<typeof insertNoticeSchema>;
export type Visitor = typeof visitors.$inferSelect;
export type InsertVisitor = z.infer<typeof insertVisitorSchema>;
export type Occurrence = typeof occurrences.$inferSelect;
export type InsertOccurrence = z.infer<typeof insertOccurrenceSchema>;
export type ChecklistItem = typeof checklistItems.$inferSelect;
export type InsertChecklistItem = z.infer<typeof insertChecklistItemSchema>;
export type Drill = typeof drills.$inferSelect;
export type InsertDrill = z.infer<typeof insertDrillSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type EmergencyAlert = typeof emergencyAlerts.$inferSelect;
export type InsertEmergencyAlert = z.infer<typeof insertEmergencyAlertSchema>;

// User roles enum
export const USER_ROLES = {
  STUDENT: "student" as const,
  STAFF: "staff" as const,
  ADMIN: "admin" as const,
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
