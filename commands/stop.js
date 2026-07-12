const { stop } = require('../utils/music');
module.exports = { name: 'stop', async execute(msg) { return stop(msg); } };
