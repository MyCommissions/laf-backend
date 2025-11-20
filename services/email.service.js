const { Resend } = require("resend");
require("dotenv").config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, text, html) => {
  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM, // e.g. "Lost & Found <send@claime.site>"
      to,
      subject,
      text,
      html,
    });

    console.log("📧 Email sent successfully:", data);
  } catch (err) {
    console.error("❌ Email send failed:", err.message);
  }
};

module.exports = { sendEmail };
