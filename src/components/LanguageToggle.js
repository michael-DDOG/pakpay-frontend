// src/components/LanguageToggle.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, I18nManager, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
// REMOVED: import RNRestart from 'react-native-restart';
import { colors } from '../styles/colors';

const LanguageToggle = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const toggleLanguage = async () => {
    const newLanguage = currentLanguage === 'en' ? 'ur' : 'en';
    await i18n.changeLanguage(newLanguage);
    await AsyncStorage.setItem('language', newLanguage);
    
    // For RTL support
    const isRTL = newLanguage === 'ur';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      I18nManager.allowRTL(isRTL);
      
      // In Expo Go, we can't restart the app programmatically
      // Show a message to the user instead
      Alert.alert(
        'Language Changed',
        'Please restart the app for RTL layout changes to take effect.',
        [{ text: 'OK' }]
      );
    }
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