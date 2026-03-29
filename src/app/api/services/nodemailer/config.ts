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

// ✅ Use explicit Gmail host/port (more reliable than 'service: gmail')
export const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // Use SSL
    auth: {
        user: email,
        pass: pass,
    },
    tls: {
        rejectUnauthorized: false, // ✅ fix self-signed certificate error
    },
})

// Verify transporter on initialization
transporter.verify((error) => {
    if (error) {
        console.error("❌ SMTP Transporter Verification Failed:", error.message)
    } else {
        console.log("✅ SMTP Transporter is ready to send emails")
    }
})

// Updated to match your Capstone project context
export const defaultFrom = `"MJ Decor 888" <${email}>`