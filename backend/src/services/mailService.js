const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const emailService = process.env.EMAIL_SERVICE;
    const emailHost = process.env.EMAIL_HOST;

    // Check if credentials are mock/default
    const isMockMode = !emailUser || emailUser === 'mock_user' || !emailPass || emailPass === 'mock_pass';

    if (isMockMode) {
      console.log(`\n======================================================`);
      console.log(`[DEV MOCK EMAIL LOGGED - Set EMAIL_USER & EMAIL_PASS in .env for real emails]`);
      console.log(`TO:      ${to}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`======================================================\n`);
      return true;
    }

    // Configure Nodemailer transporter options
    let transportOptions;
    if (emailService) {
      transportOptions = {
        service: emailService,
        auth: { user: emailUser, pass: emailPass }
      };
    } else {
      const port = parseInt(process.env.EMAIL_PORT) || 587;
      transportOptions = {
        host: emailHost || 'smtp.gmail.com',
        port,
        secure: port === 465, // true for 465, false for 587/2525
        auth: { user: emailUser, pass: emailPass },
        tls: { rejectUnauthorized: false }
      };
    }

    const transporter = nodemailer.createTransport(transportOptions);

    const fromAddress = process.env.EMAIL_FROM || `"ExpensePilot" <${emailUser}>`;

    const plainText = html ? html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : 'Please verify your ExpensePilot account.';

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text: plainText,
      html
    });

    console.log(`[Email] Verification email dispatched to ${to} (MessageId: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`[Email Error] Failed to send email to ${to}: ${error.message}`);
    return false;
  }
};

module.exports = { sendEmail };
