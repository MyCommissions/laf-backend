const { Resend } = require("resend");
require("dotenv").config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, text) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "Lost & Found <no-reply@resend.com>",
      to,
      subject,
      text,
    });

    if (error) {
      console.error("❌ Resend Email Error:", error);
      return;
    }

    console.log("📧 Email sent successfully:", data);
  } catch (err) {
    console.error("❌ Email send failed:", err.message);
  }
};

module.exports = { sendEmail };
