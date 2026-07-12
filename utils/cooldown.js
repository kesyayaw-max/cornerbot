const cd = new Map();

function check(id, name, time) {
  const now = Date.now();
  const key = id + name;

  if (cd.has(key)) {
    const exp = cd.get(key);
    if (now < exp) return (exp-now)/1000;
  }

  cd.set(key, now+time);
  return 0;
}

function formatRemaining(seconds) {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = Math.ceil(seconds % 60);
    return s > 0 ? `${m}m ${s}d` : `${m}m`;
  }
  return `${Math.ceil(seconds)} detik`;
}

module.exports = { check, formatRemaining };