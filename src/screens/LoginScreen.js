// src/screens/LoginScreen.js
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
import api from '../services/api';
import AuthContext from '../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { signIn } = useContext(AuthContext);
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validatePhoneNumber = (number) => {
    const phoneRegex = /^((\+92)|(0092)|(0))(3)([0-9]{9})$/;
    return phoneRegex.test(number);
  };

  const formatPhoneNumber = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.startsWith('92')) {
      return cleaned.substring(2);
    }
    return cleaned;
  };

  const handleLogin = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid Pakistani phone number');
      return;
    }

    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        phoneNumber,
        password
      });

      if (response.data.token) {
        await signIn(response.data.token, response.data.user);
        
        // Navigate to Dashboard and reset the navigation stack
        navigation.reset({
          index: 0,
          routes: [{ name: 'Dashboard' }],
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Failed',
        error.response?.data?.error || 'Invalid phone number or password'
      );
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill for testing (remove in production)
  const fillTestCredentials = () => {
    setPhoneNumber('03123456789');
    setPassword('TempPassword123');
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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
          
          {/* Test button - remove in production */}
          <TouchableOpacity onPress={fillTestCredentials} style={styles.testButton}>
            <Text style={styles.testText}>Fill Test Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {/* Phone Number Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
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
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Text>{showPassword ? '👁' : '👁‍🗨'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.secondary} />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotButton}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('PhoneRegistration')}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 32
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: 8
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary
  },
  testButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: colors.accent,
    borderRadius: 4,
    alignSelf: 'flex-start'
  },
  testText: {
    fontSize: 12,
    color: colors.secondary
  },
  form: {
    flex: 1
  },
  inputContainer: {
    marginBottom: 20
  },
  label: {
    ...typography.caption,
    color: colors.text,
    marginBottom: 8,
    fontWeight: '600'
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.secondary
  },
  passwordInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: 16
  },
  eyeButton: {
    padding: 8
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24
  },
  buttonDisabled: {
    opacity: 0.7
  },
  buttonText: {
    color: colors.secondary,
    fontSize: 18,
    fontWeight: 'bold'
  },
  forgotButton: {
    alignItems: 'center',
    marginTop: 16
  },
  forgotText: {
    ...typography.body,
    color: colors.primary
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32
  },
  registerText: {
    ...typography.body,
    color: colors.textSecondary
  },
  registerLink: {
    ...typography.body,
    color: colors.primary,
    fontWeight: 'bold'
  }
});

export default LoginScreen;
