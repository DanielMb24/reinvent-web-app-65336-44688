const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Document = require('../models/Document');
const Dossier = require('../models/Dossier');
const {getConnection} = require("../config/database");

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'uploads', 'documents')); // Ensure this directory exists
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Avoid filename conflicts
    },
});

const upload = multer({storage: storage}); // Initialize multer with storage

// GET /api/documents/nupcan/:nupcan - Récupérer les documents par NUPCAN
router.get('/nupcan/:nupcan', async (req, res) => {
    try {
        const {nupcan} = req.params;
        console.log('Recherche documents pour NUPCAN:', nupcan);

        if (!nupcan || nupcan === 'null' || nupcan === 'undefined') {
            return res.status(400).json({
                success: false,
                message: 'NUPCAN invalide',
            });
        }

        const documents = await Dossier.findByNupcan(nupcan);

        res.json({
            success: true,
            data: documents || [],
            message: 'Documents récupérés avec succès',
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des documents:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message],
        });
    }
});

// POST /api/documents - Créer un nouveau document
router.post('/', async (req, res) => {
    try {
        const documentData = req.body;
        console.log('Création document:', documentData);

        if (!documentData.nupcan) {
            return res.status(400).json({
                success: false,
                message: 'NUPCAN requis pour créer un document',
            });
        }

        const document = await Document.create(documentData);

        res.status(201).json({
            success: true,
            data: document,
            message: 'Document créé avec succès',
        });
    } catch (error) {
        console.error('Erreur lors de la création du document:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message],
        });
    }
});

// PUT /api/documents/:id/status - Mettre à jour le statut d'un document
router.put('/:id/status', async (req, res) => {
    try {
        const {id} = req.params;
        const {status} = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Statut requis',
            });
        }

        const document = await Document.updateStatus(id, status);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document non trouvé',
            });
        }

        res.json({
            success: true,
            data: document,
            message: 'Statut du document mis à jour avec succès',
        });
    } catch (error) {
        console.error('Erreur mise à jour statut document:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message],
        });
    }
});

// GET /api/documents/:id/download - Télécharger un document
router.get('/:id/download', async (req, res) => {
    try {
        const {id} = req.params;
        console.log('Téléchargement document ID:', id);

        const document = await Document.findById(id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document non trouvé',
            });
        }

        const filePath = path.join(__dirname, '..', 'uploads', 'documents', document.nom_fichier);
        const fs = require('fs');

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Fichier non trouvé sur le serveur',
            });
        }

        const ext = path.extname(document.nom_fichier).toLowerCase();
        let contentType = 'application/octet-stream';
        switch (ext) {
            case '.pdf':
                contentType = 'application/pdf';
                break;
            case '.jpg':
            case '.jpeg':
                contentType = 'image/jpeg';
                break;
            case '.png':
                contentType = 'image/png';
                break;
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${document.nomdoc}"`);

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Erreur téléchargement document:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors du téléchargement',
        });
    }
});

// PUT /api/documents/:id/replace - Remplacer un document
router.put('/:id/replace', upload.single('document'), async (req, res) => {
    const connection = getConnection();

    try {
        const { id } = req.params;
        console.log('Remplacement document ID:', id);

        // Vérification du fichier
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Aucun fichier uploadé',
            });
        }

        // 🔁 Remplacer le document via le modèle
        const updatedDocument = await Document.replace(id, req.file.filename);

        // 🔗 Mettre à jour le dossier associé (si existant)
        await connection.execute(
            `UPDATE dossiers 
       SET docdsr = ?, updated_at = NOW()
       WHERE document_id = ?`,
            [req.file.filename, id]
        );

        // 📧 Envoi de mail au candidat
        try {
            const [rows] = await connection.execute(
                `SELECT c.* FROM candidats c
         JOIN dossiers d ON c.id = d.candidat_id
         WHERE d.document_id = ? LIMIT 1`,
                [id]
            );

            const candidat = rows[0];
            if (candidat && candidat.maican) {
                const emailService = require('../services/emailService');
                await emailService.sendDocumentValidation(
                    candidat,
                    updatedDocument,
                    'en_attente',
                    'Document remplacé - en attente de validation'
                );
            }
        } catch (emailError) {
            console.error('Erreur envoi email:', emailError.message);
        }

        res.status(200).json({
            success: true,
            message: 'Document remplacé avec succès',
            data: updatedDocument,
        });
    } catch (error) {
        console.error('Erreur remplacement document:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message],
        });
    } finally {
        connection.end();
    }
});
// DELETE /api/documents/:id - Supprimer un document
router.delete('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        
        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document non trouvé'
            });
        }
        
        // Vérifier que le document n'est pas validé
        if (document.statut === 'valide') {
            return res.status(400).json({
                success: false,
                message: 'Impossible de supprimer un document validé'
            });
        }
        
        const deleted = await Document.deleteById(id);
        
        if (!deleted) {
            return res.status(400).json({
                success: false,
                message: 'Impossible de supprimer ce document'
            });
        }
        
        res.json({
            success: true,
            message: 'Document supprimé avec succès'
        });
    } catch (error) {
        console.error('Erreur suppression document:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/documents - Récupérer tous les documents
router.get('/', async (req, res) => {
    try {
        const documents = await Document.findAll();
        res.json({
            success: true,
            data: documents || [],
            message: 'Documents récupérés avec succès',
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des documents:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message],
        });
    }
});

module.exports = router;