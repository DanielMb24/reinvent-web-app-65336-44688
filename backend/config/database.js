const mysql = require('mysql2/promise');
const {createPool} = require("mysql2");
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gabconcoursv5',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4',
    timezone: '+00:00'
};

let pool;

const createConnection = async () => {
    try {
        pool = mysql.createPool({
            ...dbConfig,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        console.log(' Connexion à MySQL établie');
        return pool;
    } catch (error) {
        console.error(' Erreur de connexion à MySQL:', error);
        throw error;
    }
};

const getConnection = () => {
    if (!pool) {
        throw new Error('Base de données non initialisée');
    }
    return pool;
};

const testConnection = async () => {
    try {
        if (!pool) {
            await createConnection();
        }
        const connection = await pool.getConnection();
        await connection.execute('SELECT 1');
        connection.release();
        return {success: true, message: 'Connexion à la base de données réussie'};
    } catch (error) {
        console.error('Erreur de test de connexion:', error);
        throw error;
    }
};




// Gestion auto-reconnexion si pool fermé
process.on('uncaughtException', async (err) => {
    console.error('💥 Exception non gérée:', err);
    if (err.message.includes('Pool is closed')) {
        console.log('🔄 Tentative de recréation du pool...');
        await createConnection();
    }
});

process.on('unhandledRejection', async (err) => {
    console.error('💥 Rejection non gérée:', err);
    if (err.message.includes('Pool is closed')) {
        console.log('🔄 Tentative de recréation du pool...');
        await createConnection();
    }
});

module.exports = {
    createConnection,
    getConnection,
    testConnection,
    dbConfig
};
