import {
    pgTable,
    uuid,
    varchar,
    timestamp,
    boolean
} from 'drizzle-orm/pg-core';

export const admins = pgTable('admins', {
    // Primary key (This will map exactly to your Supabase auth.users ID)
    id: uuid('id').primaryKey(),

    // Core Identity & Access
    email: varchar('email', { length: 255 }).notNull().unique(),

    // Role is now a standard string with no default value. 
    // You MUST specify this when creating a new record.
    role: varchar('role', { length: 50 }).notNull(),

    // Essential Personal Details
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    phone: varchar('phone', { length: 20 }),

    // Account Status
    isActive: boolean('is_active').default(true).notNull(),

    // Auto-managed timestamps
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// Types for your Frontend/Backend
export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;