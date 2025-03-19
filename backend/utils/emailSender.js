const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
    logger: true,
    debug: true
});

const sendSecurityAlert = async (email, ip, device) => {
    try {
        const info = await transporter.sendMail({
            from: `"Security Service" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "New Login Detected",
            html: `
                <h3>Security Alert</h3>
                <p>Вход с нового устрйства:</p>
                <ul>
                    <li>IP: ${ip}</li>
                    <li>Device: ${device}</li>
                </ul>
                <p>Если это не вы то всем пофиккк</p>
            `,
        });
        console.log("Email sent:", info.messageId);
        return true;
    } catch (error) {
        console.error("Email sending failed:", error);
        throw error;
    }
};

module.exports = { sendSecurityAlert };