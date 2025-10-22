const {getConnection} = require('../config/database');

class Concours {
    static async findAll() {
        const connection = getConnection();
        const [rows] = await connection.execute(
            `SELECT c.*, 
              e.nomets as etablissement_nomets,
              e.photo as etablissement_photo,
              n.nomniv as niveau_nomniv,
              CASE 
                WHEN c.fracnc = 0 OR c.fracnc IS NULL THEN 1 
                ELSE 0 
              END as is_gorri
       FROM concours c
       LEFT JOIN etablissements e ON c.etablissement_id = e.id
       LEFT JOIN niveaux n ON c.niveau_id = n.id
       WHERE c.stacnc = '1'
       ORDER BY c.debcnc DESC`
        );
        return rows;
    }

    static async findById(id) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            `SELECT c.*, 
              e.nomets as etablissement_nomets,
              e.photo as etablissement_photo,
              n.nomniv as niveau_nomniv,
              CASE 
                WHEN c.fracnc = 0 OR c.fracnc IS NULL THEN 1 
                ELSE 0 
              END as is_gorri
       FROM concours c
       LEFT JOIN etablissements e ON c.etablissement_id = e.id
       LEFT JOIN niveaux n ON c.niveau_id = n.id
       WHERE c.id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    static async create(concoursData) {
        const connection = getConnection();
        const [result] = await connection.execute(
            `INSERT INTO concours (etablissement_id, niveau_id, libcnc, sescnc, debcnc, fincnc, stacnc, agecnc, fracnc, etddos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                concoursData.etablissement_id,
                concoursData.niveau_id || null,
                concoursData.libcnc,
                concoursData.sescnc,
                concoursData.debcnc || null,
                concoursData.fincnc || null,
                concoursData.stacnc || '1',
                concoursData.agecnc || null,
                concoursData.fracnc,
                concoursData.etddos || '0'
            ]
        );

        return this.findById(result.insertId);
    }

    static async update(id, concoursData) {
        const connection = getConnection();
        const fields = Object.keys(concoursData).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(concoursData), id];

        await connection.execute(
            `UPDATE concours SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            values
        );

        return this.findById(id);
    }

    static async delete(id) {
        const connection = getConnection();
        await connection.execute('DELETE FROM concours WHERE id = ?', [id]);
        return {success: true};
    }
}

module.exports = Concours;
