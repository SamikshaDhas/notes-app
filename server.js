// // Import required packages
// const express = require('express');
// const mysql = require('mysql2/promise');
// const path = require('path');

// // Create Express app
// const app = express();

// // Middleware
// app.use(express.json());
// app.use(express.static(path.join(__dirname, 'public')));

// // ✅ DATABASE CONFIG (EDIT PASSWORD ONLY)
// const dbConfig = {
//     host: 'localhost',
//     user: 'root',
//     password: 'password', // 👉 PUT YOUR MYSQL PASSWORD HERE (or keep '' if no password)
//     database: 'notes_app'
// };

// // Global connection pool
// let pool;

// // ✅ Initialize database (SIMPLE VERSION)
// async function initializeDatabase() {
//     try {
//         // Create connection pool
//         pool = await mysql.createPool(dbConfig);

//         // Create table if not exists
//         await pool.execute(`
//             CREATE TABLE IF NOT EXISTS notes (
//                 id INT AUTO_INCREMENT PRIMARY KEY,
//                 text VARCHAR(500) NOT NULL,
//                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//             )
//         `);

//         console.log('✅ Database connected');
//     } catch (error) {
//         console.error('❌ Database connection error:', error);
//         process.exit(1);
//     }
// }

// // ✅ GET notes
// app.get('/notes', async (req, res) => {
//     try {
//         const [rows] = await pool.execute(
//             'SELECT * FROM notes ORDER BY created_at DESC'
//         );
//         res.json(rows);
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to fetch notes' });
//     }
// });

// // ✅ ADD note
// app.post('/notes', async (req, res) => {
//     try {
//         const { text } = req.body;

//         if (!text || text.trim() === '') {
//             return res.status(400).json({ error: 'Note text required' });
//         }

//         await pool.execute(
//             'INSERT INTO notes (text) VALUES (?)',
//             [text.trim()]
//         );

//         res.json({ message: 'Note added' });
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to add note' });
//     }
// });

// // ✅ DELETE note
// app.delete('/notes/:id', async (req, res) => {
//     try {
//         await pool.execute(
//             'DELETE FROM notes WHERE id = ?',
//             [req.params.id]
//         );

//         res.json({ message: 'Note deleted' });
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to delete note' });
//     }
// });

// // Serve frontend
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// // Start server
// const PORT = 5000;

// initializeDatabase().then(() => {
//     app.listen(PORT, () => {
//         console.log(`🚀 Server running on http://localhost:${PORT}`);
//     });
// });
// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const NOTES_FILE = path.join(__dirname, 'notes.json');

// Helper function to read notes
function readNotes() {
  if (!fs.existsSync(NOTES_FILE)) return [];
  const data = fs.readFileSync(NOTES_FILE, 'utf8');
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Helper function to write notes
function writeNotes(notes) {
  fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
}

// GET all notes
app.get('/notes', (req, res) => {
  const notes = readNotes();
  res.json(notes.sort((a, b) => b.id - a.id)); // newest first
});

// ADD a note
app.post('/notes', (req, res) => {
  const { text } = req.body;
  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Note text required' });
  }

  const notes = readNotes();
  const newNote = { id: Date.now(), text: text.trim() };
  notes.push(newNote);
  writeNotes(notes);

  res.json({ message: 'Note added', note: newNote });
});

// DELETE a note
app.delete('/notes/:id', (req, res) => {
  const notes = readNotes();
  const filtered = notes.filter(note => note.id != req.params.id);
  writeNotes(filtered);
  res.json({ message: 'Note deleted' });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server (listen on all network interfaces for Docker / Hugging Face)
const PORT = process.env.PORT || 7860;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});