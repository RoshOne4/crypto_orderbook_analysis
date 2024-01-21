const { Spot } = require('@binance/connector')
const cron = require('node-cron');
const moment = require('moment');
const async = require('async');
const { pool } = require("./db");

const binance = new Spot()

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

const initFetching = () => {
	async.waterfall([
		async function(callback) {
			const res = await pool.query("SELECT ticker from symbols");

			return [res.rows.map(x => x.ticker)];
		},
		function(symbols, callback) {
			async.each(symbols[0], fetchData, function(err) {
				if (err)
					callback(err)
				else
					callback(null, `Success at ${moment().toISOString()}`)
			})
		}],
		function(err, res) {
			if (err)
				console.log(err)
			else
				console.log(res)
		})
}

cron.schedule('*/5 * * * *', () => {
  initFetching();
});