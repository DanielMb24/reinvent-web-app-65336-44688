const {getConnection} = require('../config/database');

class Paiement {
    static async create(paiementData) {
        const connection = getConnection();

        console.log('Paiement.create - Données reçues:', paiementData);

        try {
            // Adapter aux champs existants dans la base de données selon le schéma
            const sanitizedData = {
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

            if (!sanitizedData.montant || sanitizedData.montant <= 0) {
                throw new Error('Montant invalide pour le paiement');
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



    static async updateByReference(reference, data) {
        const connection = getConnection();
        const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(data), reference];
        await connection.execute(
            `UPDATE paiements SET ${fields}, updated_at = NOW() WHERE reference_paiement = ?`,
            values
        );
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

    static async update(id, paiementData) {
        const connection = getConnection();

        try {
            const fields = Object.keys(paiementData).map(key => `${key} = ?`).join(', ');
            const values = [...Object.values(paiementData), id];

            await connection.execute(
                `UPDATE paiements SET ${fields}, updated_at = NOW() WHERE id = ?`,
                values
            );
            
            // Envoyer notification après mise à jour
            const paiement = await this.findById(id);
            if (paiement && paiementData.statut === 'valide') {
                const Notification = require('./Notification');
                const Candidat = require('./Candidat');
                const candidat = await Candidat.findByNupcan(paiement.nupcan);
                
                if (candidat) {
                    await Notification.create({
                        candidat_id: candidat.id,
                        type: 'paiement',
                        titre: 'Paiement validé',
                        message: `Votre paiement de ${paiement.montant} FCFA a été validé.`,
                        lu: false
                    });
                }
            }

            return this.findById(id);
        } catch (error) {
            console.error('Erreur lors de la mise à jour du paiement:', error);
            throw error;
        }
    }

    static async validate(id) {
        const connection = getConnection();

        try {
            await connection.execute(
                'UPDATE paiements SET statut = ?, updated_at = NOW() WHERE id = ?',
                ['valide', id]
            );

            return this.findById(id);
        } catch (error) {
            console.error('Erreur lors de la validation du paiement:', error);
            throw error;
        }
    }

    static async findAll() {
        const connection = getConnection();

        try {
            const [rows] = await connection.execute(
                'SELECT * FROM paiements ORDER BY created_at DESC'
            );
            return rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des paiements:', error);
            return [];
        }
    }

    static async findByStatus(statut) {
        const connection = getConnection();

        try {
            const [rows] = await connection.execute(
                'SELECT * FROM paiements WHERE statut = ? ORDER BY created_at DESC',
                [statut]
            );
            return rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des paiements par statut:', error);
            return [];
        }
    }
}

module.exports = Paiement;
