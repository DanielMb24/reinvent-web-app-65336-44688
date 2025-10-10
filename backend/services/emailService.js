const nodemailer = require('nodemailer');

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

class EmailService {
    // Envoyer les identifiants à un nouvel admin
    async sendAdminCredentials(adminData) {
        try {
            console.log('Envoi email identifiants admin:', adminData.email);

            const mailOptions = {
                from: process.env.SMTP_USER || 'noreply@concours.ga',
                to: adminData.email,
                subject: 'Vos identifiants administrateur - Plateforme Concours',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Bienvenue sur la plateforme de gestion des concours</h2>
            
            <p>Bonjour ${adminData.prenom} ${adminData.nom},</p>
            
            <p>Votre compte administrateur a été créé avec succès. Voici vos identifiants de connexion :</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Email :</strong> ${adminData.email}</p>
              <p><strong>Mot de passe temporaire :</strong> ${adminData.temp_password}</p>
              <p><strong>Établissement :</strong> ${adminData.etablissement_nom || 'À définir'}</p>
            </div>
            
            <p style="color: #dc2626;"><strong>Important :</strong> Veuillez changer votre mot de passe lors de votre première connexion.</p>
            
            <p>Vous pouvez vous connecter à l'adresse : <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/admin/login">Connexion Admin</a></p>
            
            <p>Cordialement,<br>L'équipe de gestion des concours</p>
          </div>
        `
            };

            await transporter.sendMail(mailOptions);
            console.log('Email identifiants envoyé avec succès');
        } catch (error) {
            console.error('Erreur envoi email identifiants:', error);
            throw error;
        }
    }

    async sendRegistrationConfirmation(candidat) {
        try {
            console.log('Envoi email confirmation inscription à:', candidat.maican);

            const mailOptions = {
                from: process.env.SMTP_USER || 'noreply@concours.ga',
                to: candidat.maican,
                subject: 'Confirmation d\'inscription - Plateforme Concours',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Bienvenue sur la plateforme de gestion des concours</h2>
            
            <p>Bonjour ${candidat.prncan} ${candidat.nomcan},</p>
            
            <p>Votre candidature a été créée avec succès. Continuez le téléversement des documents.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Email :</strong> ${candidat.maican}</p>
              <p><strong>NUPCAN :</strong> ${candidat.nupcan}</p>
           </div>
            
            <p>Vous pouvez consulter votre espace candidat pour compléter votre dossier.</p>
            
            <p>Cordialement,<br>L'équipe de gestion des concours</p>
          </div>
        `
            };

            await transporter.sendMail(mailOptions);
            console.log('Email confirmation inscription envoyé avec succès');
        } catch (error) {
            console.error('Erreur envoi email confirmation inscription:', error);
            throw error;
        }
    }

    // Envoyer un reçu PDF par email
    async sendReceiptEmail(candidatData) {
        try {
            console.log('Envoi reçu email à:', candidatData.maican);

            const mailOptions = {
                from: process.env.SMTP_USER || 'noreply@concours.ga',
                to: candidatData.maican,
                subject: `Reçu de candidature - ${candidatData.nupcan}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Reçu de candidature</h2>
            
            <p>Bonjour ${candidatData.prncan} ${candidatData.nomcan},</p>
            
            <p>Votre candidature a été enregistrée avec succès.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>NUPCAN :</strong> ${candidatData.nupcan}</p>
              <p><strong>Concours :</strong> ${candidatData.libcnc || 'À sélectionner'}</p>
              <p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
            </div>
            
            <p>Conservez ce reçu précieusement.</p>
            
            <p>Cordialement,<br>L'équipe de gestion des concours</p>
          </div>
        `
            };

            await transporter.sendMail(mailOptions);
            console.log('Email reçu envoyé avec succès');
        } catch (error) {
            console.error('Erreur envoi reçu email:', error);
            throw error;
        }
    }

    // Envoyer un reçu image par email
    async sendReceiptImageEmail(data) {
        try {
            console.log('Envoi reçu image email à:', data.maican);

            const mailOptions = {
                from: process.env.SMTP_USER || 'noreply@concours.ga',
                to: data.maican,
                subject: `Reçu de candidature (Image) - ${data.nupcan}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Reçu de candidature</h2>
            
            <p>Bonjour ${data.prncan} ${data.nomcan},</p>
            
            <p>Voici votre reçu de candidature au format image.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>NUPCAN :</strong> ${data.nupcan}</p>
              <p><strong>Concours :</strong> ${data.libcnc || 'À sélectionner'}</p>
              <p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
            </div>
            
            <p>Le reçu est joint à cet email au format image.</p>
            
            <p>Cordialement,<br>L'équipe de gestion des concours</p>
          </div>
        `,
                attachments: [
                    {
                        filename: `recu-${data.nupcan}.png`,
                        content: data.imageData,
                        encoding: 'base64',
                        contentType: 'image/png'
                    }
                ]
            };

            await transporter.sendMail(mailOptions);
            console.log('Email reçu image envoyé avec succès');
        } catch (error) {
            console.error('Erreur envoi reçu image email:', error);
            throw error;
        }
    }

