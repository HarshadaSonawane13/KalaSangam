const express = require('express');
const pool = require('../db/connection');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

/* 📝 Register for an event (POST /api/registrations)
---------------------------------------------------- */
router.post('/', verifyToken, async (req, res) => {
  const { event_id, name, email, phone, preferred_date, notes } = req.body;
  const user_id = req.user.id;

  if (!event_id || !name || !email) {
    return res.status(400).json({ message: 'Required fields missing.' });
  }

  try {
    await pool.query(
      `INSERT INTO registrations 
        (user_id, event_id, name, email, phone, preferred_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, event_id, name, email, phone, preferred_date, notes]
    );

    res.status(201).json({ message: 'Registration successful!' });
  } catch (error) {
    console.error('❌ Database insert error:', error);
    res.status(500).json({ message: 'Error saving registration.' });
  }
});

/* 📋 Get user’s registrations (GET /api/registrations/my)
---------------------------------------------------------- */
router.get('/my', verifyToken, async (req, res) => {
  try {
    console.log('Fetching registrations for user:', req.user.id);

    const [rows] = await pool.query(
      `SELECT 
         r.id,
         e.title AS event_title,
         e.category AS event_category,
         e.date AS event_date,
         r.preferred_date,
         r.notes,
         r.created_at,
         r.status
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error('❌ Error fetching user registrations:', error);
    res.status(500).json({ message: 'Error fetching registrations.' });
  }
});

/* 🧾 Get all registrations (Admin Dashboard)
--------------------------------------------- */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        r.id AS registration_id,
        r.name AS user_name,
        r.email AS user_email,
        r.phone AS user_phone,
        e.title AS event_title,
        e.date AS event_date,
        r.preferred_date,
        r.status,
        r.created_at
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      ORDER BY r.created_at DESC
    `);

    res.status(200).json(rows);
  } catch (error) {
    console.error('❌ Error fetching all registrations:', error);
    res.status(500).json({ message: 'Error fetching registrations.' });
  }
});

/* ❌ Delete a registration (Admin)
----------------------------------- */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM registrations WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Registration not found.' });
    }

    res.status(200).json({ message: 'Registration deleted successfully.' });
  } catch (error) {
    console.error('❌ Error deleting registration:', error);
    res.status(500).json({ message: 'Error deleting registration.' });
  }
});

/* ⚙️ Ensure ON DELETE CASCADE is enabled (One-time setup)
----------------------------------------------------------- */
// Optional route to fix DB constraint manually (run once if needed)
router.post('/fix-cascade', async (req, res) => {
  try {
    await pool.query(`
      ALTER TABLE registrations
      DROP FOREIGN KEY registrations_ibfk_2;
    `);

    await pool.query(`
      ALTER TABLE registrations
      ADD CONSTRAINT registrations_ibfk_2
      FOREIGN KEY (event_id)
      REFERENCES events(id)
      ON DELETE CASCADE;
    `);

    res.status(200).json({ message: 'Foreign key updated with ON DELETE CASCADE.' });
  } catch (error) {
    console.error('❌ Error fixing cascade rule:', error);
    res.status(500).json({ message: 'Error updating foreign key constraint.' });
  }
});

module.exports = router;
