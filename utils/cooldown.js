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

module.exports = { check };