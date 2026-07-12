const { setVolume } = require('../utils/music');

module.exports = {
  name: "volume",
  async execute(msg, args) {
    const vol = parseInt(args[0]);
    if (!vol) return msg.reply("❌ Masukkan angka!");

    setVolume(msg, vol);
  }
};