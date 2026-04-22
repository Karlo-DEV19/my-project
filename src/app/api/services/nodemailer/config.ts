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

// Note: transporter verification is intentionally omitted here.
// Calling transporter.verify() at module load time causes Next.js to open
// an SMTP connection during route compilation, which results in ECONNRESET
// errors on the /login page. Verification happens implicitly on first send.

// Updated to match your Capstone project context
export const defaultFrom = `"MJ Decor 888" <${email}>`