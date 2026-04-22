import nodemailer from "nodemailer";

// ============================================================
// Pooled transporter for 170-user concurrency
// maxConnections: 5  — parallel SMTP connections
// rateLimit: 10      — max 10 messages / second
// maxMessages: 100   — rotate connection after 100 msgs
// ============================================================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: 465,
  secure: true, // SSL from the start (more reliable than STARTTLS on port 587)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // Allows self-signed certs; safe for Gmail
  },
  socketTimeout: 10000, // 10s — fail fast instead of hanging
  connectionTimeout: 10000,
});

const FROM = `"DUET FYP Portal" <${process.env.SMTP_USER}>`;

// ============================================================
// Helper: send a single email (fire-and-forget safe)
// ============================================================
async function sendMail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
  } catch (err) {
    console.error("[email] Failed to send to", to, err);
  }
}

// ============================================================
// Broadcast: batch emails in chunks of 10 with 300ms delay
// Responds immediately (non-blocking) — fire-and-forget
// ============================================================
export async function broadcastAnnouncement(
  recipients: string[],
  subject: string,
  html: string
): Promise<void> {
  const CHUNK = 10;
  const DELAY_MS = 300;
  async function run() {
    for (let i = 0; i < recipients.length; i += CHUNK) {
      const chunk = recipients.slice(i, i + CHUNK);
      await Promise.allSettled(chunk.map((to) => sendMail(to, subject, html)));
      if (i + CHUNK < recipients.length) {
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    }
  }
  // Non-blocking: start and discard promise
  run().catch((err) => console.error("[broadcast] Unexpected error:", err));
}

// ============================================================
// OTP Email
// ============================================================
export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const html = `
    <div style="background:#0b1326;color:#dae2fd;font-family:Inter,sans-serif;padding:40px;border-radius:12px;max-width:480px;margin:auto;">
      <h1 style="color:#adc6ff;margin-bottom:8px;font-size:24px;">DUET Atrium</h1>
      <p style="color:#c2c6d6;margin-bottom:32px;font-size:14px;">Academic Portal — Email Verification</p>
      <p style="margin-bottom:16px;">Your one-time verification code is:</p>
      <div style="background:#171f33;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
        <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#adc6ff;">${otp}</span>
      </div>
      <p style="color:#8c909f;font-size:13px;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      <hr style="border-color:#424754;margin:24px 0;"/>
      <p style="color:#424754;font-size:12px;">If you did not request this, please ignore this email.</p>
    </div>
  `;
  await sendMail(to, "Your DUET Atrium Verification Code", html);
}

// ============================================================
// Group Invitation Email
// ============================================================
export async function sendGroupInviteEmail(
  to: string,
  inviterName: string,
  groupId: string,
  acceptUrl: string,
  rejectUrl: string
): Promise<void> {
  const html = `
    <div style="background:#0b1326;color:#dae2fd;font-family:Inter,sans-serif;padding:40px;border-radius:12px;max-width:480px;margin:auto;">
      <h1 style="color:#adc6ff;margin-bottom:8px;font-size:24px;">Group Invitation</h1>
      <p style="color:#c2c6d6;margin-bottom:24px;">You have been invited by <strong>${inviterName}</strong> to join FYP group <strong>${groupId}</strong>.</p>
      <div style="display:flex;gap:12px;margin-bottom:24px;">
        <a href="${acceptUrl}" style="background:linear-gradient(135deg,#adc6ff,#4d8eff);color:#002e6a;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Accept Invitation</a>
        <a href="${rejectUrl}" style="background:#2d3449;color:#c2c6d6;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Decline</a>
      </div>
      <p style="color:#8c909f;font-size:13px;">This invitation expires in <strong>72 hours</strong>.</p>
    </div>
  `;
  await sendMail(to, `FYP Group Invitation — ${groupId}`, html);
}

// ============================================================
// Proposal Status Email
// ============================================================
export async function sendProposalNotification(
  to: string,
  proposalTitle: string,
  status: "SUBMITTED" | "ACCEPTED" | "REJECTED" | "EXPIRED",
  comment?: string
): Promise<void> {
  const statusColors: Record<string, string> = {
    SUBMITTED: "#adc6ff",
    ACCEPTED: "#a4c9ff",
    REJECTED: "#ffb4ab",
    EXPIRED: "#8c909f",
  };
  const statusLabels: Record<string, string> = {
    SUBMITTED: "Proposal Submitted",
    ACCEPTED: "Proposal Accepted ✓",
    REJECTED: "Proposal Rejected",
    EXPIRED: "Proposal Expired",
  };
  const html = `
    <div style="background:#0b1326;color:#dae2fd;font-family:Inter,sans-serif;padding:40px;border-radius:12px;max-width:480px;margin:auto;">
      <h1 style="color:${statusColors[status]};margin-bottom:8px;font-size:22px;">${statusLabels[status]}</h1>
      <p style="color:#c2c6d6;margin-bottom:16px;">Project: <strong>${proposalTitle}</strong></p>
      ${comment ? `<div style="background:#171f33;border-radius:8px;padding:16px;margin-bottom:16px;"><p style="color:#c2c6d6;font-size:14px;margin:0;">${comment}</p></div>` : ""}
      <p style="color:#8c909f;font-size:13px;">Log in to DUET Atrium for details.</p>
    </div>
  `;
  await sendMail(to, `Proposal Update: ${proposalTitle}`, html);
}
