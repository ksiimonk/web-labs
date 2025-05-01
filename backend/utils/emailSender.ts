import nodemailer from "nodemailer";
import logger from "./logger";

interface SecurityAlertParams {
  email: string;
  ip: string;
  device: string;
  date: string;
}

interface EmailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendSecurityAlert = async (params: SecurityAlertParams): Promise<boolean> => {
  try {
    logger.debug(`Attempting to send security alert to: ${params.email}`);

    const mailOptions: EmailOptions = {
      from: `"Security Service" <${process.env.EMAIL_USER}>`,
      to: params.email,
      subject: "Новый вход в аккаунт",
      html: `
        <h2>Обнаружен вход с нового устройства</h2>
        <p><strong>Дата:</strong> ${params.date}</p>
        <p><strong>IP-адрес:</strong> ${params.ip}</p>
        <p><strong>Устройство:</strong> ${params.device}</p>
        <p>Если это были не вы, рекомендуем сменить пароль.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info("Email sent successfully to:", params.email);
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to send security alert email:", message);
    throw new Error(message);
  }
};
