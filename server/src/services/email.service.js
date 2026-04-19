const env = require("../config/env");

async function sendTransactionalEmail({ to, subject, text }) {
  if (!env.resendApiKey || !env.emailFrom) {
    console.info(`[email skipped] ${subject} -> ${to}\n${text}`);
    return { delivered: false };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.emailFrom,
      to,
      subject,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Email provider failed: ${body || response.status}`);
  }

  return { delivered: true };
}

module.exports = {
  sendTransactionalEmail,
};
