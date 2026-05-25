require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { pool, init } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Initialise database tables on startup
init().catch((err) => {
  console.error('Failed to initialise database', err);
  process.exit(1);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

/*
 * ANIMALS
 */

// Create new animal
app.post('/animals', async (req, res) => {
  try {
    const {
      tag,
      sex,
      dob,
      birthWeight,
      motherId,
      fatherId,
      bloodline,
      pen,
      notes,
    } = req.body;
    const query = `
      INSERT INTO animals (tag, sex, dob, birth_weight, mother_id, father_id, bloodline, pen, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *;
    `;
    const result = await pool.query(query, [
      tag,
      sex,
      dob,
      birthWeight,
      motherId,
      fatherId,
      bloodline,
      pen,
      notes,
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create animal' });
  }
});

// Get all animals
app.get('/animals', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM animals ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch animals' });
  }
});

// Get a single animal with weight logs and birth info
app.get('/animals/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const animal = await pool.query('SELECT * FROM animals WHERE id = $1', [id]);
    if (animal.rows.length === 0) {
      return res.status(404).json({ error: 'Animal not found' });
    }
    const births = await pool.query('SELECT * FROM births WHERE animal_id = $1', [id]);
    const weights = await pool.query('SELECT * FROM weight_logs WHERE animal_id = $1 ORDER BY recorded_at DESC', [id]);
    res.json({ animal: animal.rows[0], births: births.rows, weights: weights.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch animal' });
  }
});

/*
 * BIRTHS
 */

// Record a birth
app.post('/births', async (req, res) => {
  try {
    const { animalId, birthDate, location, assisted, complications, photos } = req.body;
    const query = `
      INSERT INTO births (animal_id, birth_date, location, assisted, complications, photos)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *;
    `;
    const result = await pool.query(query, [
      animalId,
      birthDate,
      location,
      assisted,
      complications,
      photos,
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record birth' });
  }
});

// Get all births
app.get('/births', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM births ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch births' });
  }
});

/*
 * WEIGHT LOGS
 */

// Record a weight
app.post('/weights', async (req, res) => {
  try {
    const { animalId, weight, recordedAt, method, notes } = req.body;
    const query = `
      INSERT INTO weight_logs (animal_id, weight, recorded_at, method, notes)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *;
    `;
    const result = await pool.query(query, [
      animalId,
      weight,
      recordedAt || new Date(),
      method,
      notes,
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record weight' });
  }
});

// Get weight logs (optionally filter by animalId)
app.get('/weights', async (req, res) => {
  const { animalId } = req.query;
  try {
    if (animalId) {
      const result = await pool.query('SELECT * FROM weight_logs WHERE animal_id = $1 ORDER BY recorded_at DESC', [animalId]);
      return res.json(result.rows);
    } else {
      const result = await pool.query('SELECT * FROM weight_logs ORDER BY recorded_at DESC');
      return res.json(result.rows);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch weight logs' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
