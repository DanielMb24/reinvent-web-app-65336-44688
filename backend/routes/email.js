const express = require('express');
const router = express.Router();
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

// POST /api/email/receipt - Envoyer le reçu par email
router.post('/receipt', async (req, res) => {
    try {
        const {maican, nupcan, candidatData, pdfAttachment, imageAttachment, attachmentType} = req.body;

        console.log('Envoi reçu par email pour:', maican, nupcan);

        let attachments = [];

        if (attachmentType === 'image' && imageAttachment) {
            attachments.push({
                filename: `Recu_Candidature_${nupcan}.png`,
                content: imageAttachment,
                encoding: 'base64'
            });
        } else if (pdfAttachment) {
            attachments.push({
                filename: `Recu_Candidature_${nupcan}.pdf`,
                content: pdfAttachment,
                encoding: 'base64'
            });
        }

        const mailOptions = {
            from: process.env.EMAIL_USER || 'Dapierre25@gmail.com',
            to: maican,
            subject: ` Reçu de candidature - ${nupcan} - GABConcours`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎓 GABConcours</h1>
            <p style="color: #e2e8f0; margin: 10px 0 0 0;">République Gabonaise - Plateforme Officielle</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; margin-top: 0;"> Votre Reçu de Candidature</h2>
            
            <p>Bonjour <strong>${candidatData.candidat.prncan} ${candidatData.candidat.nomcan}</strong>,</p>
            
            <p>Nous vous confirmons la réception de votre candidature pour le concours :</p>
            
            <div style="background: white; padding: 20px; border-left: 4px solid #2563eb; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <h3 style="margin-top: 0; color: #2563eb;"> ${candidatData.concours.libcnc}</h3>
              <p style="margin: 5px 0;"><strong> Établissement :</strong> ${candidatData.concours.etablissement_nomets || 'Non spécifié'}</p>
              <p style="margin: 5px 0;"><strong> NUPCAN:</strong> ${nupcan}</p>
              <p style="margin: 5px 0;"><strong> Frais:</strong> ${
                !candidatData.concours.fracnc || candidatData.concours.fracnc === 0
                    ? ' GRATUIT (Programme NGORI)'
                    : `${candidatData.concours.fracnc} FCFA`
            }</p>
            </div>
            
            <div style="background: #ecfdf5; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #166534;"><strong> Statut :</strong> Candidature enregistrée avec succès</p>
            </div>
            
            <p><strong> Documents soumis:</strong> ${candidatData.documents.length} document(s)</p>
            
            <p>Vous trouverez en pièce jointe votre reçu officiel de candidature${attachmentType === 'image' ? ' (format PNG)' : ' (format PDF)'}.</p>
            
            <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;"><strong> Important:</strong></p>
              <ul style="margin: 10px 0; color: #92400e;">
                <li>Conservez précieusement ce reçu</li>
                <li>Il vous sera demandé le jour de l'examen</li>
                <li>Suivez régulièrement votre espace candidat</li>
                <li>Vous recevrez des notifications par email</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.APP_URL || 'http://localhost:3001'}/dashboard/${nupcan}" 
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                 Accéder à mon espace candidat
              </a>
            </div>
            
            <p>Pour toute question, contactez-nous à cette adresse email.</p>
            
            <p style="margin-top: 30px;">
              Cordialement,<br>
              <strong>L'équipe GABConcours</strong><br>
              <em>République Gabonaise</em>
            </p>
          </div>
          
          <div style="background: #1e293b; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="color: #94a3b8; margin: 0; font-size: 12px;">
              GABConcours - Plateforme Officielle des Concours du Gabon<br>
              Ne répondez pas à cet email automatique
            </p>
          </div>
        </div>
      `,
            attachments: attachments
        };

        // Envoi réel de l'email
        await transporter.sendMail(mailOptions);

        console.log('Email envoyé avec succès à:', maican);

        res.json({
            success: true,
            message: 'Reçu envoyé par email avec succès'
        });
    } catch (error) {
        console.error('Erreur envoi email:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'envoi du reçu',
            error: error.message
        });
    }
});

// POST /api/email/document-validation - Envoyer notification validation document
router.post('/document-validation', async (req, res) => {
    try {
        const {candidat, document, statut, commentaire} = req.body;

        console.log('Envoi notification validation document à:', candidat.maican);

        const isValidated = statut === 'valide';
        const subject = isValidated ?
            ` Document validé - ${candidat.nupcan} - GABConcours` :
            ` Document rejeté - ${candidat.nupcan} - GABConcours`;

        const mailOptions = {
            from: process.env.EMAIL_USER || 'Dapierre25@gmail.com',
            to: candidat.maican,
            subject: subject,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎓 GABConcours</h1>
            <p style="color: #e2e8f0; margin: 10px 0 0 0;">République Gabonaise - Plateforme Officielle</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; margin-top: 0;">
              ${isValidated ? ' Document Validé' : ' Document Rejeté'}
            </h2>
            
            <p>Bonjour <strong>${candidat.prncan} ${candidat.nomcan}</strong>,</p>
            
            <p>Nous vous informons que votre document a été ${isValidated ? 'validé' : 'rejeté'} par notre équipe administrative.</p>
            
            <div style="background: white; padding: 20px; border-left: 4px solid ${isValidated ? '#10b981' : '#ef4444'}; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <h3 style="margin-top: 0; color: ${isValidated ? '#10b981' : '#ef4444'};"> ${document.type}</h3>
              <p style="margin: 5px 0;"><strong> Nom du fichier:</strong> ${document.nomdoc}</p>
              <p style="margin: 5px 0;"><strong> NUPCAN:</strong> ${candidat.nupcan}</p>
              <p style="margin: 5px 0;"><strong> Statut:</strong> ${isValidated ? 'Validé' : 'Rejeté'}</p>
            </div>
            
            ${commentaire ? `
              <div style="background: #f3f4f6; border: 1px solid #d1d5db; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #374151;"><strong> Commentaire:</strong></p>
                <p style="margin: 10px 0 0 0; color: #6b7280;">${commentaire}</p>
              </div>
            ` : ''}
            
            <div style="background: ${isValidated ? '#ecfdf5' : '#fef2f2'}; border: 1px solid ${isValidated ? '#bbf7d0' : '#fecaca'}; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: ${isValidated ? '#166534' : '#dc2626'};">
                <strong>${isValidated ? ' Félicitations!' : ' Action requise'}</strong>
              </p>
              <p style="margin: 10px 0 0 0; color: ${isValidated ? '#166534' : '#dc2626'};">
                ${isValidated
                ? 'Votre document a été accepté. Vous pouvez continuer votre candidature.'
                : 'Veuillez corriger et soumettre à nouveau votre document.'}
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.APP_URL || 'http://localhost:3001'}/dashboard/${candidat.nupcan}" 
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                 Accéder à mon espace candidat
              </a>
            </div>
            
            <p>Pour toute question, contactez-nous à cette adresse email.</p>
            
            <p style="margin-top: 30px;">
              Cordialement,<br>
              <strong>L'équipe GABConcours</strong><br>
              <em>République Gabonaise</em>
            </p>
          </div>
          
          <div style="background: #1e293b; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="color: #94a3b8; margin: 0; font-size: 12px;">
               GABConcours - Plateforme Officielle des Concours du Gabon<br>
               Ne répondez pas à cet email automatique
            </p>
          </div>
        </div>
      `
        };

        // Envoi réel de l'email
        await transporter.sendMail(mailOptions);

        console.log('Notification envoyée avec succès à:', candidat.maican);

        res.json({
            success: true,
            message: 'Notification envoyée avec succès'
        });
    } catch (error) {
        console.error('Erreur envoi notification:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'envoi de la notification',
            error: error.message
        });
    }
});

module.exports = router;
