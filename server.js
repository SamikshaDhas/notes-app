// Import required packages
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ✅ DATABASE CONFIG (EDIT PASSWORD ONLY)
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'password', // 👉 PUT YOUR MYSQL PASSWORD HERE (or keep '' if no password)
    database: 'notes_app'
};

// Global connection pool
let pool;

// ✅ Initialize database (SIMPLE VERSION)
async function initializeDatabase() {
    try {
        // Create connection pool
        pool = await mysql.createPool(dbConfig);

        // Create table if not exists
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS notes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                text VARCHAR(500) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ Database connected');
    } catch (error) {
        console.error('❌ Database connection error:', error);
        process.exit(1);
    }
}

// ✅ GET notes
app.get('/notes', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM notes ORDER BY created_at DESC'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
});

// ✅ ADD note
app.post('/notes', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || text.trim() === '') {
            return res.status(400).json({ error: 'Note text required' });
        }

        await pool.execute(
            'INSERT INTO notes (text) VALUES (?)',
            [text.trim()]
        );

        res.json({ message: 'Note added' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add note' });
    }
});

// ✅ DELETE note
app.delete('/notes/:id', async (req, res) => {
    try {
        await pool.execute(
            'DELETE FROM notes WHERE id = ?',
            [req.params.id]
        );

        res.json({ message: 'Note deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete note' });
    }
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = 5000;

initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
});