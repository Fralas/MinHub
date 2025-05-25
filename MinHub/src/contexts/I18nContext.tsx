import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import en from '../locales/en.json';
import it from '../locales/it.json';

const translations = { en, it };

export const i18nInstance = new I18n(translations);
i18nInstance.enableFallback = true;

const I18N_LANGUAGE_KEY = 'minhub_user_language';

interface I18nContextData {
  locale: string;
  setLocale: (locale: string) => void;
  t: (scope: string, options?: any) => string;
}

const I18nContext = createContext<I18nContextData>({} as I18nContextData);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState(() => {
    const deviceLocale = Localization.getLocales()[0]?.languageCode;
    return (deviceLocale && translations[deviceLocale as keyof typeof translations]) ? deviceLocale : 'en';
  });

  useEffect(() => {
    i18nInstance.locale = locale;
  }, [locale]);

  useEffect(() => {
    const loadLocale = async () => {
      const savedLocale = await AsyncStorage.getItem(I18N_LANGUAGE_KEY);
      if (savedLocale && translations[savedLocale as keyof typeof translations]) {
        setLocaleState(savedLocale);
      } else {
        const deviceLocale = Localization.getLocales()[0]?.languageCode;
        if (deviceLocale && translations[deviceLocale as keyof typeof translations]) {
          setLocaleState(deviceLocale);
        } else {
          setLocaleState('en');
        }
      }
    };
    loadLocale();
  }, []);

  const setLocale = async (newLocale: string) => {
    if (translations[newLocale as keyof typeof translations]) {
      setLocaleState(newLocale);
      await AsyncStorage.setItem(I18N_LANGUAGE_KEY, newLocale);
    }
  };

  const t = (scope: string, options?: any) => i18nInstance.t(scope, { ...options, locale });

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);