import { Ionicons } from '@expo/vector-icons';
import { Check } from 'lucide-react-native';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useI18n } from '../src/contexts/I18nContext';

const lightPurplePalette = {
  primary: '#8A63D2',
  background: '#F5F3F9',
  card: '#FFFFFF',
  text: '#1A202C',
  labelText: '#553c9a', 
  subtleText: '#A0AEC0',
  border: '#E2E8F0',
  iconBackground: '#EDE9F6',
};

export default function LanguageSettingsScreen() {
  const { locale, setLocale, t } = useI18n();
  const styles = createThemedStyles(lightPurplePalette);

  const languages = [
    { code: 'en', name: t('languages.english', { defaultValue: 'English' }), iconName: 'language-outline' as keyof typeof Ionicons.glyphMap },
    { code: 'it', name: t('languages.italian', { defaultValue: 'Italiano' }), iconName: 'language-outline' as keyof typeof Ionicons.glyphMap },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContentContainer}>
            <Text style={styles.headerTitle}>{t('languages.select', { defaultValue: 'Select Language' })}</Text>
            {languages.map((lang) => (
            <TouchableOpacity
                key={lang.code}
                style={[styles.row, locale === lang.code && styles.rowSelected]}
                onPress={() => setLocale(lang.code)}
            >
                <View style={styles.rowLeft}>
                    <View style={[
                        styles.iconContainer,
                        locale === lang.code && styles.iconContainerSelected
                    ]}>
                        <Ionicons 
                            name={lang.iconName || 'language-outline'} 
                            size={22} 
                            color={locale === lang.code ? lightPurplePalette.primary : lightPurplePalette.subtleText}
                        />
                    </View>
                    <Text style={[
                        styles.rowLabel,
                        locale === lang.code && styles.rowLabelSelected
                    ]}>
                        {lang.name}
                    </Text>
                </View>
                {locale === lang.code && (
                    <Check size={24} color={lightPurplePalette.primary} style={styles.checkIcon} />
                )}
            </TouchableOpacity>
            ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createThemedStyles = (theme: typeof lightPurplePalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    safeArea: {
      flex: 1,
    },
    scrollContentContainer: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 40,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 24,
        paddingHorizontal: 4,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.card,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 14,
      marginBottom: 12,
      borderWidth: 1.5,
      borderColor: theme.border, 
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    rowSelected: {
      borderColor: theme.primary, 
      backgroundColor: theme.iconBackground, 
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.iconBackground, 
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    iconContainerSelected: {
    },
    rowLabel: {
      fontSize: 17,
      color: theme.text,
      fontWeight: '500',
    },
    rowLabelSelected: {
      color: theme.primary, 
      fontWeight: 'bold',
    },
    checkIcon: {
       
    }
  });
