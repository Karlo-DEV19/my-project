// src/lib/email/config.ts
import nodemailer from "nodemailer"
import dns from "dns"

// ✅ Force IPv4 (fix ECONNREFUSED IPv6 issue)
dns.setDefaultResultOrder("ipv4first")

// Use standard environment variables
const email = process.env.SMTP_EMAIL
const pass = process.env.SMTP_PASSWORD

if (!email || !pass) {
    console.warn("⚠️ SMTP credentials are missing from environment variables.")
}

export const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: email,
        pass: pass,
    },
    tls: {
        rejectUnauthorized: false, // ✅ fix self-signed certificate error
    },
})

// Updated to match your Capstone project context
export const defaultFrom = `"MJ Decor 888" <${email}>`