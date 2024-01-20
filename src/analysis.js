const cron = require('node-cron');
const moment = require('moment');
const { pool } = require("./db");
const { Parser } = require('@json2csv/plainjs');
const fs = require('node:fs');

const formatter = Intl.NumberFormat('en', { notation: 'compact' });

const cutArrayPerPercentage = (ar, per, side) => {
	const flatar = ar.map(x => x[0]);
	const first = parseFloat(flatar[0]);
	const threshold = (side === 'ask') ? first + (first * (per / 100)) : first - (first * (per / 100));
	const thresholdIndex = (side === 'ask') ? flatar.findIndex(value => parseFloat(value) >= threshold) : flatar.findIndex(value => parseFloat(value) <= threshold);

	return ar.slice(0, thresholdIndex)
}

const calculImbalance = async (ticker, per) => {
	const res = await pool.query("SELECT * FROM order_book WHERE symbol = $1 ORDER BY date ASC;", [ticker]);

	const data = res.rows.map(x => {
		const bids = cutArrayPerPercentage(x.bids, per, 'bid');
		const asks = cutArrayPerPercentage(x.asks, per, 'ask');
		const totalBidQuantity = bids.reduce((total, bid) => total + parseFloat(bid[1]), 0);
		const totalAskQuantity = asks.reduce((total, ask) => total + parseFloat(ask[1]), 0);

	return {
			date: moment(x.date).local().format(),
			asks: formatter.format(totalAskQuantity),
			bids: formatter.format(totalBidQuantity),
			imbalance: ((totalBidQuantity - totalAskQuantity) / ((totalBidQuantity + totalAskQuantity) / 2) * 100).toFixed(2) + '%'
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
calculImbalance('TIAUSDT', 1);
cron.schedule('*/5 * * * *', () => {
	setTimeout(() => {
		calculImbalance('TIAUSDT', 3);
		calculImbalance('SOLUSDT', 5);
		calculImbalance('BLURUSDT', 1.5);
	}, 3000);
});