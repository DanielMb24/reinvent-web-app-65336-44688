const {getConnection} = require('../config/database');

class Paiement {
    static async create(paiementData) {
        const connection = getConnection();

        console.log('Paiement.create - Données reçues:', paiementData);

        try {
            // Adapter aux champs existants dans la base de données selon le schéma
            const sanitizedData = {
                // 💡 Les IDs devraient maintenant venir du front-end
                candidat_id: paiementData.candidat_id || null,
                concours_id: paiementData.concours_id || null,

                nupcan: paiementData.nupcan || paiementData.nipcan || null,
                montant: parseFloat(paiementData.montant) || 0,
                methode: paiementData.methode || 'airtel_money',
                statut: paiementData.statut || 'valide',
                reference_paiement: paiementData.reference_paiement || paiementData.reference || null,
                numero_telephone: paiementData.numero_telephone || paiementData.telephone || null
            };

            console.log('Paiement.create - Données nettoyées:', sanitizedData);

            // Vérifier que les données obligatoires sont présentes
            if (!sanitizedData.nupcan) {
                throw new Error('NUPCAN est requis pour créer un paiement');
            }

            // 💡 MODIFICATION : Assouplir la validation pour la méthode 'gorri'
            if (sanitizedData.montant < 0) {
                throw new Error('Le montant ne peut pas être négatif');
            }
            if (sanitizedData.montant === 0 && sanitizedData.methode !== 'gorri') {
                throw new Error('Montant invalide pour le paiement (doit être > 0 si non-Gorri)');
            }


            const [result] = await connection.execute(
                `INSERT INTO paiements (candidat_id, concours_id, nupcan, montant, methode, statut, reference_paiement, numero_telephone, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                    sanitizedData.candidat_id,
                    sanitizedData.concours_id,
                    sanitizedData.nupcan,
                    sanitizedData.montant,
                    sanitizedData.methode,
                    sanitizedData.statut,
                    sanitizedData.reference_paiement,
                    sanitizedData.numero_telephone
                ]
            );

            console.log('Paiement.create - Paiement créé avec ID:', result.insertId);

            return {
                id: result.insertId,
                ...sanitizedData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
        } catch (error) {
            console.error('Erreur lors de la création du paiement:', error);
            throw error;
        }
    }


    static async findById(id) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM paiements WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }

    static async findByNupcan(nupcan) {
        const connection = getConnection();
        console.log('Paiement.findByNupcan - NUPCAN:', nupcan);

        try {
            const [rows] = await connection.execute(
                `SELECT * FROM paiements WHERE nupcan = ? ORDER BY created_at DESC LIMIT 1`,
                [nupcan]
            );

            console.log('Paiement trouvé:', rows.length > 0 ? 'Oui' : 'Non');
            return rows[0] || null;
        } catch (error) {
            console.error('Erreur lors de la récupération du paiement:', error);
            return null;
        }
    }

    // ... (méthodes updateByReference, update, validate, findAll, findByStatus inchangées)
}

module.exports = Paiement;