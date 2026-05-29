require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { pool, init } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

init().catch((err) => {
  console.error('Failed to initialise database', err);
  process.exit(1);
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

/* ── ANIMALS ── */
app.post('/animals', async (req, res) => {
  try {
    const { tag, sex, dob, birthWeight, motherId, fatherId, bloodline, pen, species, notes } = req.body;
    const q = `INSERT INTO animals (tag,sex,dob,birth_weight,mother_id,father_id,bloodline,pen,species,notes)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`;
    const r = await pool.query(q, [tag,sex,dob,birthWeight,motherId,fatherId,bloodline,pen,species||null,notes]);
    res.status(201).json(r.rows[0]);
  } catch(err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.get('/animals', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM animals ORDER BY id DESC');
    res.json(r.rows);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.get('/animals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const animal  = await pool.query('SELECT * FROM animals WHERE id=$1', [id]);
    if (!animal.rows.length) return res.status(404).json({ error: 'Not found' });
    const births  = await pool.query('SELECT * FROM births WHERE animal_id=$1', [id]);
    const weights = await pool.query('SELECT * FROM weight_logs WHERE animal_id=$1 ORDER BY recorded_at DESC', [id]);
    const health  = await pool.query('SELECT * FROM health_records WHERE animal_id=$1 ORDER BY record_date DESC', [id]);
    res.json({ animal: animal.rows[0], births: births.rows, weights: weights.rows, health: health.rows });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.put('/animals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tag, sex, dob, birthWeight, motherId, fatherId, bloodline, pen, species, notes } = req.body;
    const q = `UPDATE animals SET tag=$1,sex=$2,dob=$3,birth_weight=$4,mother_id=$5,father_id=$6,
               bloodline=$7,pen=$8,species=$9,notes=$10 WHERE id=$11 RETURNING *`;
    const r = await pool.query(q, [tag,sex,dob,birthWeight,motherId,fatherId,bloodline,pen,species,notes,id]);
    res.json(r.rows[0]);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.delete('/animals/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM animals WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

/* ── BIRTHS ── */
app.post('/births', async (req, res) => {
  try {
    const { animalId, birthDate, location, assisted, complications, photos } = req.body;
    const q = `INSERT INTO births (animal_id,birth_date,location,assisted,complications,photos)
               VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`;
    const r = await pool.query(q, [animalId,birthDate,location,assisted,complications,photos]);
    res.status(201).json(r.rows[0]);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.get('/births', async (req, res) => {
  try {
    const r = await pool.query('SELECT b.*,a.tag as animal_tag FROM births b LEFT JOIN animals a ON b.animal_id=a.id ORDER BY b.id DESC');
    res.json(r.rows);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

/* ── WEIGHT LOGS ── */
app.post('/weights', async (req, res) => {
  try {
    const { animalId, weight, recordedAt, method, notes } = req.body;
    const q = `INSERT INTO weight_logs (animal_id,weight,recorded_at,method,notes)
               VALUES ($1,$2,$3,$4,$5) RETURNING *`;
    const r = await pool.query(q, [animalId,weight,recordedAt||new Date(),method,notes]);
    res.status(201).json(r.rows[0]);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.get('/weights', async (req, res) => {
  try {
    const { animalId } = req.query;
    const q = animalId
      ? 'SELECT * FROM weight_logs WHERE animal_id=$1 ORDER BY recorded_at DESC'
      : 'SELECT w.*,a.tag as animal_tag FROM weight_logs w LEFT JOIN animals a ON w.animal_id=a.id ORDER BY w.recorded_at DESC';
    const r = await pool.query(q, animalId ? [animalId] : []);
    res.json(r.rows);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

/* ── HEALTH RECORDS ── */
app.post('/health', async (req, res) => {
  try {
    const { animalId, recordDate, type, diagnosis, treatment, vet, cost, notes } = req.body;
    const q = `INSERT INTO health_records (animal_id,record_date,type,diagnosis,treatment,vet,cost,notes)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`;
    const r = await pool.query(q, [animalId,recordDate,type,diagnosis,treatment,vet,cost,notes]);
    res.status(201).json(r.rows[0]);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.get('/health', async (req, res) => {
  try {
    const r = await pool.query('SELECT h.*,a.tag as animal_tag FROM health_records h LEFT JOIN animals a ON h.animal_id=a.id ORDER BY h.record_date DESC');
    res.json(r.rows);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

/* ── PENS ── */
app.post('/pens', async (req, res) => {
  try {
    const { name, type, capacity, location, notes } = req.body;
    const q = `INSERT INTO pens (name,type,capacity,location,notes) VALUES ($1,$2,$3,$4,$5) RETURNING *`;
    const r = await pool.query(q, [name,type,capacity,location,notes]);
    res.status(201).json(r.rows[0]);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.get('/pens', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM pens ORDER BY name');
    res.json(r.rows);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

/* ── STAFF ── */
app.post('/staff', async (req, res) => {
  try {
    const { name, role, phone, email, startDate, hourlyRate, notes } = req.body;
    const q = `INSERT INTO staff (name,role,phone,email,start_date,hourly_rate,notes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`;
    const r = await pool.query(q, [name,role,phone,email,startDate,hourlyRate,notes]);
    res.status(201).json(r.rows[0]);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.get('/staff', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM staff ORDER BY name');
    res.json(r.rows);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

/* ── FINANCIALS ── */
app.post('/financials', async (req, res) => {
  try {
    const { type, category, date, amount, desc, notes } = req.body;
    const q = `INSERT INTO financials (type,category,trans_date,amount,description,notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`;
    const r = await pool.query(q, [type,category,date,amount,desc,notes]);
    res.status(201).json(r.rows[0]);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.get('/financials', async (req, res) => {
  try {
    const { year, type } = req.query;
    let q = 'SELECT * FROM financials WHERE 1=1';
    const params = [];
    if (year) { params.push(year); q += ` AND EXTRACT(YEAR FROM trans_date)=$${params.length}`; }
    if (type) { params.push(type); q += ` AND type=$${params.length}`; }
    q += ' ORDER BY trans_date DESC';
    const r = await pool.query(q, params);
    res.json(r.rows);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

/* ── SALES ── */
app.post('/sales', async (req, res) => {
  try {
    const { animal, species, date, price, buyer, phone, type, status, notes } = req.body;
    const q = `INSERT INTO sales (animal_name,species,sale_date,price,buyer_name,buyer_phone,sale_type,status,notes)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`;
    const r = await pool.query(q, [animal,species,date,price,buyer,phone,type,status,notes]);
    res.status(201).json(r.rows[0]);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.get('/sales', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM sales ORDER BY sale_date DESC');
    res.json(r.rows);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

/* ── FEED ── */
app.post('/feed/inventory', async (req, res) => {
  try {
    const { type, cat, qty, unit, minThreshold, cost, supplier } = req.body;
    const q = `INSERT INTO feed_inventory (feed_type,category,quantity,unit,min_threshold,cost_per_unit,supplier)
               VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`;
    const r = await pool.query(q, [type,cat,qty,unit,minThreshold,cost,supplier]);
    res.status(201).json(r.rows[0]);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.get('/feed/inventory', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM feed_inventory ORDER BY feed_type');
    res.json(r.rows);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.post('/feed/log', async (req, res) => {
  try {
    const { dt, staff, pen, feed, notes } = req.body;
    const q = `INSERT INTO feed_logs (log_time,staff_name,pen,feed_used,notes) VALUES ($1,$2,$3,$4,$5) RETURNING *`;
    const r = await pool.query(q, [dt||new Date(),staff,pen,feed,notes]);
    res.status(201).json(r.rows[0]);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.get('/feed/log', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM feed_logs ORDER BY log_time DESC LIMIT 200');
    res.json(r.rows);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

/* ── PAIRINGS ── */
app.post('/pairings', async (req, res) => {
  try {
    const { buckId, doeId, startDate, endDate, pen, notes } = req.body;
    const q = `INSERT INTO pairings (buck_id,doe_id,start_date,end_date,pen,notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`;
    const r = await pool.query(q, [buckId,doeId,startDate,endDate,pen,notes]);
    res.status(201).json(r.rows[0]);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.get('/pairings', async (req, res) => {
  try {
    const r = await pool.query(`SELECT p.*,
      b.tag as buck_tag, d.tag as doe_tag
      FROM pairings p
      LEFT JOIN animals b ON p.buck_id=b.id
      LEFT JOIN animals d ON p.doe_id=d.id
      ORDER BY p.start_date DESC`);
    res.json(r.rows);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

/* ── DOCUMENTS ── */
app.post('/documents', async (req, res) => {
  try {
    const { name, category, uploadDate, notes, dataUrl } = req.body;
    const q = `INSERT INTO documents (name,category,upload_date,notes,data_url) VALUES ($1,$2,$3,$4,$5) RETURNING *`;
    const r = await pool.query(q, [name,category,uploadDate||new Date(),notes,dataUrl]);
    res.status(201).json(r.rows[0]);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.get('/documents', async (req, res) => {
  try {
    const r = await pool.query('SELECT id,name,category,upload_date,notes FROM documents ORDER BY upload_date DESC');
    res.json(r.rows);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => console.log(`TANC Ranch Manager running on port ${PORT}`));
