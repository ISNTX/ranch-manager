const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function init() {
  const sql = `
    CREATE TABLE IF NOT EXISTS animals (
      id SERIAL PRIMARY KEY,
      tag VARCHAR(50) UNIQUE NOT NULL,
      sex VARCHAR(10),
      dob DATE,
      birth_weight NUMERIC,
      mother_id INTEGER,
      father_id INTEGER,
      bloodline VARCHAR(100),
      pen VARCHAR(100),
      species VARCHAR(100),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS births (
      id SERIAL PRIMARY KEY,
      animal_id INTEGER REFERENCES animals(id) ON DELETE CASCADE,
      birth_date DATE NOT NULL,
      location VARCHAR(100),
      assisted BOOLEAN DEFAULT false,
      complications TEXT,
      photos TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS weight_logs (
      id SERIAL PRIMARY KEY,
      animal_id INTEGER REFERENCES animals(id) ON DELETE CASCADE,
      recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      weight NUMERIC NOT NULL,
      method VARCHAR(100),
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS health_records (
      id SERIAL PRIMARY KEY,
      animal_id INTEGER REFERENCES animals(id) ON DELETE CASCADE,
      record_date DATE NOT NULL,
      type VARCHAR(50),
      diagnosis TEXT,
      treatment TEXT,
      vet VARCHAR(100),
      cost NUMERIC,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pens (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(50),
      capacity INTEGER,
      location VARCHAR(200),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS staff (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      role VARCHAR(100),
      phone VARCHAR(30),
      email VARCHAR(100),
      start_date DATE,
      hourly_rate NUMERIC,
      notes TEXT,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pairings (
      id SERIAL PRIMARY KEY,
      buck_id INTEGER REFERENCES animals(id) ON DELETE SET NULL,
      doe_id INTEGER REFERENCES animals(id) ON DELETE SET NULL,
      start_date DATE,
      end_date DATE,
      pen VARCHAR(100),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS financials (
      id SERIAL PRIMARY KEY,
      type VARCHAR(20) NOT NULL,
      category VARCHAR(100),
      trans_date DATE,
      amount NUMERIC NOT NULL,
      description TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales (
      id SERIAL PRIMARY KEY,
      animal_name VARCHAR(100),
      species VARCHAR(100),
      sale_date DATE,
      price NUMERIC,
      buyer_name VARCHAR(100),
      buyer_phone VARCHAR(30),
      sale_type VARCHAR(50),
      status VARCHAR(20) DEFAULT 'sold',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS feed_inventory (
      id SERIAL PRIMARY KEY,
      feed_type VARCHAR(100) NOT NULL,
      category VARCHAR(50),
      quantity NUMERIC DEFAULT 0,
      unit VARCHAR(20),
      min_threshold NUMERIC DEFAULT 0,
      cost_per_unit NUMERIC,
      supplier VARCHAR(100),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS feed_logs (
      id SERIAL PRIMARY KEY,
      log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      staff_name VARCHAR(100),
      pen VARCHAR(100),
      feed_used TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      category VARCHAR(100),
      upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      data_url TEXT
    );
  `;
  await pool.query(sql);
  console.log('Database initialised successfully');
}

module.exports = { pool, init };
