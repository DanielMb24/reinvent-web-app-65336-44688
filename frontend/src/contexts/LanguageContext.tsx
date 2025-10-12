import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  fr: {
    'nav.home': 'Accueil',
    'nav.concours': 'Concours',
    'nav.contact': 'Contact',
    'nav.login': 'Connexion',
    'hero.title': 'GABConcours',
    'hero.subtitle': 'Votre portail unique pour tous les concours du Gabon',
    'hero.description': 'Inscrivez-vous facilement, suivez votre progression et réussissez vos concours',
    'search.title': 'Suivre ma candidature',
    'search.placeholder': 'Ex: GABCONCOURS-6-30-15',
    'search.button': 'Rechercher',
    'concours.available': 'Concours Disponibles',
    'concours.register': 'Postuler maintenant',
    'stats.concours': 'Concours',
    'stats.candidates': 'Candidats',
    'stats.establishments': 'Établissements',
    'stats.support': 'Support',
  },
  en: {
    'nav.home': 'Home',
    'nav.concours': 'Competitions',
    'nav.contact': 'Contact',
    'nav.login': 'Login',
    'hero.title': 'GABConcours',
    'hero.subtitle': 'Your unique portal for all competitions in Gabon',
    'hero.description': 'Register easily, track your progress and succeed in your competitions',
    'search.title': 'Track my application',
    'search.placeholder': 'Ex: GABCONCOURS-6-30-15',
    'search.button': 'Search',
    'concours.available': 'Available Competitions',
    'concours.register': 'Apply now',
    'stats.concours': 'Competitions',
    'stats.candidates': 'Candidates',
    'stats.establishments': 'Establishments',
    'stats.support': 'Support',
  },
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('fr');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language | null;
    if (savedLang && (savedLang === 'fr' || savedLang === 'en')) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
