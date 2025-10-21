// mailer.js
const nodemailer = require('nodemailer');
require('dotenv').config();

// --- Configuration du transporteur Gmail ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// --- Fonction générique d’envoi ---
async function sendEmail(to, subject, htmlContent, attachments = []) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to,
            subject,
            html: htmlContent,
            attachments
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(' Email envoyé à', to, '| MessageID:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(' Erreur envoi email:', error.message);
        throw error;
    }
}

module.exports = { sendEmail };
