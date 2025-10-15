const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');
const bcrypt = require('bcrypt');

// Récupérer les sous-admins d'un établissement
router.get('/etablissement/:etablissement_id', async (req, res) => {
    try {
        const { etablissement_id } = req.params;
        const connection = getConnection();

        const [subAdmins] = await connection.execute(
            `SELECT 
                a.id,
                a.nom,
                a.prenom,
                a.email,
                a.role,
                a.created_at,
                ar.role_type as admin_role
            FROM administrateurs a
            LEFT JOIN admin_roles ar ON a.id = ar.admin_id
            WHERE a.etablissement_id = ? 
            AND a.role = 'sub_admin'
            ORDER BY a.created_at DESC`,
            [etablissement_id]
        );

        res.json({
            success: true,
            data: subAdmins
        });
    } catch (error) {
        console.error('Erreur récupération sous-admins:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Créer un sous-admin
router.post('/create', async (req, res) => {
    const connection = getConnection();
    
    try {
        const { 
            nom, 
            prenom, 
            email, 
            password, 
            etablissement_id, 
            role_type,
            created_by 
        } = req.body;

        // Validation
        if (!nom || !prenom || !email || !password || !etablissement_id || !role_type) {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs sont requis'
            });
        }

        // Vérifier le nombre de sous-admins existants
        const [countResult] = await connection.execute(
            `SELECT COUNT(*) as count 
            FROM administrateurs 
            WHERE etablissement_id = ? AND role = 'sub_admin'`,
            [etablissement_id]
        );

        if (countResult[0].count >= 3) {
            return res.status(400).json({
                success: false,
                message: 'Limite de 3 sous-admins atteinte pour cet établissement'
            });
        }

        // Vérifier si l'email existe déjà
        const [existing] = await connection.execute(
            'SELECT id FROM administrateurs WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cet email est déjà utilisé'
            });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer le sous-admin
        await connection.beginTransaction();

        const [adminResult] = await connection.execute(
            `INSERT INTO administrateurs 
            (nom, prenom, email, password, etablissement_id, role, created_at) 
            VALUES (?, ?, ?, ?, ?, 'sub_admin', NOW())`,
            [nom, prenom, email, hashedPassword, etablissement_id]
        );

        const adminId = adminResult.insertId;

        // Créer l'entrée de rôle dans admin_roles
        await connection.execute(
            `INSERT INTO admin_roles (admin_id, role_type, created_at) 
            VALUES (?, ?, NOW())`,
            [adminId, role_type]
        );

        // Logger l'action
        await connection.execute(
            `INSERT INTO admin_actions_log 
            (admin_id, action, details, created_at) 
            VALUES (?, 'CREATE_SUB_ADMIN', ?, NOW())`,
            [created_by, `Création sous-admin: ${email} - Rôle: ${role_type}`]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Sous-admin créé avec succès',
            data: { id: adminId }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Erreur création sous-admin:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Modifier le rôle d'un sous-admin
router.put('/:id/role', async (req, res) => {
    const connection = getConnection();
    
    try {
        const { id } = req.params;
        const { role_type, updated_by } = req.body;

        await connection.beginTransaction();

        // Mettre à jour le rôle
        await connection.execute(
            `UPDATE admin_roles 
            SET role_type = ?, updated_at = NOW() 
            WHERE admin_id = ?`,
            [role_type, id]
        );

        // Logger l'action
        await connection.execute(
            `INSERT INTO admin_actions_log 
            (admin_id, action, details, created_at) 
            VALUES (?, 'UPDATE_SUB_ADMIN_ROLE', ?, NOW())`,
            [updated_by, `Modification rôle sous-admin ID:${id} - Nouveau rôle: ${role_type}`]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Rôle modifié avec succès'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Erreur modification rôle:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Désactiver/supprimer un sous-admin
router.delete('/:id', async (req, res) => {
    const connection = getConnection();
    
    try {
        const { id } = req.params;
        const { deleted_by } = req.body;

        await connection.beginTransaction();

        // Supprimer le rôle
        await connection.execute(
            'DELETE FROM admin_roles WHERE admin_id = ?',
            [id]
        );

        // Supprimer l'admin
        await connection.execute(
            'DELETE FROM administrateurs WHERE id = ?',
            [id]
        );

        // Logger l'action
        await connection.execute(
            `INSERT INTO admin_actions_log 
            (admin_id, action, details, created_at) 
            VALUES (?, 'DELETE_SUB_ADMIN', ?, NOW())`,
            [deleted_by, `Suppression sous-admin ID:${id}`]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Sous-admin supprimé avec succès'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Erreur suppression sous-admin:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
