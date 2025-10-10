const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const Candidat = require('../models/Candidat');
const { authenticateAdmin } = require('../middleware/auth');
const { getConnection } = require('../config/database');

// Créer ou mettre à jour une note
router.post('/', authenticateAdmin, async (req, res) => {
    try {
        const { candidat_id, concours_id, matiere_id, note, coefficient } = req.body;
        
        if (!candidat_id || !concours_id || !matiere_id || note === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Données manquantes'
            });
        }
        
        // Vérifier si une note existe déjà
        const connection = getConnection();
        const [existing] = await connection.execute(
            'SELECT id FROM notes WHERE candidat_id = ? AND concours_id = ? AND matiere_id = ?',
            [candidat_id, concours_id, matiere_id]
        );
        
        let result;
        if (existing.length > 0) {
            // Mettre à jour la note existante
            result = await Note.update(existing[0].id, { note, coefficient });
        } else {
            // Créer une nouvelle note
            result = await Note.create({
                candidat_id,
                concours_id,
                matiere_id,
                note,
                coefficient: coefficient || 1
            });
        }
        
        res.json({
            success: true,
            message: 'Note enregistrée avec succès',
            data: result
        });
    } catch (error) {
        console.error('Erreur enregistrement note:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Récupérer les notes d'un candidat pour un concours
router.get('/candidat/:candidat_id/concours/:concours_id', authenticateAdmin, async (req, res) => {
    try {
        const { candidat_id, concours_id } = req.params;
        
        const notes = await Note.findByCandidatAndConcours(candidat_id, concours_id);
        const moyenne = await Note.calculateMoyenne(candidat_id, concours_id);
        
        res.json({
            success: true,
            data: {
                notes,
                moyenne: moyenne.moyenne ? parseFloat(moyenne.moyenne).toFixed(2) : null,
                nombre_notes: moyenne.nombre_notes,
                total_coefficients: moyenne.total_coefficients
            }
        });
    } catch (error) {
        console.error('Erreur récupération notes:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Récupérer les notes par NUPCAN
router.get('/nupcan/:nupcan', async (req, res) => {
    try {
        const { nupcan } = req.params;
        
        const notes = await Note.findByNupcan(nupcan);
        
        // Calculer la moyenne
        let moyenne = null;
        if (notes.length > 0) {
            const totalPoints = notes.reduce((sum, n) => sum + (n.note * n.coefficient), 0);
            const totalCoef = notes.reduce((sum, n) => sum + n.coefficient, 0);
            moyenne = totalCoef > 0 ? (totalPoints / totalCoef).toFixed(2) : null;
        }
        
        res.json({
            success: true,
            data: {
                notes,
                moyenne,
                nombre_notes: notes.length
            }
        });
    } catch (error) {
        console.error('Erreur récupération notes:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Route pour les notes par candidat (pour le Dashboard candidat avec /grades/candidat/:nupcan)
router.get('/candidat/:nupcan', async (req, res) => {
    try {
        const { nupcan } = req.params;
        console.log('Récupération notes pour NUPCAN:', nupcan);
        
        const connection = getConnection();
        
        // Récupérer le candidat
        const [candidats] = await connection.execute(
            'SELECT id, nomcan, prncan, nupcan FROM candidats WHERE nupcan = ?',
            [nupcan]
        );
        
        if (candidats.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Candidat non trouvé'
            });
        }
        
        const candidat = candidats[0];
        
        // Récupérer les notes
        const [notes] = await connection.execute(`
            SELECT 
                n.id,
                n.note,
                n.coefficient,
                m.nom_matiere as nommat,
                m.coefficient as coefmat,
                m.duree
            FROM notes n
            LEFT JOIN matieres m ON n.matiere_id = m.id
            WHERE n.candidat_id = ?
            ORDER BY m.nom_matiere ASC
        `, [candidat.id]);
        
        // Calculer la moyenne générale
        let moyenneGenerale = null;
        if (notes.length > 0) {
            const totalPoints = notes.reduce((sum, n) => sum + (parseFloat(n.note) * parseFloat(n.coefmat || n.coefficient)), 0);
            const totalCoef = notes.reduce((sum, n) => sum + parseFloat(n.coefmat || n.coefficient), 0);
            moyenneGenerale = totalCoef > 0 ? (totalPoints / totalCoef).toFixed(2) : null;
        }
        
        res.json({
            success: true,
            data: {
                candidat: {
                    id: candidat.id,
                    nomcan: candidat.nomcan,
                    prncan: candidat.prncan,
                    nupcan: candidat.nupcan
                },
                notes: notes,
                moyenneGenerale: moyenneGenerale
            }
        });
    } catch (error) {
        console.error('Erreur récupération notes candidat:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Récupérer toutes les moyennes d'un concours
router.get('/concours/:concours_id/moyennes', authenticateAdmin, async (req, res) => {
    try {
        const { concours_id } = req.params;
        
        const moyennes = await Note.calculateMoyennesByConcours(concours_id);
        
        res.json({
            success: true,
            data: moyennes
        });
    } catch (error) {
        console.error('Erreur calcul moyennes:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Envoyer les résultats par email à un candidat
router.post('/envoyer-resultats', authenticateAdmin, async (req, res) => {
    try {
        const { candidat_id, concours_id } = req.body;
        
        if (!candidat_id || !concours_id) {
            return res.status(400).json({
                success: false,
                message: 'Données manquantes'
            });
        }
        
        // Récupérer les informations du candidat
        const candidat = await Candidat.findById(candidat_id);
        if (!candidat) {
            return res.status(404).json({
                success: false,
                message: 'Candidat non trouvé'
            });
        }
        
        // Récupérer les notes et la moyenne
        const notes = await Note.findByCandidatAndConcours(candidat_id, concours_id);
        const moyenne = await Note.calculateMoyenne(candidat_id, concours_id);
        
        // Envoyer email
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        
        let notesHtml = '<table border="1" style="border-collapse: collapse; width: 100%;">';
        notesHtml += '<tr><th>Matière</th><th>Note</th><th>Coefficient</th></tr>';
        notes.forEach(note => {
            notesHtml += `<tr><td>${note.nom_matiere}</td><td>${note.note}/20</td><td>${note.coefficient}</td></tr>`;
        });
        notesHtml += '</table>';
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: candidat.maican,
            subject: 'Résultats de votre concours - GabConcours',
            html: `
                <h2>Bonjour ${candidat.prncan} ${candidat.nomcan},</h2>
                <p>Vos résultats sont maintenant disponibles.</p>
                <h3>Vos notes :</h3>
                ${notesHtml}
                <h3>Moyenne générale : ${moyenne.moyenne ? parseFloat(moyenne.moyenne).toFixed(2) : 'N/A'}/20</h3>
                <p>Vous pouvez consulter vos résultats détaillés sur votre tableau de bord.</p>
                <p>Cordialement,<br>L'équipe GabConcours</p>
            `
        };
        
        await transporter.sendMail(mailOptions);
        
        // Créer une notification
        const connection = getConnection();
        await connection.execute(
            `INSERT INTO notifications (user_type, user_id, type, titre, message, created_at)
             VALUES ('candidat', ?, 'resultat', 'Résultats disponibles', 'Vos résultats sont maintenant disponibles', NOW())`,
            [candidat.nupcan]
        );
        
        res.json({
            success: true,
            message: 'Résultats envoyés par email avec succès'
        });
    } catch (error) {
        console.error('Erreur envoi résultats:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Supprimer une note
router.delete('/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        await Note.delete(id);
        
        res.json({
            success: true,
            message: 'Note supprimée avec succès'
        });
    } catch (error) {
        console.error('Erreur suppression note:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
