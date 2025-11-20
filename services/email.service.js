const brevo = require("@getbrevo/brevo");
require("dotenv").config();

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

const sendEmail = async (to, subject, html = "") => {
  const sendSmtpEmail = {
    sender: { name: "Lost & Found", email: "no-reply@claime.site" },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  };

  try {
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("📧 Email sent:", response);
    return response;
  } catch (err) {
    console.error("❌ Email send error:", err);
    throw err;
  }
};

module.exports = { sendEmail };