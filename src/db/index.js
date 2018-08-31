//       - DATABASE_URL=postgresql://user:pw@db:5432/db?sslmode=disable
const { Pool } = require('pg')
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://mattij@localhost:5432/dippa?sslmode=disable'
})

module.exports = {
  query: (text, params) => pool.query(text, params)
}
