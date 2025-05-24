import { Check } from 'lucide-react-native';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useI18n } from '../src/contexts/I18nContext';
import { useTheme } from '../src/contexts/ThemeContext';

export default function LanguageSettingsScreen() {
  const { theme } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const styles = createThemedStyles(theme);

  const languages = [
    { code: 'en', name: t('languages.english') },
    { code: 'it', name: t('languages.italian') },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={styles.row}
            onPress={() => setLocale(lang.code)}
          >
            <Text style={styles.rowLabel}>{lang.name}</Text>
            {locale === lang.code && (
              <Check size={24} color={theme.primary} />
            )}
          </TouchableOpacity>
        ))}
      </SafeAreaView>
    </View>
  );
}

const createThemedStyles = (theme: import('../src/styles/themes').Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    safeArea: {
      flex: 1,
      marginTop: 20,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
      backgroundColor: theme.card,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    rowLabel: {
      fontSize: 17,
      color: theme.text,
    },
  });