import {
    pgTable,
    uuid,
    varchar,
    timestamp,
    boolean,
    index
} from "drizzle-orm/pg-core";

export const otpCodes = pgTable("otp_codes", {
    // Unique identifier for the OTP record
    id: uuid("id").defaultRandom().primaryKey(),

    // We use email instead of a foreign key. 
    // This allows it to work universally for both Admins and Authorized Personnel.
    email: varchar("email", { length: 255 }).notNull(),

    // The 6-digit OTP code
    code: varchar("code", { length: 6 }).notNull(),

    // Security: Exact time the code expires (usually 5 to 10 minutes from creation)
    expiresAt: timestamp("exp   ires_at", { mode: "date" }).notNull(),

    // Security: Ensures the code can only be used successfully once
    isUsed: boolean("is_used").default(false).notNull(),

    // Audit timestamp
    createdAt: timestamp("created_at", { mode: "date" })
        .defaultNow()
        .notNull(),
}, (table) => {
    return {
        // We add an index on the email column. 
        // This makes database lookups extremely fast when verifying the code during login.
        emailIdx: index("otp_email_idx").on(table.email)
    };
});

// Types for your Frontend/Backend
export type OtpCode = typeof otpCodes.$inferSelect;
export type NewOtpCode = typeof otpCodes.$inferInsert;