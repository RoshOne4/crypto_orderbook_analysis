const { Spot } = require('@binance/connector')
const cron = require('node-cron');
const fs = require('node:fs');
const moment = require('moment'); // require
// const content = 'Some content!';

const client = new Spot()

const calculImbalance = () => {
	client.depth('solusdt', { limit: 1000 })
	.then(response => {
		client.logger.log(response.data.asks[0], response.data.asks[999])
		const bids = response.data.bids;
		const asks = response.data.asks;

		const totalBidQuantity = bids.reduce((total, bid) => total + parseFloat(bid[1]), 0);
		const totalAskQuantity = asks.reduce((total, ask) => total + parseFloat(ask[1]), 0);
		console.log(totalBidQuantity, totalAskQuantity)

		// Calculate the percentage difference
		const imbalancePercentage = Math.abs((totalBidQuantity - totalAskQuantity) / ((totalBidQuantity + totalAskQuantity) / 2)) * 100;
		
		const data = {
			date: null,
			totalBid: totalBidQuantity,
			totalAsk: totalAskQuantity,
			imbalance: imbalancePercentage.toFixed(2)
		}
		const content = `${moment().format('DD/MM/YYYY HH:mm')}, ${totalAskQuantity}, ${totalBidQuantity}, ${imbalancePercentage.toFixed(2)}\n`
		fs.writeFile('res.csv', content, { flag: 'a+' }, err => {
			if (err) {
				console.error(err);
			}
			// file written successfully
		});
		console.log(data)
		// console.log(`Imbalance Percentage: ${imbalancePercentage.toFixed(2)}%`);
	})
	.catch(error => client.logger.error(error))
}

cron.schedule('*/5 * * * *', () => {
  calculImbalance();
});