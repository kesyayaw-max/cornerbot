const { nowPlaying } = require('../utils/music');
module.exports = { name: 'nowplaying', async execute(msg) { return nowPlaying(msg); } };
