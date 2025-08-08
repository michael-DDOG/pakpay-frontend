// src/screens/WelcomeScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import LanguageToggle from '../components/LanguageToggle';

const WelcomeScreen = ({ navigation }) => {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <View style={styles.languageContainer}>
        <LanguageToggle />
      </View>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>LOGO</Text>
          </View>
        </View>

        <Text style={styles.title}>{t('welcome.title')}</Text>

        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={() => navigation.navigate('PhoneRegistration')}
          activeOpacity={0.8}
        >
          <Text style={styles.getStartedText}>{t('welcome.getStarted')}</Text>
        </TouchableOpacity>

        <View style={styles.signInContainer}>
          <Text style={styles.haveAccountText}>{t('welcome.haveAccount')}</Text>
          <TouchableOpacity onPress={() => console.log('Sign In')}>
            <Text style={styles.signInText}>{t('welcome.signIn')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  languageContainer: {
    alignItems: 'center',
    paddingTop: 20
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logoText: {
    color: colors.secondary,
    fontSize: 24,
    fontWeight: 'bold'
  },
  title: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 48
  },
  getStartedButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24
  },
  getStartedText: {
    color: colors.secondary,
    fontSize: 18,
    fontWeight: 'bold'
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  haveAccountText: {
    ...typography.body,
    color: colors.textSecondary,
    marginRight: 8
  },
  signInText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: 'bold'
  }
});

export default WelcomeScreen;
