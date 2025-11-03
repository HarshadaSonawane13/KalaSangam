// backend/routes/events.js
const express = require('express');
const pool = require('../db/connection');
const router = express.Router();

// ✅ Get all events (READ)
router.get('/', async (req, res) => {
  try {
    const [events] = await pool.query('SELECT * FROM events ORDER BY date DESC');
    console.log("✅ Events fetched:", events); // Debug log for confirmation
    res.status(200).json(events);
  } catch (error) {
    console.error('❌ Error fetching events:', error);
    res.status(500).json({ message: 'Error fetching events' });
  }
});

// ✅ Get single event (READ one)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);
    if (rows.length === 0)
      return res.status(404).json({ message: 'Event not found' });
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('❌ Error fetching event:', error);
    res.status(500).json({ message: 'Error fetching event' });
  }
});

// ✅ Add event (CREATE)
router.post('/', async (req, res) => {
  const { title, category, date, description, image } = req.body;

  if (!title || !category || !date) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  try {
    await pool.query(
      `INSERT INTO events (title, category, date, description, image)
       VALUES (?, ?, ?, ?, ?)`,
      [title, category, date, description, image]
    );
    res.status(201).json({ message: 'Event created successfully!' });
  } catch (error) {
    console.error('❌ Error adding event:', error);
    res.status(500).json({ message: 'Error creating event' });
  }
});

// ✅ Update event (UPDATE)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, category, date, description, image } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE events 
       SET title = ?, category = ?, date = ?, description = ?, image = ?
       WHERE id = ?`,
      [title, category, date, description, image, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json({ message: 'Event updated successfully!' });
  } catch (error) {
    console.error('❌ Error updating event:', error);
    res.status(500).json({ message: 'Error updating event' });
  }
});

// ✅ Delete event (DELETE)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Step 1: Delete all registrations linked to this event
    await pool.query('DELETE FROM registrations WHERE event_id = ?', [id]);

    // Step 2: Delete the event itself
    const [result] = await pool.query('DELETE FROM events WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json({
      message: 'Event and related registrations deleted successfully!',
    });
  } catch (error) {
    console.error('❌ Error deleting event:', error);
    res.status(500).json({ message: 'Error deleting event' });
  }
});

module.exports = router;
