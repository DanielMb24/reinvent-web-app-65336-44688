const {getConnection} = require('../config/database');

class Dossier {
    static async create(dossierData) {
        const connection = getConnection();

        try {
            const sanitizedData = {
                candidat_id: dossierData.candidat_id || null,
                concours_id: dossierData.concours_id || null,
                document_id: dossierData.document_id || null,
                nipcan: dossierData.nipcan || dossierData.nupcan || null,
                docdsr: dossierData.docdsr || dossierData.chemin_fichier || null
            };

            console.log('Dossier.create - Données à insérer:', sanitizedData);

            const [result] = await connection.execute(
                `INSERT INTO dossiers (candidat_id, concours_id, document_id, nipcan, docdsr, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                    sanitizedData.candidat_id,
                    sanitizedData.concours_id,
                    sanitizedData.document_id,
                    sanitizedData.nipcan,
                    sanitizedData.docdsr
                ]
            );

            console.log('Dossier.create - Résultat insertion:', result);

            return {
                id: result.insertId,
                ...sanitizedData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
        } catch (error) {
            console.error('Dossier.create - Erreur:', error);
            throw error;
        }
    }

    static async findById(id) {
        const connection = getConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM dossiers WHERE id = ?',
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Dossier.findById - Erreur:', error);
            return null;
        }
    }

    static async findByNupcan(nupcan) {
        const connection = getConnection();
        console.log('Dossier.findByNupcan - NUPCAN:', nupcan);

        try {
            const [rows] = await connection.execute(
                `SELECT dos.*, d.nomdoc, d.type, d.nom_fichier, d.statut as document_statut
         FROM dossiers dos 
         LEFT JOIN documents d ON dos.document_id = d.id 
         WHERE dos.nipcan = ? 
         ORDER BY dos.created_at DESC`,
                [nupcan]
            );

            console.log('Dossiers trouvés:', rows.length);
            return rows;
        } catch (error) {
            console.error('Dossier.findByNupcan - Erreur:', error);
            return [];
        }
    }

    static async findAll() {
        const connection = getConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT dos.*, d.nomdoc, d.type, d.nom_fichier, d.statut as document_statut
         FROM dossiers dos 
         LEFT JOIN documents d ON dos.document_id = d.id 
         ORDER BY dos.created_at DESC`
            );
            return rows;
        } catch (error) {
            console.error('Dossier.findAll - Erreur:', error);
            return [];
        }
    }

    static async deleteById(id) {
        const connection = getConnection();
        try {
            const [result] = await connection.execute(
                'DELETE FROM dossiers WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Dossier.deleteById - Erreur:', error);
            return false;
        }
    }
}

module.exports = Dossier;
