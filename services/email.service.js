const MailerSend = require("@mailersend/mailersend");
require("dotenv").config();

const mailersend = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY });

const sendEmail = async (to, subject, text, html) => {
  try {
    const response = await mailersend.email.send({
      from: process.env.EMAIL_FROM,
      to: [to],
      subject,
      text,
      html,
    });

    console.log("📧 Email sent successfully:", response);
  } catch (err) {
    console.error("❌ Email send failed:", err.message);
  }
};

module.exports = { sendEmail };
