// src/components/LanguageToggle.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNRestart from 'react-native-restart';
import { colors } from '../styles/colors';

const LanguageToggle = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const toggleLanguage = async () => {
    const newLanguage = currentLanguage === 'en' ? 'ur' : 'en';
    await i18n.changeLanguage(newLanguage);
    await AsyncStorage.setItem('language', newLanguage);
    
    // For RTL support
    I18nManager.forceRTL(newLanguage === 'ur');
    I18nManager.allowRTL(newLanguage === 'ur');
    
    // Restart app to apply RTL changes (only needed once)
    // RNRestart.Restart();
  };

  return (
    <TouchableOpacity style={styles.container} onPress={toggleLanguage}>
      <Text style={[styles.text, currentLanguage === 'en' && styles.active]}>
        English
      </Text>
      <Text style={styles.separator}> | </Text>
      <Text style={[styles.text, currentLanguage === 'ur' && styles.active]}>
        اردو
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  text: {
    fontSize: 14,
    color: colors.textSecondary
  },
  active: {
    color: colors.primary,
    fontWeight: 'bold'
  },
  separator: {
    color: colors.textSecondary
  }
});

export default LanguageToggle;
