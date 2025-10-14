const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { getConnection } = require('../config/database');

// 📂 Dossier de stockage des fichiers
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ⚙️ Configuration de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// 🧩 Fonction de scan (extraction du texte d’un PDF)
async function scanDocument(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        const text = pdfData.text.toLowerCase();

        // Exemple d’analyse simple :
        if (text.includes('relevé') || text.includes('diplôme')) {
            return { statut: 'valide', message: 'Document reconnu' };
        } else {
            return { statut: 'non_valide', message: 'Document non reconnu' };
        }
    } catch (err) {
        console.error('Erreur scan :', err);
        return { statut: 'erreur', message: 'Impossible de scanner le document' };
    }
}

// 🔹 1. Récupérer tous les documents
router.get('/', async (req, res) => {
    try {
        const conn = await getConnection();
        const [rows] = await conn.query('SELECT * FROM documents');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

// 🔹 2. Récupérer un document par ID
router.get('/:id', async (req, res) => {
    try {
        const conn = await getConnection();
        const [rows] = await conn.query('SELECT * FROM documents WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Document introuvable' });
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

// 🔹 3. Ajouter un document (avec scan automatique)
router.post('/', upload.single('file'), async (req, res) => {
    const { nomdoc, type, candidat_id } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ success: false, message: 'Aucun fichier fourni' });

    try {
        const scanResult = await scanDocument(file.path);
        const conn = await getConnection();

        const [result] = await conn.query(
            'INSERT INTO documents (nomdoc, type, fichier, statut, candidat_id) VALUES (?, ?, ?, ?, ?)',
            [nomdoc, type, file.filename, scanResult.statut, candidat_id]
        );

        res.json({
            success: true,
            message: 'Document ajouté et scanné avec succès',
            data: { id: result.insertId, statut: scanResult.statut, analyse: scanResult.message }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur lors de l’ajout du document' });
    }
});

// 🔹 4. Modifier un document (remplacement + nouveau scan)
router.put('/:id/replace', upload.single('file'), async (req, res) => {
    const { id } = req.params;
    const file = req.file;

    if (!file) return res.status(400).json({ success: false, message: 'Aucun fichier fourni' });

    try {
        const conn = await getConnection();
        const [rows] = await conn.query('SELECT fichier FROM documents WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Document introuvable' });

        // Supprimer l’ancien fichier
        const oldPath = path.join(uploadDir, rows[0].fichier);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

        // Scanner le nouveau fichier
        const scanResult = await scanDocument(file.path);

        // Mettre à jour la base
        await conn.query('UPDATE documents SET fichier = ?, statut = ? WHERE id = ?', [
            file.filename,
            scanResult.statut,
            id
        ]);

        res.json({
            success: true,
            message: 'Document remplacé et scanné avec succès',
            data: { id, statut: scanResult.statut, analyse: scanResult.message }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur lors du remplacement du document' });
    }
});

// 🔹 5. Supprimer un document
router.delete('/:id', async (req, res) => {
    try {
        const conn = await getConnection();
        const [rows] = await conn.query('SELECT fichier FROM documents WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Document introuvable' });

        const filePath = path.join(uploadDir, rows[0].fichier);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        await conn.query('DELETE FROM documents WHERE id = ?', [req.params.id]);

        res.json({ success: true, message: 'Document supprimé avec succès' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur lors de la suppression du document' });
    }
});

module.exports = router;
