const { Resend } = require("resend");
require("dotenv").config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, text = "", html = "") => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: to, // string or array of strings
      text: text, // plain text
      html: html, // HTML content
    });

    if (error) {
      console.error("❌ Resend send error:", error);
      throw new Error(`Resend error: ${error.message}`);
    }

    console.log("📧 Email sent successfully:", data);
    return data;
  } catch (err) {
    console.error("❌ Email send failed:", err);
    throw err;
  }
};

module.exports = { sendEmail };
