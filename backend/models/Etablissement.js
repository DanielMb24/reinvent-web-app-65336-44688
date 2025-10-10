const {getConnection} = require('../config/database');

class Etablissement {
    static async findAll() {
        const connection = getConnection();
        const [rows] = await connection.execute(
            `SELECT e.*, p.nompro as province_nom
       FROM etablissements e
       LEFT JOIN provinces p ON e.province_id = p.id
       ORDER BY e.nomets ASC`
        );
        return rows;
    }

    static async findById(id) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            `SELECT e.*, p.nompro as province_nom
       FROM etablissements e
       LEFT JOIN provinces p ON e.province_id = p.id
       WHERE e.id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    static async create(etablissementData) {
        const connection = getConnection();
        const [result] = await connection.execute(
            `INSERT INTO etablissements (nomets, adretes, telefs, maiets, photo, province_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [
                etablissementData.nomets,
                etablissementData.adretes || '',
                etablissementData.telefs || '',
                etablissementData.maiets || '',
                etablissementData.photo || '',
                etablissementData.province_id
            ]
        );

        return this.findById(result.insertId);
    }

    static async update(id, etablissementData) {
        const connection = getConnection();
        const fields = Object.keys(etablissementData).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(etablissementData), id];

        await connection.execute(
            `UPDATE etablissements SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            values
        );

        return this.findById(id);
    }

    static async delete(id) {
        const connection = getConnection();
        const [result] = await connection.execute(
            'DELETE FROM etablissements WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Etablissement;
