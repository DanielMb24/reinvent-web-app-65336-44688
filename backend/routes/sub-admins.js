const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');
const bcrypt = require('bcrypt');
const crypto = require("crypto");
const emailService = require("../services/emailService");
const Admin = require("../models/Admin");

// ✅ Liste des sous-admins d'un établissement
router.get('/etablissement/:etablissement_id', async (req, res) => {
    try {
        const { etablissement_id } = req.params;
        const connection = getConnection();

        const [subAdmins] = await connection.execute(
            `SELECT id, nom, prenom, email, role, admin_role, created_at 
             FROM administrateurs
             WHERE etablissement_id = ? 
             AND role = 'sub_admin'
             ORDER BY created_at DESC`,
            [etablissement_id]
        );

        res.json({ success: true, data: subAdmins });
    } catch (error) {
        console.error('Erreur récupération sous-admins:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ✅ Création d’un sous-admin
router.post('/create', async (req, res) => {
    const connection = getConnection();
    try {
        const { nom, prenom, email, etablissement_id, admin_role } = req.body;
        const created_by = req.admin.adminId;

        if (!nom || !prenom || !email || !etablissement_id || !admin_role) {
            return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
        }

        // Vérifier limite et doublons...
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        const [result] = await connection.execute(
            `INSERT INTO administrateurs 
       (nom, prenom, email, password, role, admin_role, etablissement_id, created_by, created_at)
       VALUES (?, ?, ?, ?, 'sub_admin', ?, ?, ?, NOW())`,
            [nom, prenom, email, hashedPassword, admin_role, etablissement_id, created_by]
        );

        // Envoi email
        await emailService.sendAdminCredentials({
            email,
            nom,
            prenom,
            temp_password: tempPassword
        });

        res.json({ success: true, message: 'Sous-admin créé avec succès et email envoyé' });

    } catch (error) {
        console.error('Erreur création sous-admin:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ✅ Suppression d’un sous-admin
router.delete('/:id', async (req, res) => {
    const connection = getConnection();

    try {
        const { id } = req.params;

        await connection.execute('DELETE FROM administrateurs WHERE id = ?', [id]);

        res.json({ success: true, message: 'Sous-admin supprimé avec succès' });
    } catch (error) {
        console.error('Erreur suppression sous-admin:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
