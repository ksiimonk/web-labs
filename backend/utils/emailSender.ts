import nodemailer from "nodemailer";

interface SecurityAlertParams {
  email: string;
  ip: string;
  device: string;
  date: string;
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
    console.log(`Attempting to send security alert to: ${params.email}`);

    const mailOptions = {
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
    console.log("Email sent successfully to:", params.email);
    return true;
  } catch (error) {
    console.error("Failed to send security alert email:", error);
    throw error;
  }
};
