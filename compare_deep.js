const fs = require('fs');
const path = require('path');
const localesDir = path.join(__dirname, 'apps/web/src/locales');
const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));
const ja = JSON.parse(fs.readFileSync(path.join(localesDir, 'ja.json'), 'utf8'));
const ru = JSON.parse(fs.readFileSync(path.join(localesDir, 'ru.json'), 'utf8'));
const zh = JSON.parse(fs.readFileSync(path.join(localesDir, 'zh.json'), 'utf8'));

function deepEqual(a, b) {
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null) return a === b;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every(k => deepEqual(a[k], b[k]));
}

for (const section in en) {
  if (typeof en[section] === 'object') {
    const jaMatch = deepEqual(en[section], ja[section]);
    const ruMatch = deepEqual(en[section], ru[section]);
    const zhMatch = deepEqual(en[section], zh[section]);
    console.log(section + ': JA=' + (jaMatch ? 'SAME' : 'DIFF') + ' RU=' + (ruMatch ? 'SAME' : 'DIFF') + ' ZH=' + (zhMatch ? 'SAME' : 'DIFF'));
  }
}
