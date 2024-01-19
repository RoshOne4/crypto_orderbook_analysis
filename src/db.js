const { Pool} = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'database-1.cfye8ieueblq.eu-west-3.rds.amazonaws.com',
  database: 'crypto_orderbook',
  password: 'sophia89',
  port: 5432, // Default PostgreSQL port
  ssl: {
		rejectUnauthorized: false
	}
})

module.exports = { pool };