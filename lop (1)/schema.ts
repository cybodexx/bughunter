import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const scans = pgTable("scans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  targetUrl: text("target_url").notNull(),
  status: text("status").$type<"pending" | "running" | "completed" | "failed">().notNull().default("pending"),
  authType: text("auth_type").$type<"none" | "basic" | "form" | "cookie">().notNull().default("none"),
  intensity: text("intensity").$type<"low" | "medium" | "high">().notNull().default("medium"),
  enabledModules: text("enabled_modules").array().notNull().default([]),
  progress: integer("progress").notNull().default(0),
  currentModule: text("current_module"),
  requestsSent: integer("requests_sent").notNull().default(0),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vulnerabilities = pgTable("vulnerabilities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scanId: varchar("scan_id").references(() => scans.id).notNull(),
  type: text("type").notNull(), // sql_injection, xss, directory_traversal, command_injection, etc.
  severity: text("severity").$type<"critical" | "high" | "medium" | "low">().notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  url: text("url").notNull(),
  parameter: text("parameter"),
  payload: text("payload"),
  evidence: text("evidence"),
  recommendation: text("recommendation").notNull(),
  cweId: text("cwe_id"),
  cvssScore: text("cvss_score"),
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
});

// Student evaluation tables
export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  studentId: text("student_id").unique(),
  group: text("group"), // Class or group identifier
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  targetUrls: text("target_urls").array().notNull(), // Multiple URLs to test
  enabledModules: text("enabled_modules").array().notNull(),
  maxScore: integer("max_score").notNull().default(100),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const studentScans = pgTable("student_scans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  assignmentId: varchar("assignment_id").references(() => assignments.id).notNull(),
  scanId: varchar("scan_id").references(() => scans.id).notNull(),
  securityScore: integer("security_score").notNull().default(0), // 0-100 based on vulnerabilities found
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const batchScans = pgTable("batch_scans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  targetUrls: text("target_urls").array().notNull(),
  enabledModules: text("enabled_modules").array().notNull(),
  status: text("status").$type<"pending" | "running" | "completed" | "failed">().notNull().default("pending"),
  totalScans: integer("total_scans").notNull().default(0),
  completedScans: integer("completed_scans").notNull().default(0),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertScanSchema = createInsertSchema(scans).pick({
  targetUrl: true,
  authType: true,
  intensity: true,
  enabledModules: true,
});

export const insertVulnerabilitySchema = createInsertSchema(vulnerabilities).pick({
  scanId: true,
  type: true,
  severity: true,
  title: true,
  description: true,
  url: true,
  parameter: true,
  payload: true,
  evidence: true,
  recommendation: true,
  cweId: true,
  cvssScore: true,
});

export const insertStudentSchema = createInsertSchema(students).pick({
  name: true,
  email: true,
  studentId: true,
  group: true,
});

export const insertAssignmentSchema = createInsertSchema(assignments).pick({
  title: true,
  description: true,
  targetUrls: true,
  enabledModules: true,
  maxScore: true,
  dueDate: true,
  isActive: true,
});

export const insertBatchScanSchema = createInsertSchema(batchScans).pick({
  title: true,
  targetUrls: true,
  enabledModules: true,
});

export const insertStudentScanSchema = createInsertSchema(studentScans).pick({
  studentId: true,
  assignmentId: true,
  scanId: true,
  securityScore: true,
});

// Export types
export type InsertScan = z.infer<typeof insertScanSchema>;
export type Scan = typeof scans.$inferSelect;
export type InsertVulnerability = z.infer<typeof insertVulnerabilitySchema>;
export type Vulnerability = typeof vulnerabilities.$inferSelect;

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertBatchScan = z.infer<typeof insertBatchScanSchema>;
export type BatchScan = typeof batchScans.$inferSelect;
export type InsertStudentScan = z.infer<typeof insertStudentScanSchema>;
export type StudentScan = typeof studentScans.$inferSelect;
