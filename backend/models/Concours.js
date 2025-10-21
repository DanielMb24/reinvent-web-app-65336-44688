// =================================================================
// FICHIER : models/Concours.js (Modèle SQL)
// =================================================================
const {getConnection} = require('../config/database');

class Concours {
    static async findAll() {
        const connection = getConnection();
        // Modification: Sélection explicite de 'c.is_gorri' (nouvelle colonne)
        const [rows] = await connection.execute(
            `SELECT c.*, 
              e.nomets as etablissement_nomets,
              e.photo as etablissement_photo,
              n.nomniv as niveau_nomniv
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
        // Modification: Sélection explicite de 'c.is_gorri'
        const [rows] = await connection.execute(
            `SELECT c.*, 
              e.nomets as etablissement_nomets,
              e.photo as etablissement_photo,
              n.nomniv as niveau_nomniv
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

        // 💡 CORRECTION CRITIQUE POUR LES CONCOURS GRATUITS
        // Si fracnc n'est pas fourni (undefined) ou est null, on utilise 0.00
        const fracncValue = concoursData.fracnc !== undefined && concoursData.fracnc !== null
            ? concoursData.fracnc
            : 0;

        const [result] = await connection.execute(
            `INSERT INTO concours (etablissement_id, niveau_id, libcnc, sescnc, debcnc, fincnc, stacnc, agecnc, fracnc, etddos, is_gorri)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                concoursData.etablissement_id,
                concoursData.niveau_id || null,
                concoursData.libcnc,
                concoursData.sescnc,
                // Utilisation des noms de colonnes du modèle (debcnc, fincnc)
                concoursData.dficnc || null, // dficnc du front -> debcnc du back
                concoursData.dexpcn || null, // dexpcn du front -> fincnc du back
                concoursData.stacnc || '1',
                concoursData.agecnc || null,
                fracncValue, // Utilisation de la valeur corrigée
                concoursData.etddos || '0',
                concoursData.is_gorri || 0, // Ajout du champ is_gorri (0 ou 1)
            ]
        );

        return this.findById(result.insertId);
    }

    static async update(id, concoursData) {
        const connection = getConnection();

        // CORRECTION: Récupérer seulement les champs valides
        const fieldsToUpdate = {};
        for (const key in concoursData) {
            if (concoursData[key] !== undefined && key !== 'id') {
                fieldsToUpdate[key] = concoursData[key];
            }
        }

        if (Object.keys(fieldsToUpdate).length === 0) {
            return this.findById(id);
        }

        const fields = Object.keys(fieldsToUpdate).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(fieldsToUpdate), id];

        await connection.execute(
            `UPDATE concours SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            values
        );

        return this.findById(id);
    }

    static async delete(id) {
        const connection = getConnection();
        const [result] = await connection.execute('DELETE FROM concours WHERE id = ?', [id]);
        return {success: result.affectedRows > 0};
    }
}

module.exports = Concours;