import { translations } from './translations.js';

class I18n {
  constructor() {
    this.currentLang = localStorage.getItem('language') || 'de';
    this.supported = ['de', 'en', 'tr', 'fr', 'es'];
  }

  setLanguage(lang) {
    if (this.supported.includes(lang)) {
      this.currentLang = lang;
      localStorage.setItem('language', lang);
      document.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
    }
  }

  t(key) {
    const dict = translations[this.currentLang] || translations['de'];
    return dict[key] || translations['en'][key] || key;
  }

  get languages() {
    return [
      { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
      { code: 'en', name: 'English', flag: '🇬🇧' },
      { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
    ];
  }
}

export const i18n = new I18n();
export default i18n;
