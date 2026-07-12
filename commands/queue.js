const { queueView } = require('../utils/music');
module.exports = { name: 'queue', async execute(msg) { return queueView(msg); } };