    // Envoyer une notification de validation de document
    async sendDocumentValidationEmail(data) {
        try {
            console.log('Envoi notification validation à:', data.maican);

            const statutText = data.statut === 'valide' ? 'validé' : 'rejeté';
            const color = data.statut === 'valide' ? '#059669' : '#dc2626';

            const mailOptions = {
                from: process.env.SMTP_USER || 'noreply@concours.ga',
                to: data.maican,
                subject: `Document ${statutText} - ${data.documentName}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: ${color};">Document ${statutText}</h2>
            
            <p>Votre document a été examiné par notre équipe administrative.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Document :</strong> ${data.documentName}</p>
              <p><strong>Statut :</strong> <span style="color: ${color}; font-weight: bold;">${statutText.toUpperCase()}</span></p>
              ${data.commentaire ? `<p><strong>Commentaire :</strong> ${data.commentaire}</p>` : ''}
            </div>
            
            ${data.statut === 'rejete' ?
                    '<p style="color: #dc2626;">Veuillez corriger votre document selon le commentaire et le soumettre à nouveau.</p>' :
                    '<p style="color: #059669;">Félicitations ! Votre document a été validé.</p>'
                }
            
            <p>Vous pouvez consulter l\'état de vos documents dans votre espace candidat.</p>
            
            <p>Cordialement,<br>L'équipe de gestion des concours</p>
          </div>
        `
            };

            await transporter.sendMail(mailOptions);
            console.log('Email notification validation envoyé avec succès');
        } catch (error) {
            console.error('Erreur envoi notification validation:', error);
            throw error;
        }
    }

    // Email de confirmation de paiement
    async sendPaymentConfirmation(candidat, paiement) {
        const mailOptions = {
            from: process.env.SMTP_USER || 'noreply@gabconcours.com',
            to: candidat.maican,
            subject: 'Confirmation de paiement - GabConcours',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #10b981;">Paiement Confirmé</h1>
                    <p>Bonjour <strong>${candidat.prncan} ${candidat.nomcan}</strong>,</p>
                    <p>Votre paiement a été confirmé avec succès.</p>
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Montant :</strong> ${paiement.montant} FCFA</p>
                        <p><strong>Méthode :</strong> ${paiement.methode}</p>
                        <p><strong>Référence :</strong> ${paiement.reference_paiement}</p>
                        <p><strong>Date :</strong> ${new Date(paiement.created_at).toLocaleString('fr-FR')}</p>
                    </div>
                    <p>Votre candidature est maintenant complète. Vous recevrez les informations sur les épreuves prochainement.</p>
                    <p>Cordialement,<br/>L'équipe GabConcours</p>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log('Email de confirmation paiement envoyé à:', candidat.maican);
        } catch (error) {
            console.error('Erreur envoi email paiement:', error);
            throw error;
        }
    }

    // Email de validation de document
    async sendDocumentValidation(candidat, document, statut, commentaire) {
        const isApproved = statut === 'valide';
        const mailOptions = {
            from: process.env.SMTP_USER || 'noreply@gabconcours.com',
            to: candidat.maican,
            subject: `Document ${isApproved ? 'Validé' : 'Rejeté'} - GabConcours`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: ${isApproved ? '#10b981' : '#ef4444'};">
                        Document ${isApproved ? 'Validé' : 'Rejeté'}
                    </h1>
                    <p>Bonjour <strong>${candidat.prncan} ${candidat.nomcan}</strong>,</p>
                    <p>Votre document <strong>${document.nomdoc}</strong> a été ${isApproved ? 'validé' : 'rejeté'}.</p>
                    ${commentaire ? `
                        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>Commentaire :</strong></p>
                            <p>${commentaire}</p>
                        </div>
                    ` : ''}
                    ${!isApproved ? `
                        <p style="color: #dc2626;">
                            Veuillez soumettre un nouveau document corrigé dans votre espace candidat.
                        </p>
                    ` : ''}
                    <p>Cordialement,<br/>L'équipe GabConcours</p>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log('Email de validation document envoyé à:', candidat.maican);
        } catch (error) {
            console.error('Erreur envoi email validation document:', error);
            throw error;
        }
    }
}

// Fonction générique d'envoi d'email
async function sendEmail(to, subject, html) {
    try {
        const mailOptions = {
            from: process.env.SMTP_USER || 'noreply@gabconcours.ga',
            to: to,
            subject: subject,
            html: html
        };

        await transporter.sendMail(mailOptions);
        console.log('Email envoyé avec succès à:', to);
        return true;
    } catch (error) {
        console.error('Erreur envoi email:', error);
        throw error;
    }
}

module.exports = new EmailService();
module.exports.sendEmail = sendEmail;