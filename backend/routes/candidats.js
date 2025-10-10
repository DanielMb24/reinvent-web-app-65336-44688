const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const Candidat = require('../models/Candidat');
const Counter = require('../models/Counter');
const Concours = require('../models/Concours');

// Configuration multer pour l'upload de photos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadDir;
        if (file.fieldname === 'phtcan') {
            uploadDir = './uploads/photos/';
        } else {
            uploadDir = './uploads/documents/';
        }

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, {recursive: true});
            console.log(`Répertoire créé: ${uploadDir}`);
        }

        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        if (file.fieldname === 'phtcan') {
            cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname));
        } else {
            cb(null, 'document-' + uniqueSuffix + path.extname(file.originalname));
        }
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'phtcan') {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Seules les images sont autorisées pour la photo'), false);
            }
        } else {
            const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
            const fileExt = path.extname(file.originalname).toLowerCase();
            if (allowedTypes.includes(fileExt)) {
                cb(null, true);
            } else {
                cb(new Error('Type de fichier non autorisé'), false);
            }
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    }
});

// GET /api/candidats - Récupérer tous les candidats
router.get('/', async (req, res) => {
    try {
        const candidats = await Candidat.findAll();
        console.log('Candidats récupérés:', candidats.length); // Log ajouté
        res.json({
            success: true,
            data: candidats,
            message: 'Candidats récupérés avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des candidats:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/candidats/nupcan/:nupcan - Récupérer un candidat par NUPCAN avec toutes ses données
router.get('/nupcan/:nupcan', async (req, res) => {
    try {
        const nupcan = req.params.nupcan;
        console.log('Recherche candidat complet par NUPCAN:', nupcan);

        const candidat = await Candidat.findByNupcan(nupcan);
        if (!candidat) {
            return res.status(404).json({
                success: false,
                message: 'Candidat introuvable avec ce NUPCAN'
            });
        }

        let documents = [];
        try {
            const Dossier = require('../models/Dossier');
            documents = await Dossier.findByNupcan(nupcan);
            console.log('Documents trouvés:', documents.length);
        } catch (docError) {
            console.log('Erreur lors de la récupération des documents:', docError.message);
        }

        let paiement = null;
        try {
            const Paiement = require('../models/Paiement');
            paiement = await Paiement.findByNupcan(nupcan);
            console.log('Paiement trouvé:', paiement ? 'Oui' : 'Non');
        } catch (payError) {
            console.log('Erreur lors de la récupération du paiement:', payError.message);
        }

        let etape = 'documents';
        let etapesCompletes = ['inscription'];
        let pourcentage = 33;

        if (documents.length > 0) {
            etapesCompletes.push('documents');
            etape = 'paiement';
            pourcentage = 67;
        }

        if (paiement && paiement.statut === 'valide') {
            etapesCompletes.push('paiement');
            etape = 'complete';
            pourcentage = 100;
        }

        let concours = null;
        let filiere = null;
        try {
            if (candidat.concours_id) {
                concours = await Concours.findById(candidat.concours_id);
            }

            if (candidat.filiere_id) {
                const Filiere = require('../models/Filiere');
                filiere = await Filiere.findById(candidat.filiere_id);
            }
        } catch (error) {
            console.log('Erreur lors de la récupération des informations concours/filière:', error);
        }

        // Créer automatiquement une participation si elle n'existe pas
        const { getConnection } = require('../config/database');
        const connection = getConnection();
        
        try {
            const [participations] = await connection.execute(
                'SELECT * FROM participations WHERE candidat_id = ? AND concours_id = ?',
                [candidat.id, candidat.concours_id]
            );
            
            if (participations.length === 0) {
                await connection.execute(
                    `INSERT INTO participations 
                     (candidat_id, concours_id, statut, date_participation)
                     VALUES (?, ?,  '1', NOW())`,
                    [candidat.id, candidat.concours_id]
                );
            }
        } catch (partError) {
            console.error('Erreur création participation:', partError);
        }

        const candidatData = {
            ...candidat,
            documents: documents,
            paiement: paiement,
            concours: concours,
            filiere: filiere,
            etape: etape,
            progression: {
                etapeActuelle: etape,
                etapesCompletes: etapesCompletes,
                pourcentage: pourcentage
            }
        };

        console.log('Candidat complet assemblé:', {
            id: candidatData.id,
            nupcan: candidatData.nupcan,
            etape: candidatData.etape,
            documentsCount: documents.length,
            hasPaiement: !!paiement
        });

        res.json({
            success: true,
            data: candidatData,
            message: 'Candidat récupéré avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du candidat:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/candidats/:id - Récupérer un candidat par ID
router.get('/:id', async (req, res) => {
    try {
        const candidat = await Candidat.findById(req.params.id);
        if (!candidat) {
            return res.status(404).json({
                success: false,
                message: 'Candidat introuvable'
            });
        }
        res.json({
            success: true,
            data: candidat
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du candidat:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/candidats/nip/:nip - Récupérer un candidat par NIP
router.get('/nip/:nip', async (req, res) => {
    try {
        const candidat = await Candidat.findByNip(req.params.nip);
        if (!candidat) {
            return res.status(404).json({
                success: false,
                message: 'Candidat introuvable avec ce NIP'
            });
        }
        res.json({
            success: true,
            data: candidat
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du candidat:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// POST /api/candidats - Créer un nouveau candidat avec photo
router.post('/', upload.single('phtcan'), async (req, res) => {
    try {
        console.log('=== CRÉATION CANDIDAT ===');
        console.log('Body reçu:', req.body);
        console.log('Fichier reçu:', req.file ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path
        } : 'Aucun fichier');

        const requiredFields = ['nomcan', 'prncan', 'maican', 'dtncan', 'telcan', 'ldncan', 'niveau_id', 'proorg'];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            console.log('Champs manquants:', missingFields);
            return res.status(400).json({
                success: false,
                message: 'Champs requis manquants',
                errors: [`Champs manquants: ${missingFields.join(', ')}`]
            });
        }

        const nupcan = await Counter.getNextNupcan();
        console.log('NUPCAN généré:', nupcan);

        const candidatData = {
            ...req.body,
            nupcan: nupcan,
            filiere_id: req.body.filiere_id || null
        };

        if (req.file) {
            candidatData.phtcan = req.file.filename;
            console.log('Photo ajoutée:', req.file.filename);
            console.log('Chemin complet photo:', req.file.path);
        } else {
            console.log('⚠️ Aucune photo reçue dans la requête');
        }

        console.log('Données finales pour création:', candidatData);

        const candidat = await Candidat.create(candidatData);

        console.log('✅ Candidat créé avec succès:', candidat);

        // Envoyer email de confirmation
        try {
            const emailService = require('../services/emailService');
            await emailService.sendRegistrationConfirmation(candidat);
        } catch (emailError) {
            console.error('Erreur envoi email confirmation:', emailError);
        }

        res.status(201).json({
            success: true,
            data: candidat,
            message: 'Candidat créé avec succès'
        });
    } catch (error) {
        console.error('ERREUR CRÉATION CANDIDAT:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la création',
            errors: [error.message]
        });
    }
});

// PUT /api/candidats/:id - Mettre à jour un candidat
router.put('/:id', async (req, res) => {
    try {
        const candidat = await Candidat.update(req.params.id, req.body);
        res.json({
            success: true,
            data: candidat,
            message: 'Candidat mis à jour avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du candidat:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// PUT /api/candidats/:id/filiere - Mettre à jour la filière d'un candidat
router.put('/:id/filiere', async (req, res) => {
    try {
        const {filiere_id} = req.body;
        const candidatId = req.params.id;

        if (!filiere_id) {
            return res.status(400).json({
                success: false,
                message: 'ID de filière requis'
            });
        }

        const candidat = await Candidat.update(candidatId, {filiere_id});

        res.json({
            success: true,
            data: candidat,
            message: 'Filière mise à jour avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la filière:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

module.exports = router;