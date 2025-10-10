// routes/emailRoutes.js
const express = require('express');
const router = express.Router();
require('dotenv').config();

const { sendEmail } = require('../mailer'); // <-- adapte le chemin si besoin

// Helper : récupère l'email destinataire depuis différents champs possibles
function resolveRecipient(body) {
    return (
        body.to ||
        body.maican ||
        body.candidat?.maican ||
        body.candidatData?.maican ||
        body.candidatData?.candidat?.maican ||
        null
    );
}

// ---------------------------
// POST /api/email/receipt
// Envoi du reçu (PDF ou image en base64)
// Payload attendu (ex) : {
//   maican, nupcan, candidatData, pdfAttachment, imageAttachment, attachmentType
// }
// ---------------------------
router.post('/receipt', async (req, res) => {
    try {
        const {
            maican,
            nupcan,
            candidatData = {},
            pdfAttachment,
            imageAttachment,
            attachmentType
        } = req.body;

        const to = resolveRecipient(req.body);
        if (!to) return res.status(400).json({ success: false, message: 'Destinataire (email) manquant.' });
        if (!nupcan) return res.status(400).json({ success: false, message: 'NUPCAN manquant.' });

        // Préparer les pièces jointes si fournies (base64)
        const attachments = [];
        if (attachmentType === 'image' && imageAttachment) {
            attachments.push({
                filename: `Recu_Candidature_${nupcan}.png`,
                content: imageAttachment,
                encoding: 'base64',
                contentType: 'image/png'
            });
        } else if (pdfAttachment) {
            attachments.push({
                filename: `Recu_Candidature_${nupcan}.pdf`,
                content: pdfAttachment,
                encoding: 'base64',
                contentType: 'application/pdf'
            });
        }

        // Construction du HTML (tu peux ré-utiliser ton template complet ici)
        const html = `
      <div style="font-family: Arial, sans-serif; max-width:600px;margin:0 auto;">
        <h2>🎓 GABConcours</h2>
        <p>Bonjour <strong>${candidatData?.candidat?.prncan || ''} ${candidatData?.candidat?.nomcan || ''}</strong>,</p>
        <p>Votre candidature pour <strong>${candidatData?.concours?.libcnc || ''}</strong> a été enregistrée.</p>
        <p><strong>NUPCAN :</strong> ${nupcan}</p>
        <p>Documents soumis : <strong>${(candidatData?.documents?.length) || 0}</strong></p>
        <p>Veuillez conserver ce reçu. Il est joint en pièce jointe (${attachmentType === 'image' ? 'PNG' : 'PDF'}).</p>
        <p><a href="${process.env.APP_URL || 'http://localhost:3001'}/dashboard/${nupcan}">Accéder à votre espace candidat</a></p>
        <p>Cordialement,<br/>L'équipe GABConcours</p>
      </div>
    `;

        await sendEmail(to, `📋 Reçu de candidature - ${nupcan} - GABConcours`, html, attachments);

        return res.json({ success: true, message: 'Reçu envoyé par email avec succès.' });
    } catch (error) {
        console.error('Erreur /receipt:', error);
        return res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi du reçu', error: error.message });
    }
});


// ---------------------------
// POST /api/email/document-validation
// Notification de validation/rejet d'un document
// Payload attendu : { candidat: {...}, document: {...}, statut: 'valide'|'rejet', commentaire }
// ---------------------------
router.post('/document-validation', async (req, res) => {
    try {
        const { candidat, document, statut, commentaire } = req.body;
        const to = resolveRecipient(req.body);

        if (!to) return res.status(400).json({ success: false, message: 'Destinataire (email) manquant.' });
        if (!document || !document.nomdoc) return res.status(400).json({ success: false, message: 'Document manquant.' });

        const isValidated = String(statut).toLowerCase() === 'valide';
        const subject = isValidated
            ? `✅ Document validé - ${candidat?.nupcan || ''} - GABConcours`
            : `❌ Document rejeté - ${candidat?.nupcan || ''} - GABConcours`;

        const html = `
      <div style="font-family: Arial, sans-serif; max-width:600px;margin:0 auto;">
        <h2>${isValidated ? '✅ Document Validé' : '❌ Document Rejeté'}</h2>
        <p>Bonjour <strong>${candidat?.prncan || ''} ${candidat?.nomcan || ''}</strong>,</p>
        <p>Le document <strong>${document.nomdoc}</strong> a été <strong>${isValidated ? 'validé' : 'rejeté'}</strong>.</p>
        ${commentaire ? `<div style="background:#f3f4f6;padding:10px;border-radius:6px;margin:15px 0;"><strong>Commentaire :</strong><p>${commentaire}</p></div>` : ''}
        <p><a href="${process.env.APP_URL || 'http://localhost:3001'}/dashboard/${candidat?.nupcan || ''}">Accéder à mon espace candidat</a></p>
        <p>Cordialement,<br/>L'équipe GABConcours</p>
      </div>
    `;

        await sendEmail(to, subject, html);

        return res.json({ success: true, message: 'Notification envoyée avec succès.' });
    } catch (error) {
        console.error('Erreur /document-validation:', error);
        return res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi de la notification', error: error.message });
    }
});


// ---------------------------
// POST /api/email/admin-credentials
// Envoi automatique des identifiants à un nouvel administrateur
// Payload attendu : { admin: { email, prenom, nom, password } }
// NOTE: en prod => évite d'envoyer les mots de passe en clair ; préfère un lien de réinitialisation.
// ---------------------------
router.post('/admin-credentials', async (req, res) => {
    try {
        const { admin } = req.body;
        if (!admin || !admin.email) return res.status(400).json({ success: false, message: 'Objet admin ou email manquant.' });

        const passwordDisplay = admin.password ? `<p><strong>Mot de passe:</strong> ${admin.password}</p>` : '';
        const html = `
      <div style="font-family: Arial, sans-serif; max-width:600px;margin:0 auto;">
        <h2>Bienvenue sur GABConcours</h2>
        <p>Bonjour <strong>${admin.prenom || ''} ${admin.nom || ''}</strong>,</p>
        <p>Votre compte administrateur a été créé.</p>
        <p><strong>Email:</strong> ${admin.email}</p>
        ${passwordDisplay}
        <p>Connectez-vous ici : <a href="${process.env.APP_URL || 'http://localhost:3001'}/login">${process.env.APP_URL || 'http://localhost:3001'}/login</a></p>
        <p>Pour votre sécurité, changez votre mot de passe lors de la première connexion.</p>
        <p>Cordialement,<br/>L'équipe GABConcours</p>
      </div>
    `;

        await sendEmail(admin.email, 'Identifiants administrateur - GABConcours', html);

        return res.json({ success: true, message: 'Identifiants envoyés avec succès.' });
    } catch (error) {
        console.error('Erreur /admin-credentials:', error);
        return res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi des identifiants', error: error.message });
    }
});


module.exports = router;
