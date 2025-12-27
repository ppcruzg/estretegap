import { useState, useEffect } from 'react';
import { translations, Language } from '../helpers/translations';

export const useTranslation = () => {
    const [language, setLanguage] = useState<Language>(() => {
        const saved = localStorage.getItem('app-language');
        return (saved as Language) || 'es';
    });

    const toggleLanguage = () => {
        const next: Language = language === 'es' ? 'en' : 'es';
        setLanguage(next);
        localStorage.setItem('app-language', next);
    };

    const t = (key: keyof typeof translations['es'], params?: Record<string, string>) => {
        let value = translations[language][key] || translations['es'][key] || key;

        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                value = value.replace(`{${k}}`, v);
            });
        }

        return value;
    };

    return { t, language, toggleLanguage, setLanguage };
};
