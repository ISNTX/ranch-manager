const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Create a new connection pool using DATABASE_URL from environment
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

/**
 * Initialise the database by creating tables if they don't already exist.
 */
async function init() {
  // SQL statements to create tables
  const sql = `
    CREATE TABLE IF NOT EXISTS animals (
      id SERIAL PRIMARY KEY,
      tag VARCHAR(50) UNIQUE NOT NULL,
      sex VARCHAR(10),
      dob DATE NOT NULL,
      birth_weight NUMERIC,
      mother_id INTEGER,
      father_id INTEGER,
      bloodline VARCHAR(100),
      pen VARCHAR(100),
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS births (
      id SERIAL PRIMARY KEY,
      animal_id INTEGER REFERENCES animals(id),
      birth_date DATE NOT NULL,
      location VARCHAR(100),
      assisted BOOLEAN DEFAULT false,
      complications TEXT,
      photos TEXT
    );

    CREATE TABLE IF NOT EXISTS weight_logs (
      id SERIAL PRIMARY KEY,
      animal_id INTEGER REFERENCES animals(id),
      recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      weight NUMERIC NOT NULL,
      method VARCHAR(100),
      notes TEXT
    );
  `;
  await pool.query(sql);
}

module.exports = {
  pool,
  init,
};