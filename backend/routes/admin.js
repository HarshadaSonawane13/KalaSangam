const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const jwt = require('jsonwebtoken');

// ✅ Middleware: Verify Admin Access
function verifyAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    if (user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    req.user = user;
    next();
  });
}

// 🧾 GET all workshop registrations (admin view)
router.get('/registrations', verifyAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.id, u.name AS user_name, u.email AS user_email, e.title AS event_title,
             r.preferred_date, r.status, r.created_at
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      JOIN events e ON r.event_id = e.id
      ORDER BY r.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ❌ DELETE a registration
router.delete('/registrations/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM registrations WHERE id = ?', [id]);
    res.json({ message: 'Registration deleted successfully' });
  } catch (error) {
    console.error('Error deleting registration:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📬 GET all contact messages
router.get('/contact', verifyAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM contacts ORDER BY submitted_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ❌ DELETE a contact message
router.delete('/contact/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM contacts WHERE id = ?', [id]);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
