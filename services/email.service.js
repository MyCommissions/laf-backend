require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

console.log("EMAIL_PASS length:", process.env.EMAIL_PASS?.length); // should be 16

const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from:
        process.env.EMAIL_FROM || `"Lost & Found" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
    console.log(`📧 Email sent to ${to}`);
  } catch (err) {
    console.error("❌ Email send failed:", err.message);
  }
};

module.exports = { sendEmail };
