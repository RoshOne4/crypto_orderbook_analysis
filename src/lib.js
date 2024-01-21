const cutArrayPerPercentage = (ar, per, side) => {
	const flatar = ar.map(x => x[0]);
	const first = parseFloat(flatar[0]);
	const threshold = (side === 'ask') ? first + (first * (per / 100)) : first - (first * (per / 100));
	const thresholdIndex = (side === 'ask') ? flatar.findIndex(value => parseFloat(value) >= threshold) : flatar.findIndex(value => parseFloat(value) <= threshold);

	return ar.slice(0, thresholdIndex)
}

module.exports = { cutArrayPerPercentage };