const { getConnection } = require('../config/database');

class Document {
    static async create(data) {
        const connection = getConnection();
        const sanitized = {
            nomdoc: data.nomdoc || data.nom_fichier || 'Document',
            type: data.type || 'document',
            nom_fichier: data.nom_fichier || '',
            statut: data.statut || 'en_attente'
        };

        const [result] = await connection.execute(
            `INSERT INTO documents (nomdoc, type, nom_fichier, statut, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
            [sanitized.nomdoc, sanitized.type, sanitized.nom_fichier, sanitized.statut]
        );

        return { id: result.insertId, ...sanitized };
    }

    static async findById(id) {
        const connection = getConnection();
        const [rows] = await connection.execute('SELECT * FROM documents WHERE id = ?', [id]);
        return rows[0] || null;
    }

    static async findByNupcan(nupcan) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            `SELECT d.*, dos.nupcan, dos.candidat_id, dos.concours_id
       FROM documents d
       JOIN dossiers dos ON d.id = dos.document_id
       WHERE dos.nupcan = ?
       ORDER BY d.created_at DESC`,
            [nupcan]
        );
        return rows;
    }

    static async updateStatus(id, statut, commentaire = null) {
        const connection = getConnection();
        if (commentaire) {
            await connection.execute(
                'UPDATE documents SET statut = ?, commentaire = ?, updated_at = NOW() WHERE id = ?',
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

    static async replace(id, newFileName) {
        const connection = getConnection();
        const doc = await this.findById(id);
        if (!doc) throw new Error('Document non trouvé');
        if (doc.statut !== 'rejete') throw new Error('Seuls les documents rejetés peuvent être remplacés');

        await connection.execute(
            `UPDATE documents
       SET nom_fichier = ?, statut = ?, commentaire = ?, updated_at = NOW()
       WHERE id = ?`,
            [newFileName, 'en_attente', 'Document remplacé - en attente de validation', id]
        );

        return this.findById(id);
    }

    static async findAll() {
        const connection = getConnection();
        const [rows] = await connection.execute('SELECT * FROM documents ORDER BY created_at DESC');
        return rows;
    }

    static async findAllWithCandidatInfo() {
        const connection = getConnection();
        const [rows] = await connection.execute(`
      SELECT d.*, dos.nupcan, c.nomcan, c.prncan, c.maican, con.libcnc
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
        const [result] = await connection.execute('DELETE FROM documents WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async getStatsByStatus() {
        const connection = getConnection();
        const [rows] = await connection.execute(`
      SELECT statut, COUNT(*) as count FROM documents GROUP BY statut
    `);
        return rows;
    }
}

module.exports = Document;
