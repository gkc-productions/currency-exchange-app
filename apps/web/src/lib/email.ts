import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT ?? 587);
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;
const smtpSecure = process.env.SMTP_SECURE === "true";
const defaultFrom = process.env.SMTP_FROM ?? "ClariSend <no-reply@clarisend.co>";

function getTransporter() {
  if (!smtpHost || !smtpUser || !smtpPassword) {
    throw new Error("SMTP credentials are not configured.");
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });
}

export async function sendMagicLinkEmail({
  to,
  url,
}: {
  to: string;
  url: string;
}) {
  const transporter = getTransporter();

  const subject = "Sign in to ClariSend";
  const text = `Use the secure link below to sign in to ClariSend.\n\n${url}\n\nIf you did not request this, you can ignore this email.`;
  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #0f172a;">
      <h2 style="margin: 0 0 12px;">Sign in to ClariSend</h2>
      <p style="margin: 0 0 16px;">Use the secure link below to finish signing in.</p>
      <p style="margin: 0 0 24px;"><a href="${url}" style="background:#0f172a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;display:inline-block;">Sign in</a></p>
      <p style="margin:0;color:#64748b;font-size:12px;">If you did not request this email, you can safely ignore it.</p>
    </div>
  `;

  await transporter.sendMail({
    to,
    from: defaultFrom,
    subject,
    text,
    html,
  });
}

export async function sendReceiptEmail({
  to,
  referenceCode,
  status,
  sendAmount,
  totalFee,
  recipientGets,
  fromAsset,
  toAsset,
  receiptUrl,
}: {
  to: string;
  referenceCode: string;
  status: string;
  sendAmount: number;
  totalFee: number;
  recipientGets: number;
  fromAsset: string;
  toAsset: string;
  receiptUrl: string;
}) {
  const transporter = getTransporter();
  const subject = `Your ClariSend receipt (${referenceCode})`;
  const text = `Your transfer is ${status}.\n\nReference: ${referenceCode}\nSend amount: ${sendAmount} ${fromAsset}\nTotal fees: ${totalFee} ${fromAsset}\nRecipient gets: ${recipientGets} ${toAsset}\n\nView receipt: ${receiptUrl}`;
  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #0f172a;">
      <h2 style="margin:0 0 12px;">Your ClariSend receipt</h2>
      <p style="margin:0 0 18px;">Status: <strong>${status}</strong></p>
      <table style="border-collapse: collapse; width: 100%; max-width: 420px;">
        <tr><td style="padding:6px 0; color:#64748b;">Reference</td><td style="padding:6px 0; font-weight:600;">${referenceCode}</td></tr>
        <tr><td style="padding:6px 0; color:#64748b;">Send amount</td><td style="padding:6px 0; font-weight:600;">${sendAmount} ${fromAsset}</td></tr>
        <tr><td style="padding:6px 0; color:#64748b;">Total fees</td><td style="padding:6px 0; font-weight:600;">${totalFee} ${fromAsset}</td></tr>
        <tr><td style="padding:6px 0; color:#64748b;">Recipient gets</td><td style="padding:6px 0; font-weight:600;">${recipientGets} ${toAsset}</td></tr>
      </table>
      <p style="margin:18px 0 0;"><a href="${receiptUrl}" style="color:#0f766e;">View full receipt</a></p>
    </div>
  `;

  await transporter.sendMail({
    to,
    from: defaultFrom,
    subject,
    text,
    html,
  });
}
