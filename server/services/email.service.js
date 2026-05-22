import { Resend } from "resend";

let resendClient = null;
const getResend = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing. Set it in server/.env");
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
};

const fromAddress = () =>
  process.env.RESEND_FROM || "Jobs365 <onboarding@resend.dev>";

const otpEmailHtml = (code, name) => `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;color:#0a0a0a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#ffffff;border:1px solid #e5e5e5;border-radius:12px;padding:32px;">
            <tr><td>
              <p style="margin:0 0 8px;font-size:14px;color:#737373;letter-spacing:0.02em;">Jobs365</p>
              <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;letter-spacing:-0.01em;">Verify your email</h1>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#525252;">
                ${name ? `Hi ${name},` : "Hi,"} use the code below to finish setting up your Jobs365 account. It expires in 10 minutes.
              </p>
              <div style="background:#0a0a0a;color:#fafafa;border-radius:10px;padding:18px 24px;font-size:28px;font-weight:600;letter-spacing:0.4em;text-align:center;font-family:'SF Mono',ui-monospace,SFMono-Regular,Menlo,monospace;">
                ${code}
              </div>
              <p style="margin:24px 0 0;font-size:12px;color:#a3a3a3;line-height:1.6;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export const sendOtpEmail = async ({ to, code, name }) => {
  if (process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY) {
    return { id: "dev-fallback" };
  }
  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: fromAddress(),
    to,
    subject: "Your Jobs365 verification code",
    html: otpEmailHtml(code, name),
  });
  if (error) {
    const err = new Error(error.message || "Failed to send email");
    err.statusCode = 502;
    throw err;
  }
  return data;
};
