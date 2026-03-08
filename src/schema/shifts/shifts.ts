// db/schema/shifts.ts
import { pgTable, timestamp, uuid, date, varchar, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { employees } from "../employees/employees";

export const shifts = pgTable("shifts", {
    // Unique ID for this specific shift
    id: uuid("id").primaryKey().defaultRandom(),

    // Links this shift to the employee. 
    // onDelete: "cascade" means if you delete the employee, their shift history deletes too.
    employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),

    // The calendar date of the shift (e.g., '2026-03-08')
    shiftDate: date("shift_date").notNull(),

    // Time tracking
    clockIn: timestamp("clock_in", { withTimezone: true }).defaultNow().notNull(),
    clockOut: timestamp("clock_out", { withTimezone: true }), // Null until they clock out

    // E.g., 'Morning Shift', 'Closing', 'Inventory Count'
    assignmentType: varchar("assignment_type", { length: 100 }),

    // Status helps the UI know if they are currently working ('active' vs 'completed')
    status: varchar("status", { length: 50 }).default('active').notNull(),

    // Optional: Manager notes or end-of-shift cash register notes
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
});

// Defines the relationship back to the Employee
export const shiftsRelations = relations(shifts, ({ one }) => ({
    employee: one(employees, {
        fields: [shifts.employeeId],
        references: [employees.id],
    }),
}));

export type Shift = typeof shifts.$inferSelect;
export type NewShift = typeof shifts.$inferInsert;

export const selectShiftSchema = createSelectSchema(shifts);
export const insertShiftSchema = createInsertSchema(shifts);