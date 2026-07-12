// Reply ke pesan user, tapi kalau pesan aslinya udah kehapus (jadi message_reference-nya
// nggak valid lagi di Discord), otomatis fallback jadi channel.send biasa alih-alih ngelempar error.
async function safeReply(msg, payload) {
  try {
    return await msg.reply(payload);
  } catch (err) {
    const isUnknownMessageRef =
      err?.code === 50035 &&
      (err?.rawError?.errors?.message_reference || String(err?.message || '').includes('message_reference'));
    const isUnknownMessage = err?.code === 10008;

    if (isUnknownMessageRef || isUnknownMessage) {
      try {
        return await msg.channel.send(payload);
      } catch (fallbackErr) {
        console.error('safeReply fallback gagal:', fallbackErr);
        return null;
      }
    }

    throw err;
  }
}

module.exports = { safeReply };
