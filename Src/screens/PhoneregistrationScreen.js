// src/screens/PhoneRegistrationScreen.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import { authService } from '../services/authService';

const PhoneRegistrationScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const otpInputRef = useRef(null);

  const validatePhoneNumber = (number) => {
    const phoneRegex = /^((\+92)|(0092)|(0))(3)([0-9]{9})$/;
    return phoneRegex.test(number);
  };

  const formatPhoneNumber = (text) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format as 03XX XXX XXXX
    if (cleaned.startsWith('92')) {
      return cleaned.substring(2);
    }
    return cleaned;
  };

  const handleSendOTP = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert('Error', t('registration.invalidPhone'));
      return;
    }

    setLoading(true);
    try {
      await authService.sendOTP(phoneNumber);
      setShowOTP(true);
      Alert.alert('Success', t('registration.otpSent'));
      setTimeout(() => otpInputRef.current?.focus(), 100);
    } catch (error) {
      Alert.alert('Error', error.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.verifyOTP(phoneNumber, otp);
      if (result.verified) {
        navigation.navigate('CNICVerification', { phoneNumber });
      }
    } catch (error) {
      Alert.alert('Error', error.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.step}>Step 1/3</Text>
          <Text style={styles.title}>
            {showOTP ? t('registration.enterOTP') : t('registration.enterPhone')}
          </Text>
          {!showOTP && (
            <Text style={styles.helper}>{t('registration.phoneHelper')}</Text>
          )}
        </View>

        {!showOTP ? (
          <View style={styles.inputContainer}>
            <View style={styles.phoneInput}>
              <Text style={styles.countryCode}>+92</Text>
              <TextInput
                style={styles.input}
                placeholder="3XX XXX XXXX"
                value={phoneNumber}
                onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                keyboardType="phone-pad"
                maxLength={11}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendOTP}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.secondary} />
              ) : (
                <Text style={styles.buttonText}>{t('registration.continue')} →</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <TextInput
              ref={otpInputRef}
              style={styles.otpInput}
              placeholder="000000"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyOTP}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.secondary} />
              ) : (
                <Text style={styles.buttonText}>{t('registration.verify')}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleSendOTP}
              disabled={loading}
            >
              <Text style={styles.resendText}>{t('registration.resendOTP')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    flex: 1,
    paddingHorizontal: 24
  },
  backButton: {
    paddingVertical: 16
  },
  backText: {
    ...typography.body,
    color: colors.primary
  },
  header: {
    marginBottom: 48
  },
  step: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 8
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: 8
  },
  helper: {
    ...typography.body,
    color: colors.textSecondary
  },
  inputContainer: {
    flex: 1
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 24,
    backgroundColor: colors.secondary
  },
  countryCode: {
    ...typography.body,
    color: colors.text,
    marginRight: 12,
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: colors.border
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: 16
  },
  otpInput: {
    ...typography.h1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
    backgroundColor: colors.secondary,
    textAlign: 'center',
    letterSpacing: 8
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 56
  },
  buttonDisabled: {
    opacity: 0.7
  },
  buttonText: {
    color: colors.secondary,
    fontSize: 18,
    fontWeight: 'bold'
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 24
  },
  resendText: {
    ...typography.body,
    color: colors.primary,
    textDecorationLine: 'underline'
  }
});

export default PhoneRegistrationScreen;
