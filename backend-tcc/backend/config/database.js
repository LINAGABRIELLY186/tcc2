const { Pool } = require('pg');

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "tcc1",
  password: "1530",
  port: 5432,
});

module.exports = {
    pool,
};