const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root', // Remplace par ton utilisateur MySQL
    password: '', // Remplace par ton mot de passe MySQL si nécessaire
    database: 'gabconcoursv5',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

router.get('/candidat/:candidatId', async (req, res) => {
    try {
        const {candidatId} = req.params;
        console.log('Tentative de récupération des notifications pour candidat_nupcan:', candidatId);

        const connection = await pool.getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM notifications WHERE candidat_nupcan = ? ORDER BY created_at DESC',
            [candidatId]
        );
        connection.release();

        console.log('Résultat de la requête SQL:', rows);

        const formattedNotifications = Array.isArray(rows)
            ? rows.map((notif) => ({
                id: notif.id,
                titre: notif.titre,
                message: notif.message,
                type: notif.type,
                statut: notif.statut,
                created_at: notif.created_at,
            }))
            : [];

        res.json({
            success: true,
            data: formattedNotifications,
            message: 'Notifications récupérées avec succès',
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message || 'Erreur inconnue'],
        });
    }
});

router.put('/:notificationId/read', async (req, res) => {
    try {
        const {notificationId} = req.params;
        console.log('Tentative de marquage comme lu pour notificationId:', notificationId);

        const connection = await pool.getConnection();
        const [result] = await connection.execute(
            'UPDATE notifications SET statut = ?, updated_at = NOW() WHERE id = ?',
            ['lu', notificationId]
        );
        connection.release();

        if ((result.affectedRows || 0) === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification non trouvée',
            });
        }

        res.json({
            success: true,
            message: 'Notification marquée comme lue',
        });
    } catch (error) {
        console.error('Erreur lors du marquage de la notification:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message || 'Erreur inconnue'],
        });
    }
});

router.post('/send', async (req, res) => {
    try {
        const {maican, subject, message, candidat, type, data} = req.body;

        if (!maican || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Email, sujet et message sont requis',
            });
        }

        console.log('Tentative d\'envoi de notification:', {maican, subject, candidat, type});

        const connection = await pool.getConnection();
        await connection.execute(
            'INSERT INTO notifications (candidat_nupcan, type, titre, message, statut, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [candidat.nupcan, type, subject, message, 'non_lu']
        );
        connection.release();

        res.json({
            success: true,
            message: 'Notification envoyée avec succès',
        });
    } catch (error) {
        console.error('Erreur envoi notification:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message || 'Erreur inconnue'],
        });
    }
});

router.delete('/:notificationId', async (req, res) => {
    try {
        const {notificationId} = req.params;
        console.log('Tentative de suppression de la notification:', notificationId);

        const connection = await pool.getConnection();
        const [result] = await connection.execute(
            'DELETE FROM notifications WHERE id = ?',
            [notificationId]
        );
        connection.release();

        if ((result.affectedRows || 0) === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification non trouvée',
            });
        }

        res.json({
            success: true,
            message: 'Notification supprimée',
        });
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message || 'Erreur inconnue'],
        });
    }
});

router.delete('/candidat/:candidatId', async (req, res) => {
    try {
        const {candidatId} = req.params;
        console.log('Tentative de suppression de toutes les notifications pour candidat_nupcan:', candidatId);

        const connection = await pool.getConnection();
        const [result] = await connection.execute(
            'DELETE FROM notifications WHERE candidat_nupcan = ?',
            [candidatId]
        );
        connection.release();

        if ((result.affectedRows || 0) === 0) {
            return res.status(404).json({
                success: false,
                message: 'Aucune notification trouvée pour ce candidat',
            });
        }

        res.json({
            success: true,
            message: 'Toutes les notifications supprimées',
        });
    } catch (error) {
        console.error('Erreur lors de la suppression de toutes les notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message || 'Erreur inconnue'],
        });
    }
});

module.exports = router;