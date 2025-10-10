const express = require('express');
const router = express.Router();
const {getConnection} = require('../config/database');

router.get('/', async (req, res) => {
    try {
        const {page = 1, limit = 5, search = '', status = 'all'} = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM support_requests WHERE 1=1';
        const params = [];

        // Add search condition
        if (search) {
            query += ' AND (name LIKE ? OR email LIKE ? OR message LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        // Add status condition
        if (status !== 'all') {
            query += ' AND status = ?';
            params.push(status);
        }

        // Add pagination
        query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const connection = getConnection();
        const [rows] = await connection.execute(query, params);

        // Count total records for pagination
        let countQuery = 'SELECT COUNT(*) as count FROM support_requests WHERE 1=1';
        const countParams = [];

        if (search) {
            countQuery += ' AND (name LIKE ? OR email LIKE ? OR message LIKE ?)';
            countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (status !== 'all') {
            countQuery += ' AND status = ?';
            countParams.push(status);
        }

        const [total] = await connection.execute(countQuery, countParams);
        const totalPages = Math.ceil(total[0].count / limit);

        res.status(200).json({data: {requests: rows, totalPages}});
    } catch (error) {
        console.error('Error fetching support requests:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.post('/', async (req, res) => {
    try {
        const {name, email, message} = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({error: 'All fields are required'});
        }

        const connection = getConnection();
        const [result] = await connection.execute(
            'INSERT INTO support_requests (name, email, message, createdAt) VALUES (?, ?, ?, ?)',
            [name, email, message, new Date()]
        );

        const supportRequest = {id: result.insertId, name, email, message, createdAt: new Date()};
        res.status(201).json({message: 'Support request submitted successfully', data: supportRequest});
    } catch (error) {
        console.error('Error submitting support request:', error);
        res.status(500).json({error: 'Internal server error. Please try again later.'});
    }
});

module.exports = router;