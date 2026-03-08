// db/schema/employees.ts
import { boolean, pgTable, timestamp, uuid, varchar, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { shifts } from "../shifts/shifts";

export const employees = pgTable("employees", {
    // 1. Core Identity (ID maps exactly to Supabase auth.users)
    id: uuid("id").primaryKey().notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    profileImage: text("profile_image"),

    // 2. Access & Operations
    // Role: Determines what screens they can see (e.g., 'employee', 'admin')
    role: varchar("role", { length: 50 }).default('employee').notNull(),
    // Position: Their actual job title (e.g., 'Manager', 'Cashier', 'Installer')
    position: varchar("position", { length: 100 }),

    // 3. Status
    isActive: boolean("is_active").default(true).notNull(),

    // 4. Timestamps
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
});

// Defines the 1-to-Many relationship (1 Employee has Many Shifts)
export const employeesRelations = relations(employees, ({ many }) => ({
    shifts: many(shifts),
}));

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;

// Zod schemas for easy API validation
export const selectEmployeeSchema = createSelectSchema(employees);
export const insertEmployeeSchema = createInsertSchema(employees);