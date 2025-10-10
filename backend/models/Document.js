const {getConnection} = require('../config/database');

class Document {
    static async create(documentData) {
        const connection = getConnection();

        // Adapter aux champs de la table documents selon le schéma réel
        const sanitizedData = {
            nomdoc: documentData.nomdoc || documentData.nom_fichier || 'Document',
            type: documentData.type || 'document',
            nom_fichier: documentData.nom_fichier || documentData.chemin_fichier || documentData.docdsr || '',
            statut: documentData.statut || 'en_attente'
        };

        const [result] = await connection.execute(
            `INSERT INTO documents (nomdoc, type, nom_fichier, statut, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
            [
                sanitizedData.nomdoc,
                sanitizedData.type,
                sanitizedData.nom_fichier,
                sanitizedData.statut
            ]
        );

        return {
            id: result.insertId,
            ...sanitizedData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    }

    static async findById(id) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM documents WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }

    static async findByNupcan(nupcan) {
        const connection = getConnection();
        console.log('Document.findByNupcan - NUPCAN:', nupcan);

        try {
            // Utiliser la table dossiers pour la liaison avec nipcan
            const [rows] = await connection.execute(
                `SELECT d.*, dos.nipcan, dos.docdsr, dos.candidat_id, dos.concours_id
         FROM documents d 
         JOIN dossiers dos ON d.id = dos.document_id 
         WHERE dos.nipcan = ? 
         ORDER BY d.created_at DESC`,
                [nupcan]
            );

            console.log('Documents trouvés:', rows.length);
            return rows;
        } catch (error) {
            console.log('Erreur lors de la récupération des documents:', error.message);
            return [];
        }
    }

    static async updateStatus(id, statut, commentaire = null) {
        const connection = getConnection();

        // Mise à jour avec commentaire optionnel
        if (commentaire) {
            await connection.execute(
                'UPDATE documents SET statut = ?, commentaire_validation = ?, updated_at = NOW() WHERE id = ?',
                [statut, commentaire, id]
            );
        } else {
            await connection.execute(
                'UPDATE documents SET statut = ?, updated_at = NOW() WHERE id = ?',
                [statut, id]
            );
        }

        return this.findById(id);
    }

    static async findAll() {
        const connection = getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM documents ORDER BY created_at DESC'
        );
        return rows;
    }

    static async findAllWithCandidatInfo() {
        const connection = getConnection();
        const [rows] = await connection.execute(`
      SELECT 
        d.*,
        dos.nipcan as nupcan,
        dos.candidat_id,
        dos.concours_id,
        c.nomcan,
        c.prncan,
        c.maican,
        con.libcnc
      FROM documents d
      LEFT JOIN dossiers dos ON d.id = dos.document_id
      LEFT JOIN candidats c ON dos.candidat_id = c.id
      LEFT JOIN concours con ON dos.concours_id = con.id
      ORDER BY d.created_at DESC
    `);
        return rows;
    }

    static async deleteById(id) {
        const connection = getConnection();
        const [result] = await connection.execute(
            'DELETE FROM documents WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    static async getStatsByStatus() {
        const connection = getConnection();
        const [rows] = await connection.execute(`
      SELECT 
        statut,
        COUNT(*) as count
      FROM documents 
      GROUP BY statut
    `);
        return rows;
    }
}

module.exports = Document;
