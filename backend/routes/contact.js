const express = require('express');
const pool = require('../db/connection');
const router = express.Router();

// ✉️ Save new contact message (from Contact page)
router.post('/', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message)
    return res.status(400).json({ message: 'All fields required.' });

  try {
    await pool.query('INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)', [
      name,
      email,
      message,
    ]);
    res.status(201).json({ message: 'Message sent successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Error saving message', error });
  }
});

// 📋 Fetch all contact messages (for Admin Dashboard)
router.get('/', async (req, res) => {
  try {
    const [messages] = await pool.query('SELECT * FROM contacts ORDER BY id DESC');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error });
  }
});

// ❌ Delete a specific contact message
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM contacts WHERE id = ?', [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Message not found' });
    res.json({ message: 'Message deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting message', error });
  }
});

module.exports = router;
