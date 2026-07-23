const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  try {
    // If credentials are empty or default mock settings, just log and return
    if (!process.env.EMAIL_HOST || process.env.EMAIL_USER === 'mock_user') {
      console.log(`\n======================================================`);
      console.log(`[MOCK EMAIL SENT]`);
      console.log(`TO:      ${to}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`BODY:    ${html.replace(/<[^>]*>/g, '')}`); // Strip HTML tags for clean console display
      console.log(`======================================================\n`);
      return true;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 2525,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@expensepilot.com',
      to,
      subject,
      html
    });

    console.log(`Email dispatched: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`Mail delivery error: ${error.message}`);
    return false;
  }
};

module.exports = { sendEmail };
