const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  return transporter;
}

/**
 * Envoie un email. Si EMAIL_HOST/EMAIL_USER/EMAIL_PASS ne sont pas renseignés
 * dans .env, l'email est simplement affiché dans la console au lieu d'échouer
 * — pratique en développement, tant que vous n'avez pas configuré un vrai
 * compte d'envoi (voir .env.example).
 */
async function sendEmail({ to, subject, text, html }) {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('--- [EMAIL non envoyé — EMAIL_* non configuré dans .env] ---');
    console.log(`À : ${to}`);
    console.log(`Sujet : ${subject}`);
    console.log(text);
    console.log('-------------------------------------------------------------');
    return;
  }

  const mailer = getTransporter();
  await mailer.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  });
}

module.exports = sendEmail;