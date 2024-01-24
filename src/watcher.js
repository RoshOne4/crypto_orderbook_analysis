const cron = require('node-cron');
const moment = require('moment');
const TelegramBot = require('node-telegram-bot-api');
const async = require('async');

const { pool } = require("./db");
const { cutArrayPerPercentage } = require('./lib');

const token = '5949966804:AAHrBNqcQAohUBYHgCJbqaK_vOau1TsCk2s';
const bot = new TelegramBot(token, { polling: true });
const chatId = '397929306';
const formatter = Intl.NumberFormat('en', { notation: 'compact' });

const sendTelegram = (msg) => {
	bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' })
	.catch(error => console.error('Error sending message:', error));
}

const watch = async (symbol, callback) => {
	if (!symbol.has_alert)
		return [];
	const res = await pool.query("SELECT * FROM order_book WHERE symbol = $1 ORDER BY date DESC LIMIT 1;", [symbol.ticker]);

	const x = res.rows[0];
	const bids = cutArrayPerPercentage(x.bids, symbol.within_percentage, 'bid');
	const asks = cutArrayPerPercentage(x.asks, symbol.within_percentage, 'ask');
	const totalBidQuantity = bids.reduce((total, bid) => total + parseFloat(bid[1]), 0);
	const totalAskQuantity = asks.reduce((total, ask) => total + parseFloat(ask[1]), 0);

	const data = {
		date: moment(x.date).local().format('DD/MM/YYYY HH:mm'),
		asks: formatter.format(totalAskQuantity),
		bids: formatter.format(totalBidQuantity),
		imbalance : parseFloat(((totalBidQuantity - totalAskQuantity) / (totalBidQuantity + totalAskQuantity) * 100).toFixed(2))
	}
	// console.log('>', symbol)
	// console.log(data)
	
	if (data.imbalance > 0) {
		if (data.imbalance >= parseFloat(symbol.bid_imbalance))
			sendTelegram(`${symbol.ticker}\nImbalance *${data.imbalance}%* 🟢\nBid: ${data.bids}\nAsk: ${data.asks}\nDate: ${data.date}`);
		// else if (data.imbalance >= (parseFloat(symbol.bid_imbalance) - (parseFloat(symbol.bid_imbalance) * 0.3)))
		// 	sendTelegram(`${symbol.ticker}\nImbalance *${data.imbalance}%* 🔵\nBid: ${data.bids}\nAsk: ${data.asks}\nDate: ${data.date}`);
	}
	else if (data.imbalance <= 0) {
		if (Math.abs(data.imbalance) >= parseFloat(symbol.ask_imbalance))
			sendTelegram(`${symbol.ticker}\nImbalance *${data.imbalance}%* 🔴\nBid: ${data.bids}\nAsk: ${data.asks}\nDate: ${data.date}`);
		// else if (Math.abs(data.imbalance) >= (parseFloat(symbol.ask_imbalance) - (parseFloat(symbol.ask_imbalance) * 0.3)))
		// 	sendTelegram(`${symbol.ticker}\nImbalance *${data.imbalance}%* 🟠\nBid: ${data.bids}\nAsk: ${data.asks}\nDate: ${data.date}`);
	}
	return [];
}

const initWatcher = () => {
	async.waterfall([
		async function(callback) {
			const res = await pool.query("SELECT * from symbols");

			return [res.rows];
		},
		function(symbols, callback) {
			async.each(symbols[0], watch, function(err) {
				if (err)
					callback(err)
				else
					callback(null, `Success watch at ${moment().toISOString()}`)
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
	setTimeout(() => {
		initWatcher();
	}, 3000);
});