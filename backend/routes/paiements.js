const express = require('express');
const router = express.Router();
const Paiement = require('../models/Paiement');
const Candidat = require('../models/Candidat');
const cinetpayService = require('../services/cinetpayService');
const Concours = require('../models/Concours');

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

        // === GESTION CINETPAY (inchangée) ===
        if (paiementData.methode === 'cinetpay') {
            const cinetResponse = await cinetpayService.initPayment(paiementData);
            if (!cinetResponse.success) {
                return res.status(400).json({
                    success: false,
                    message: cinetResponse.message
                });
            }
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
        const isGorriPayment = paiementData.methode === 'gorri';

        if (!paiementData.nupcan && !paiementData.nipcan) {
            return res.status(400).json({
                success: false,
                message: 'NUPCAN requis',
                errors: ['Le NUPCAN est obligatoire pour créer un paiement']
            });
        }

        // 💡 MODIFICATION : Validation Montant
        if (!isGorriPayment) {
            if (!paiementData.montant || parseFloat(paiementData.montant) <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Montant invalide',
                    errors: ['Le montant doit être strictement supérieur à 0 pour un paiement non-Gorri']
                });
            }
        } else {
            if (parseFloat(paiementData.montant) !== 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Incohérence Gorri',
                    errors: ['Le montant doit être 0 pour un paiement Gorri']
                });
            }
        }


        // Récupérer/Confirmer les informations du candidat et du concours
        let candidat = null;
        let concours = null;
        const nupcan = paiementData.nupcan || paiementData.nipcan;

        // 💡 Utiliser les IDs du front-end si disponibles, sinon chercher par NUPCAN
        const candidat_id_from_client = paiementData.candidat_id;
        const concours_id_from_client = paiementData.concours_id;

        try {
            // 1. Chercher le candidat (principalement pour obtenir l'email et les autres IDs)
            if (candidat_id_from_client) {
                candidat = await Candidat.findById(candidat_id_from_client);
            } else if (nupcan) {
                candidat = await Candidat.findByNupcan(nupcan);
            }

            if (candidat) {
                // Mettre à jour les IDs dans le payload avec ceux du candidat trouvé
                paiementData.candidat_id = candidat.id;
                paiementData.concours_id = candidat.concours_id;
                paiementData.nupcan = candidat.nupcan;

                // Récupérer le concours pour le reçu/email
                concours = await Concours.findById(candidat.concours_id);
            } else {
                // Si aucune donnée candidat trouvée, utiliser les IDs bruts du payload si présents
                if (candidat_id_from_client && concours_id_from_client) {
                    concours = await Concours.findById(concours_id_from_client);
                    console.warn('Candidat non trouvé, mais paiement en cours avec IDs de concours/candidat fournis par le client.');
                } else {
                    console.log('Aucun candidat trouvé. Le reçu/email sera incomplet.');
                }
            }
        } catch (error) {
            console.log('Erreur lors de la recherche/confirmation du candidat/concours:', error.message);
        }

        // Créer le paiement (avec ou sans candidat_id/concours_id, le modèle gère le null)
        const paiement = await Paiement.create(paiementData);
        console.log('Paiement créé avec succès:', paiement.id);

        // Générer le reçu PDF si le paiement est validé ET que les données de base sont là
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
                console.error('Erreur génération reçu/email:', pdfError);
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


// ... (reste des routes cinetpay/GET/PUT inchangées)

module.exports = router;