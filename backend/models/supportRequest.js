const {getConnection} = require('../config/database');

class SupportRequest {
    static async findAll() {
        const connection = getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM support_requests ORDER BY createdAt DESC'
        );
        return rows;
    }

    static async findById(id) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM support_requests WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }

    static async create(supportData) {
        const connection = getConnection();
        const [result] = await connection.execute(
            'INSERT INTO support_requests (name, email, message, createdAt) VALUES (?, ?, ?, ?)',
            [supportData.name, supportData.email, supportData.message, new Date()]
        );

        return {id: result.insertId, ...supportData, createdAt: new Date()};
    }
}

module.exports = SupportRequest;