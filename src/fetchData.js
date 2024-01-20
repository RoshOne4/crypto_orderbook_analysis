const { Spot } = require('@binance/connector')
const cron = require('node-cron');
const moment = require('moment');
const async = require('async');
const { pool } = require("./db");

const binance = new Spot()

const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'TIAUSDT', 'BLURUSDT'];

const fetchData = (symbol, callback) => {
	const date = moment().toISOString();
	binance.depth(symbol, { limit: 5000 })
	.then(async (response) => {
		const bids = JSON.stringify(response.data.bids);
		const asks = JSON.stringify(response.data.asks);

		const res = await pool.query(
			"INSERT INTO order_book (symbol, date, bids, asks) VALUES ($1, $2, $3, $4)",
			[symbol, date, bids, asks]
		);
		return callback(null);
	})
	.catch(error => callback(error))
}

cron.schedule('*/5 * * * *', () => {
  async.each(symbols, fetchData, function(err) {
		if (err)
			console.log(err)
		else
			console.log(`Success at ${moment().toISOString()}`)
	})
});