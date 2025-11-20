const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");
require("dotenv").config();

const mailersend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

const sendEmail = async (to, subject, text = "", html = "") => {
  try {
    const sender = new Sender(process.env.EMAIL_FROM); // can also include name
    const recipient = new Recipient(to);

    const emailParams = new EmailParams()
      .setFrom(sender)
      .setTo([recipient])
      .setText(text)
      .setHtml(html);

    const response = await mailersend.email.send(emailParams);
    console.log("📧 Email sent successfully:", response);
    return response;
  } catch (err) {
    console.error("❌ Email send failed:", err.message);
    throw err;
  }
};

module.exports = { sendEmail };
