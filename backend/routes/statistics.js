const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');

// GET /api/statistics - Statistiques globales
router.get('/', async (req, res) => {
    try {
        const connection = getConnection();
        
        // Nombre total de candidats
        const [candidatsCount] = await connection.execute(
            'SELECT COUNT(*) as total FROM candidats'
        );
        
        // Nombre total de paiements validés
        const [paiementsCount] = await connection.execute(
            'SELECT COUNT(*) as total, SUM(montant) as montant_total FROM paiements WHERE statut = "valide"'
        );
        
        // Nombre total de documents
        const [documentsCount] = await connection.execute(
            'SELECT COUNT(*) as total FROM documents'
        );
        
        // Documents par statut
        const [documentsByStatus] = await connection.execute(`
            SELECT statut, COUNT(*) as count 
            FROM documents 
            GROUP BY statut
        `);
        
        // Candidats par concours
        const [candidatsByConcours] = await connection.execute(`
            SELECT c.libcnc, COUNT(ca.id) as count
            FROM concours c
            LEFT JOIN candidats ca ON c.id = ca.concours_id
            GROUP BY c.id, c.libcnc
            ORDER BY count DESC
        `);
        
        // Candidats par établissement
        const [candidatsByEtablissement] = await connection.execute(`
            SELECT e.nomets, COUNT(ca.id) as count
            FROM etablissements e
            LEFT JOIN concours c ON e.id = c.etablissement_id
            LEFT JOIN candidats ca ON c.id = ca.concours_id
            GROUP BY e.id, e.nomets
            ORDER BY count DESC
        `);
        
        res.json({
            success: true,
            data: {
                totalCandidats: candidatsCount[0].total,
                totalPaiements: paiementsCount[0].total,
                montantTotal: paiementsCount[0].montant_total || 0,
                totalDocuments: documentsCount[0].total,
                documentsByStatus: documentsByStatus,
                candidatsByConcours: candidatsByConcours,
                candidatsByEtablissement: candidatsByEtablissement
            }
        });
    } catch (error) {
        console.error('Erreur récupération statistiques:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur',
            errors: [error.message] 
        });
    }
});

module.exports = router;
