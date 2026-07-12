const { toggleLoop } = require('../utils/music');
module.exports = { name: 'loop', async execute(msg) { return toggleLoop(msg); } };
