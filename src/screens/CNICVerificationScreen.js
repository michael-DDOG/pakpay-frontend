import React, { useState, useContext } from 'react';
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
import AuthContext from '../context/AuthContext';

const CNICVerificationScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { signIn } = useContext(AuthContext);
  const { phoneNumber } = route.params;
  
  const [cnic, setCnic] = useState('');
  const [loading, setLoading] = useState(false);

  const validateCNIC = (number) => {
    const cnicRegex = /^[0-9]{5}-[0-9]{7}-[0-9]$/;
    return cnicRegex.test(number);
  };

  const formatCNIC = (text) => {
    const cleaned = text.replace(/\D/g, '');
    
    if (cleaned.length <= 5) {
      return cleaned;
    } else if (cleaned.length <= 12) {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    } else {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12, 13)}`;
    }
  };

  const handleScanCNIC = () => {
    // Temporarily disabled camera functionality
    Alert.alert(
      'Camera Feature', 
      'Camera scanning is temporarily disabled in Expo Go. Please enter your CNIC manually.',
      [{ text: 'OK' }]
    );
  };

  const handleVerifyCNIC = async () => {
    if (!validateCNIC(cnic)) {
      Alert.alert('Error', t('cnic.invalid'));
      return;
    }
  
    setLoading(true);
    try {
      console.log('Verifying CNIC:', cnic);
      const registrationData = {
        phoneNumber,
        cnic,
        password: 'TempPassword123',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com'
      };
      console.log('Sending registration data:', registrationData);
      const response = await authService.register(registrationData);
      console.log('Registration response:', response);
      await signIn(response.token, response.user);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Dashboard' }],
      });
    } catch (error) {
      console.log('Registration error:', error);
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
          <Text style={styles.step}>Step 3/3</Text>
          <Text style={styles.title}>{t('cnic.title')}</Text>
        </View>

        <View style={styles.scanContainer}>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={handleScanCNIC}
            activeOpacity={0.8}
          >
            <Text style={styles.scanIcon}>📷</Text>
            <Text style={styles.scanText}>{t('cnic.scan')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.orText}>{t('cnic.manual')}</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={t('cnic.placeholder')}
            value={cnic}
            onChangeText={(text) => setCnic(formatCNIC(text))}
            keyboardType="numeric"
            maxLength={15}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerifyCNIC}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.secondary} />
            ) : (
              <Text style={styles.buttonText}>{t('cnic.verify')} →</Text>
            )}
          </TouchableOpacity>
        </View>
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
    color: colors.text
  },
  scanContainer: {
    marginBottom: 24
  },
  scanButton: {
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  scanIcon: {
    fontSize: 48,
    marginBottom: 8
  },
  scanText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: 'bold'
  },
  orText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24
  },
  inputContainer: {
    flex: 1
  },
  input: {
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
    backgroundColor: colors.secondary
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
  }
});

export default CNICVerificationScreen;