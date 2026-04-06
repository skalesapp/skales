const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'apps/web/src/locales');
const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));

function flattenKeys(obj, prefix) {
  prefix = prefix || '';
  let keys = [];
  for (const key in obj) {
    const fullKey = prefix ? prefix + '.' + key : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(flattenKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function getValue(obj, keyPath) {
  const parts = keyPath.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}

const enKeys = flattenKeys(en);
console.log('English keys count:', enKeys.length);

const files = ['de','es','fr','ja','ko','pt','ru','zh'];

for (const lang of files) {
  const langPath = path.join(localesDir, lang + '.json');
  const langData = JSON.parse(fs.readFileSync(langPath, 'utf8'));
  const langKeys = flattenKeys(langData);

  const missingInLang = enKeys.filter(k => !langKeys.includes(k));
  const extraInLang = langKeys.filter(k => !enKeys.includes(k));
  
  // Check for keys whose values are identical to English (likely untranslated)
  const untranslated = enKeys.filter(k => {
    const enVal = getValue(en, k);
    const langVal = getValue(langData, k);
    return langVal !== undefined && langVal === enVal && typeof enVal === 'string' && enVal.length > 3;
  });

  console.log('\n=== ' + lang.toUpperCase() + ' ===');
  console.log('Total keys:', langKeys.length);
  console.log('Missing keys (' + missingInLang.length + '):');
  if (missingInLang.length > 0) {
    missingInLang.forEach(k => console.log('  - ' + k));
  }
  console.log('Extra keys (' + extraInLang.length + '):');
  if (extraInLang.length > 0) {
    extraInLang.forEach(k => console.log('  - ' + k));
  }
  console.log('Possibly untranslated (same as English) (' + untranslated.length + '):');
  if (untranslated.length > 0 && untranslated.length < 50) {
    untranslated.forEach(k => console.log('  - ' + k + ' = "' + getValue(en, k) + '"'));
  } else if (untranslated.length >= 50) {
    untranslated.slice(0, 30).forEach(k => console.log('  - ' + k + ' = "' + getValue(en, k) + '"'));
    console.log('  ... and ' + (untranslated.length - 30) + ' more');
  }
}
