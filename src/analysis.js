const cron = require('node-cron');
const moment = require('moment');
const { Parser } = require('@json2csv/plainjs');
const fs = require('node:fs');
const { pool } = require("./db");
const { cutArrayPerPercentage } = require('./lib');

const formatter = Intl.NumberFormat('en', { notation: 'compact' });

const calculImbalance = async (ticker, per) => {
	const res = await pool.query("SELECT * FROM order_book WHERE symbol = $1 ORDER BY date ASC;", [ticker]);

	const data = res.rows.map(x => {
		const bids = cutArrayPerPercentage(x.bids, per, 'bid');
		const asks = cutArrayPerPercentage(x.asks, per, 'ask');
		const totalBidQuantity = bids.reduce((total, bid) => total + parseFloat(bid[1]), 0);
		const totalAskQuantity = asks.reduce((total, ask) => total + parseFloat(ask[1]), 0);

	return {
			date: moment(x.date).local().format('DD/MM/YYYY HH:mm'),
			asks: formatter.format(totalAskQuantity),
			bids: formatter.format(totalBidQuantity),
			imbalance2: ((totalBidQuantity - totalAskQuantity) / (totalBidQuantity + totalAskQuantity) * 100).toFixed(2) + '%',
		}
	})
	// console.log(data)

	try {
		const parser = new Parser();
		const csv = parser.parse(data);
		fs.writeFile(`${ticker}.csv`, csv, { flag: 'a+' }, err => {
			if (err)
				console.error(err);
			// file written successfully
		});
	} catch (err) {
		console.error(err);
	}
}
// calculImbalance('INJUSDT', 5);
// cron.schedule('*/5 * * * *', () => {
	// setTimeout(() => {
		// calculImbalance('TIAUSDT', 3);
		calculImbalance('SOLUSDT', 5);
		// calculImbalance('BLURUSDT', 1.5);
	// }, 3000);
// }); 