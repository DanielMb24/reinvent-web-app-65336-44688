const express = require('express');
const router = express.Router();
const Paiement = require('../models/Paiement');
const Candidat = require('../models/Candidat');
const cinetpayService = require('../services/cinetpayService');

// GET /api/paiements/nupcan/:nupcan - Récupérer paiement par NUPCAN
router.get('/nupcan/:nupcan', async (req, res) => {
    try {
        const {nupcan} = req.params;
        const decodedNupcan = decodeURIComponent(nupcan);

        console.log('Recherche paiement pour NUPCAN:', decodedNupcan);

        const paiement = await Paiement.findByNupcan(decodedNupcan);

        res.json({
            success: true,
            data: paiement,
            message: 'Paiement récupéré avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du paiement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// POST /api/paiements - Créer un nouveau paiement
router.post('/', async (req, res) => {
    try {
        const paiementData = req.body;
        console.log('Création paiement - Données reçues:', paiementData);
// === AJOUT ===
        if (paiementData.methode === 'cinetpay') {
            const cinetResponse = await cinetpayService.initPayment(paiementData);

            if (!cinetResponse.success) {
                return res.status(400).json({
                    success: false,
                    message: cinetResponse.message
                });
            }

            // Enregistre le paiement avec statut "en_attente"
            paiementData.statut = 'en_attente';
            paiementData.reference_paiement = paiementData.reference_paiement || Date.now().toString();

            const paiement = await Paiement.create(paiementData);

            return res.status(201).json({
                success: true,
                data: {
                    paiement,
                    payment_url: cinetResponse.payment_url
                },
                message: 'Paiement en attente. Redirection vers CinetPay.'
            });
        }

        // Validation des données obligatoires
        if (!paiementData.nupcan && !paiementData.nipcan) {
            return res.status(400).json({
                success: false,
                message: 'NUPCAN requis',
                errors: ['Le NUPCAN est obligatoire pour créer un paiement']
            });
        }

        if (!paiementData.montant || parseFloat(paiementData.montant) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Montant invalide',
                errors: ['Le montant doit être supérieur à 0']
            });
        }

        // Récupérer les informations du candidat par NUPCAN
        let candidat = null;
        let concours = null;
        try {
            const nupcan = paiementData.nupcan || paiementData.nipcan;
            console.log('Recherche candidat pour NUPCAN:', nupcan);

            candidat = await Candidat.findByNupcan(nupcan);
            if (candidat) {
                paiementData.candidat_id = candidat.id;
                paiementData.concours_id = candidat.concours_id;
                paiementData.nupcan = candidat.nupcan;
                console.log('Candidat trouvé:', candidat.id);
                
                // Récupérer le concours
                const Concours = require('../models/Concours');
                concours = await Concours.findById(candidat.concours_id);
                
                if (!concours) {
                    console.log('Concours non trouvé pour ID:', candidat.concours_id);
                }
            } else {
                console.log('Aucun candidat trouvé pour NUPCAN:', nupcan);
            }
        } catch (error) {
            console.log('Erreur lors de la recherche du candidat:', error.message);
        }

        // Créer le paiement
        const paiement = await Paiement.create(paiementData);
        console.log('Paiement créé avec succès:', paiement.id);

        // Générer le reçu PDF si le paiement est validé
        if (paiement.statut === 'valide' && candidat && concours) {
            try {
                const pdfService = require('../services/pdfService');
                const receipt = await pdfService.generatePaymentReceipt(candidat, paiement, concours);
                await Paiement.update(paiement.id, { recu_path: receipt.relativePath });
                paiement.recu_path = receipt.relativePath;
                
                // Envoyer l'email de confirmation
                const emailService = require('../services/emailService');
                await emailService.sendPaymentConfirmation(candidat, paiement);
                
                // Créer une notification
                const Notification = require('../models/Notification');
                await Notification.create({
                    candidat_id: candidat.id,
                    type: 'paiement',
                    titre: 'Paiement confirmé',
                    message: `Votre paiement de ${paiement.montant} FCFA a été validé avec succès.`,
                    lu: false
                });
            } catch (pdfError) {
                console.error('Erreur génération reçu:', pdfError);
                // Ne pas bloquer si PDF échoue
            }
        }

        res.status(201).json({
            success: true,
            data: paiement,
            message: 'Paiement créé avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la création du paiement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du paiement',
            errors: [error.message]
        });
    }
});



router.post('/cinetpay/callback', async (req, res) => {
    try {
        const { transaction_id } = req.body;
        console.log('Callback reçu de CinetPay:', transaction_id);

        const cinetpayService = require('../services/cinetpayService');
        const verification = await cinetpayService.verifyPayment(transaction_id);

        if (verification.data.status === "ACCEPTED") {
            await Paiement.updateByReference(transaction_id, { statut: 'valide' });
            console.log('Paiement validé:', transaction_id);
            res.status(200).send('OK');
        } else {
            console.log('Paiement non accepté:', verification.data.status);
            res.status(200).send('En attente');
        }
    } catch (error) {
        console.error('Erreur callback CinetPay:', error);
        res.status(500).send('Erreur serveur');
    }
});



// GET /api/paiements - Récupérer tous les paiements
router.get('/', async (req, res) => {
    try {
        const paiements = await Paiement.findAll();
        res.json({
            success: true,
            data: paiements || [],
            message: 'Paiements récupérés avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des paiements:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// PUT /api/paiements/:id - Mettre à jour un paiement
router.put('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const paiementData = req.body;

        const paiement = await Paiement.update(id, paiementData);

        res.json({
            success: true,
            data: paiement,
            message: 'Paiement mis à jour avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du paiement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// PUT /api/paiements/:id/validate - Valider un paiement
router.put('/:id/validate', async (req, res) => {
    try {
        const {id} = req.params;
        const paiement = await Paiement.validate(id);
        
        if (!paiement) {
            return res.status(404).json({
                success: false,
                message: 'Paiement non trouvé'
            });
        }
        
        // Générer le reçu PDF
        try {
            const candidat = await Candidat.findByNupcan(paiement.nupcan);
            if (candidat) {
                const Concours = require('../models/Concours');
                const concours = await Concours.findById(candidat.concours_id);
                
                const pdfService = require('../services/pdfService');
                const receipt = await pdfService.generatePaymentReceipt(candidat, paiement, concours);
                await Paiement.update(id, { recu_path: receipt.relativePath });
                
                // Envoyer l'email de confirmation
                const emailService = require('../services/emailService');
                await emailService.sendPaymentConfirmation(candidat, paiement);
            }
        } catch (pdfError) {
            console.error('Erreur génération reçu:', pdfError);
        }

        res.json({
            success: true,
            data: paiement,
            message: 'Paiement validé avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la validation du paiement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/paiements/:id/receipt - Télécharger le reçu
router.get('/:id/receipt', async (req, res) => {
    try {
        const {id} = req.params;
        const paiement = await Paiement.findById(id);
        
        if (!paiement || !paiement.recu_path) {
            return res.status(404).json({
                success: false,
                message: 'Reçu non trouvé'
            });
        }
        
        const path = require('path');
        const filePath = path.join(__dirname, '..', paiement.recu_path);
        
        res.download(filePath);
    } catch (error) {
        console.error('Erreur téléchargement reçu:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});

module.exports = router;
