const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const emailService = require('./emailService'); // Importation du service d'email

// PUT /api/document-validation/:id - Valider/Rejeter un document
router.put('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const {statut, commentaire, admin_id} = req.body;

        console.log(`Validation document ${id} - Statut: ${statut}`);

        // Vérifier que le statut est valide
        if (!['valide', 'rejete', 'en_attente'].includes(statut)) {
            return res.status(400).json({
                success: false,
                message: 'Statut invalide',
                errors: ['Le statut doit être "valide", "rejete" ou "en_attente"']
            });
        }

        // Vérifier que le document existe
        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document non trouvé'
            });
        }

        // Mettre à jour le statut du document
        const updatedDocument = await Document.updateStatus(id, statut, commentaire);

        // Log de la validation pour audit
        console.log(`Document ${id} ${statut} par admin ${admin_id || 'système'}`);
        if (commentaire) {
            console.log(`Commentaire: ${commentaire}`);
        }

        // Récupérer les informations du candidat
        const Candidat = require('../models/Candidat');
        const candidat = await Candidat.findByNupcan(document.nupcan);

        // Vérifier et mettre à jour le statut du candidat automatiquement
        if (candidat) {
            const connection = require('../config/database').getConnection();
            
            // Récupérer tous les documents du candidat
            const [allDocuments] = await connection.execute(
                'SELECT statut FROM documents WHERE nupcan = ?',
                [candidat.nupcan]
            );
            
            // Vérifier le paiement
            const [paiement] = await connection.execute(
                'SELECT statut FROM paiements WHERE nipcan = ?',
                [candidat.nupcan]
            );
            
            const allDocsValid = allDocuments.length > 0 && allDocuments.every(doc => doc.statut === 'valide');
            const paiementValid = paiement.length > 0 && paiement[0].statut === 'valide';
            
            // Si tous les documents et le paiement sont valides, mettre à jour le statut du candidat
            if (allDocsValid && paiementValid) {
                await connection.execute(
                    'UPDATE candidats SET statut = "valide", updated_at = NOW() WHERE nupcan = ?',
                    [candidat.nupcan]
                );
                
                // Créer une notification
                try {
                    const Notification = require('../models/Notification');
                    await Notification.create({
                        candidat_id: candidat.id,
                        type: 'candidature',
                        titre: 'Candidature validée',
                        message: 'Félicitations ! Votre candidature a été entièrement validée. Tous vos documents et votre paiement ont été approuvés.',
                        lu: false
                    });
                } catch (notifError) {
                    console.error('Erreur création notification (non bloquant):', notifError);
                }
                
                // Envoyer un email
                try {
                    const emailService = require('../services/emailService');
                    await emailService.sendCandidatureValidated(candidat);
                } catch (emailError) {
                    console.error('Erreur envoi email (non bloquant):', emailError);
                }
            }
        }

        // Récupérer les informations du candidat pour l'email de document

        if (candidat) {
            // Envoyer email de notification
            try {
                const emailService = require('../services/emailService');
                await emailService.sendDocumentValidation(candidat, document, statut, commentaire);
            } catch (emailError) {
                console.error('Erreur envoi email (non bloquant):', emailError);
            }

            // Créer une notification
            try {
                const Notification = require('../models/Notification');
                await Notification.create({
                    candidat_id: candidat.id,
                    type: 'document',
                    titre: `Document ${statut === 'valide' ? 'validé' : 'rejeté'}`,
                    message: `Votre document "${document.nomdoc}" a été ${statut === 'valide' ? 'validé' : 'rejeté'}.${commentaire ? ' Commentaire: ' + commentaire : ''}`,
                    lu: false
                });
            } catch (notifError) {
                console.error('Erreur création notification (non bloquant):', notifError);
            }
        }

        res.json({
            success: true,
            data: updatedDocument,
            message: `Document ${statut} avec succès`
        });
    } catch (error) {
        console.error('Erreur lors de la validation du document:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/document-validation/stats - Statistiques de validation
router.get('/stats', async (req, res) => {
    try {
        const connection = require('../config/database').getConnection();

        const [stats] = await connection.execute(`
      SELECT 
        statut,
        COUNT(*) as count
      FROM documents 
      GROUP BY statut
    `);

        const [totalStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN statut = 'valide' THEN 1 END) as valide,
        COUNT(CASE WHEN statut = 'rejete' THEN 1 END) as rejete,
        COUNT(CASE WHEN statut = 'en_attente' THEN 1 END) as en_attente
      FROM documents
    `);

        res.json({
            success: true,
            data: {
                stats: stats,
                totals: totalStats[0]
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

module.exports = router;