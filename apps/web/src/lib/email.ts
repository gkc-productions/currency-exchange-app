import nodemailer from "nodemailer";
import { prisma } from "@/src/lib/prisma";
import { alertEmailFailure } from "@/src/lib/alerts";
import { logError } from "@/src/lib/logging";

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

async function logEmail({
  type,
  transferId,
  recipient,
  success,
  error,
}: {
  type: string;
  transferId?: string | null;
  recipient: string;
  success: boolean;
  error?: string;
}) {
  try {
    await prisma.emailLog.create({
      data: {
        type,
        transferId: transferId ?? null,
        recipient,
        success,
        error: error ?? null,
      },
    });
  } catch {
    // Logging failures should not break the main flow
    logError("email_log_failed", {
      transferId: transferId ?? undefined,
      meta: { type, recipient, success, error },
    });
  }
}

function formatMoney(code: string, value: number) {
  return `${value.toFixed(2)} ${code}`;
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function formatRate(value: number) {
  return value.toFixed(6);
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

  try {
    await transporter.sendMail({
      to,
      from: defaultFrom,
      subject,
      text,
      html,
    });
    await logEmail({ type: "MAGIC_LINK", recipient: to, success: true });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    await logEmail({ type: "MAGIC_LINK", recipient: to, success: false, error: errorMessage });
    alertEmailFailure({
      context: { type: "MAGIC_LINK", recipient: to, error: errorMessage },
    });
    throw err;
  }
}

type TransferEmailType = "INITIATED" | "COMPLETED" | "FAILED";

const statusLabels: Record<TransferEmailType, string> = {
  INITIATED: "Initiated",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

const statusSubjects: Record<TransferEmailType, (ref: string) => string> = {
  INITIATED: (ref) => `Transfer initiated (${ref})`,
  COMPLETED: (ref) => `Transfer completed (${ref})`,
  FAILED: (ref) => `Transfer failed (${ref})`,
};

const statusMessages: Record<TransferEmailType, string> = {
  INITIATED: "Your transfer has been initiated and is being processed.",
  COMPLETED: "Your transfer has been completed successfully.",
  FAILED: "Unfortunately, your transfer could not be completed. Please contact support if you need assistance.",
};

export async function sendTransferStatusEmail({
  to,
  type,
  referenceCode,
  sendAmount,
  totalFee,
  recipientGets,
  fromAsset,
  toAsset,
  recipientName,
  receiptUrl,
  transferId,
  timestamp,
}: {
  to: string;
  type: TransferEmailType;
  referenceCode: string;
  sendAmount: string;
  totalFee: string;
  recipientGets: string;
  fromAsset: string;
  toAsset: string;
  recipientName: string;
  receiptUrl: string;
  transferId: string;
  timestamp: Date;
}) {
  let transporter;
  try {
    transporter = getTransporter();
  } catch {
    await logEmail({
      type: `TRANSFER_${type}`,
      transferId,
      recipient: to,
      success: false,
      error: "SMTP not configured",
    });
    return;
  }

  const formattedTimestamp = timestamp.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });

  const subject = statusSubjects[type](referenceCode);
  const statusLabel = statusLabels[type];
  const statusMessage = statusMessages[type];

  const text = `${statusMessage}

Reference: ${referenceCode}
Status: ${statusLabel}
Timestamp: ${formattedTimestamp} UTC

Send amount: ${sendAmount} ${fromAsset}
Total fees: ${totalFee} ${fromAsset}
Recipient gets: ${recipientGets} ${toAsset}
Recipient: ${recipientName}

View transfer details: ${receiptUrl}

ClariSend - Secure International Transfers`;

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #0f172a; max-width: 600px;">
      <h2 style="margin: 0 0 16px; font-size: 20px;">${subject}</h2>
      <p style="margin: 0 0 20px; color: #475569;">${statusMessage}</p>

      <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; width: 140px;">Reference</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${referenceCode}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Status</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${statusLabel}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Timestamp</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">${formattedTimestamp} UTC</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Send amount</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${sendAmount} ${fromAsset}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Total fees</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">${totalFee} ${fromAsset}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Recipient gets</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${recipientGets} ${toAsset}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #64748b;">Recipient</td>
          <td style="padding: 10px 0;">${recipientName}</td>
        </tr>
      </table>

      <p style="margin: 0 0 24px;">
        <a href="${receiptUrl}" style="background: #0f172a; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block; font-size: 14px;">View Transfer Details</a>
      </p>

      <p style="margin: 0; color: #94a3b8; font-size: 12px;">
        ClariSend - Secure International Transfers
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      to,
      from: defaultFrom,
      subject,
      text,
      html,
    });
    await logEmail({
      type: `TRANSFER_${type}`,
      transferId,
      recipient: to,
      success: true,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    await logEmail({
      type: `TRANSFER_${type}`,
      transferId,
      recipient: to,
      success: false,
      error: errorMessage,
    });
    alertEmailFailure({
      transferId,
      context: { type: `TRANSFER_${type}`, recipient: to, error: errorMessage },
    });
    // Email failures should not break transfers - fail silently but log
  }
}

