import en from './locales/en.js';
import es from './locales/es.js';

export const locales = {
  en,
  es
};

export function getCurrentLanguage() {
  try {
    if (window.app && window.app.plugins && window.app.plugins.plugins['tabs-extended']) {
      return window.app.plugins.plugins['tabs-extended'].settings.language || 'es';
    }
  } catch (err) {}
  return 'es';
}

export function t(key, ...params) {
  const lang = getCurrentLanguage();
  const dict = locales[lang] || locales['es'] || locales['en'];
  let text = (dict && dict[key]) || (locales['en'] && locales['en'][key]) || (locales['es'] && locales['es'][key]) || key;

  if (params && params.length > 0) {
    params.forEach((val, idx) => {
      text = text.replace(new RegExp('\\{' + idx + '\\}', 'g'), val);
    });
  }
  return text;
}

export const $ = t;
export const _ = t;
export default t;
