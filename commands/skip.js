const { skip } = require('../utils/music');
module.exports = { name: 'skip', async execute(msg) { return skip(msg); } };