// Legacy function for backward compatibility
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
  transferId,
  marketRate,
  appliedRate,
  fxMarginPct,
  fixedFee,
  percentFee,
  rateSource,
  rateTimestamp,
  lockedAt,
  expiresAt,
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
  transferId?: string;
  marketRate: number;
  appliedRate: number;
  fxMarginPct: number;
  fixedFee: number;
  percentFee: number;
  rateSource: string;
  rateTimestamp: string;
  lockedAt: string;
  expiresAt: string;
}) {
  let transporter;
  try {
    transporter = getTransporter();
  } catch {
    await logEmail({
      type: "RECEIPT_RESEND",
      transferId,
      recipient: to,
      success: false,
      error: "SMTP not configured",
    });
    alertEmailFailure({
      transferId,
      context: { type: "RECEIPT_RESEND", recipient: to, error: "SMTP not configured" },
    });
    throw new Error("SMTP not configured");
  }

  const subject = `Your ClariSend receipt (${referenceCode})`;
  const text = `Your transfer is ${status}.\n\nReference: ${referenceCode}\nSend amount: ${formatMoney(fromAsset, sendAmount)}\nTotal fees: ${formatMoney(fromAsset, totalFee)}\nRecipient gets: ${formatMoney(toAsset, recipientGets)}\n\nMarket rate: ${formatRate(marketRate)} ${toAsset}/${fromAsset}\nApplied rate: ${formatRate(appliedRate)} ${toAsset}/${fromAsset}\nFX margin: ${formatPercent(fxMarginPct)}\nFixed fee: ${formatMoney(fromAsset, fixedFee)}\nPercent fee: ${formatPercent(percentFee)}\nRate source: ${rateSource}\nRate timestamp: ${rateTimestamp}\nQuote locked at: ${lockedAt}\nQuote expires at: ${expiresAt}\n\nView receipt: ${receiptUrl}`;
  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #0f172a;">
      <h2 style="margin:0 0 12px;">Your ClariSend receipt</h2>
      <p style="margin:0 0 18px;">Status: <strong>${status}</strong></p>
      <table style="border-collapse: collapse; width: 100%; max-width: 520px;">
        <tr><td style="padding:6px 0; color:#64748b;">Reference</td><td style="padding:6px 0; font-weight:600;">${referenceCode}</td></tr>
        <tr><td style="padding:6px 0; color:#64748b;">Send amount</td><td style="padding:6px 0; font-weight:600;">${formatMoney(fromAsset, sendAmount)}</td></tr>
        <tr><td style="padding:6px 0; color:#64748b;">Total fees</td><td style="padding:6px 0; font-weight:600;">${formatMoney(fromAsset, totalFee)}</td></tr>
        <tr><td style="padding:6px 0; color:#64748b;">Recipient gets</td><td style="padding:6px 0; font-weight:600;">${formatMoney(toAsset, recipientGets)}</td></tr>
        <tr><td style="padding:6px 0; color:#64748b;">Market rate</td><td style="padding:6px 0;">${formatRate(marketRate)} ${toAsset}/${fromAsset}</td></tr>
        <tr><td style="padding:6px 0; color:#64748b;">Applied rate</td><td style="padding:6px 0;">${formatRate(appliedRate)} ${toAsset}/${fromAsset}</td></tr>
        <tr><td style="padding:6px 0; color:#64748b;">FX margin</td><td style="padding:6px 0;">${formatPercent(fxMarginPct)}</td></tr>
        <tr><td style="padding:6px 0; color:#64748b;">Fixed fee</td><td style="padding:6px 0;">${formatMoney(fromAsset, fixedFee)}</td></tr>
        <tr><td style="padding:6px 0; color:#64748b;">Percent fee</td><td style="padding:6px 0;">${formatPercent(percentFee)}</td></tr>
        <tr><td style="padding:6px 0; color:#64748b;">Rate source</td><td style="padding:6px 0;">${rateSource}</td></tr>
        <tr><td style="padding:6px 0; color:#64748b;">Rate timestamp</td><td style="padding:6px 0;">${rateTimestamp}</td></tr>
        <tr><td style="padding:6px 0; color:#64748b;">Quote locked at</td><td style="padding:6px 0;">${lockedAt}</td></tr>
        <tr><td style="padding:6px 0; color:#64748b;">Quote expires at</td><td style="padding:6px 0;">${expiresAt}</td></tr>
      </table>
      <p style="margin:18px 0 0;"><a href="${receiptUrl}" style="color:#0f766e;">View full receipt</a></p>
    </div>
  `;

  try {
    await transporter.sendMail({
      to,
      from: defaultFrom,
      subject,
      text,
      html,
    });
    await logEmail({
      type: "RECEIPT_RESEND",
      transferId,
      recipient: to,
      success: true,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    await logEmail({
      type: "RECEIPT_RESEND",
      transferId,
      recipient: to,
      success: false,
      error: errorMessage,
    });
    alertEmailFailure({
      transferId,
      context: { type: "RECEIPT_RESEND", recipient: to, error: errorMessage },
    });
    throw err;
  }
}
