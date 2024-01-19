const cron = require('node-cron');
const moment = require('moment');
const { pool } = require("./db");

const calculImbalance = async () => {
		const res = await pool.query("SELECT * FROM order_book WHERE symbol = 'BLURUSDT' ORDER BY time DESC LIMIT 1;");

		const bids = res.rows[0].bids.slice(0, 1000);
		const asks = res.rows[0].asks.slice(0, 1000);

		console.log(bids)

		const totalBidQuantity = bids.reduce((total, bid) => total + parseFloat(bid[1]), 0);
		const totalAskQuantity = asks.reduce((total, ask) => total + parseFloat(ask[1]), 0);
		console.log(totalBidQuantity, totalAskQuantity)

		// Calculate the percentage difference
		const imbalancePercentage = Math.abs((totalBidQuantity - totalAskQuantity) / ((totalBidQuantity + totalAskQuantity) / 2)) * 100;
		
		// const data = {
		// 	date: null,
		// 	totalBid: totalBidQuantity,
		// 	totalAsk: totalAskQuantity,
		// 	imbalance: imbalancePercentage.toFixed(2)
		// }
		// const content = `${moment().format('DD/MM/YYYY HH:mm')}, ${totalAskQuantity}, ${totalBidQuantity}, ${imbalancePercentage.toFixed(2)}\n`
		console.log(`Imbalance Percentage: ${imbalancePercentage.toFixed(2)}%`);
}

// cron.schedule('*/5 * * * *', () => {
  calculImbalance();
// });