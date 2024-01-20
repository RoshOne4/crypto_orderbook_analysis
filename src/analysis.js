const cron = require('node-cron');
const moment = require('moment');
const { pool } = require("./db");

const formatter = Intl.NumberFormat('en', { notation: 'compact' });

const calculImbalance = async () => {
	const res = await pool.query("SELECT * FROM order_book WHERE symbol = 'SOLUSDT' ORDER BY time DESC LIMIT 1;");

	console.log(res.rows[0].time)
	const bids = res.rows[0].bids.slice(0, 1000);
	const asks = res.rows[0].asks.slice(0, 1000);

	const totalBidQuantity = bids.reduce((total, bid) => total + parseFloat(bid[1]), 0);
	const totalAskQuantity = asks.reduce((total, ask) => total + parseFloat(ask[1]), 0);

	// Calculate the percentage difference
	const imbalancePercentage = Math.abs((totalBidQuantity - totalAskQuantity) / ((totalBidQuantity + totalAskQuantity) / 2)) * 100;
	
	if (imbalancePercentage > 50)
		sendTelegram(`SOLUSDT imbalance ${imbalancePercentage.toFixed(2)}%\nBid: ${formatter.format(totalBidQuantity.toFixed(0))}\nAsk: ${formatter.format(totalAskQuantity.toFixed(0))}`);
}

calculImbalance();