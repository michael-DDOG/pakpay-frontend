// screens/TwoFactorAuthScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import api from '../services/api';

const TwoFactorAuthScreen = ({ navigation, route }) => {
  const { 
    transactionData, 
    onSuccess,
    reason,
    amount 
  } = route.params;
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const inputRefs = useRef([]);

  useEffect(() => {
    sendOTP();
    
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const sendOTP = async () => {
    try {
      const response = await api.post('/auth/2fa/generate', {
        transactionRef: transactionData.transactionRef,
        method: 'SMS'
      });
      
      if (response.data.success) {
        Alert.alert('OTP Sent', 'Verification code sent to your registered mobile number');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP');
    }
  };

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when all digits entered
    if (index === 5 && value) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === 6) {
        verifyOTP(fullOtp);
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOTP = async (otpCode = otp.join('')) => {
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter complete 6-digit code');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/auth/2fa/verify', {
        otp: otpCode,
        transactionRef: transactionData.transactionRef
      });
      
      if (response.data.success) {
        // Call the original transaction with 2FA token
        const result = await onSuccess(response.data.token);
        
        if (result.success) {
          Alert.alert(
            'Success',
            'Transaction completed successfully',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    setResending(true);
    try {
      await sendOTP();
      setCountdown(300);
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getReasonText = () => {
    switch (reason) {
      case 'high_value_transaction':
        return `This transaction of PKR ${amount.toLocaleString()} requires additional verification`;
      case 'high_risk_profile':
        return 'Your account requires additional verification for this transaction';
      case 'international_transaction':
        return 'International transactions require additional verification';
      default:
        return 'This transaction requires additional verification';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Verify Transaction</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.body}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🔐</Text>
          </View>

          <Text style={styles.reasonText}>{getReasonText()}</Text>

          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to your registered mobile number
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => inputRefs.current[index] = ref}
                style={styles.otpInput}
                value={digit}
                onChangeText={value => handleOtpChange(value, index)}
                onKeyPress={e => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {countdown > 0 ? (
            <Text style={styles.timerText}>
              Code expires in {formatTime(countdown)}
            </Text>
          ) : (
            <Text style={styles.expiredText}>Code expired</Text>
          )}

          <TouchableOpacity
            style={[styles.verifyButton, loading && styles.buttonDisabled]}
            onPress={() => verifyOTP()}
            disabled={loading || countdown === 0}
          >
            {loading ? (
              <ActivityIndicator color={colors.secondary} />
            ) : (
              <Text style={styles.verifyButtonText}>Verify & Continue</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendButton}
            onPress={resendOTP}
            disabled={resending || countdown > 240} // Can resend after 1 minute
          >
            {resending ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={[
                styles.resendText,
                countdown > 240 && styles.resendTextDisabled
              ]}>
                {countdown > 240 ? `Resend in ${formatTime(countdown - 240)}` : 'Resend Code'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.securityNote}>
            <Text style={styles.securityIcon}>⚠️</Text>
            <Text style={styles.securityText}>
              Never share this code with anyone. PakPay staff will never ask for your OTP.
            </Text>
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
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  backButton: {
    ...typography.body,
    color: colors.error
  },
  title: {
    ...typography.h3,
    color: colors.text
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center'
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24
  },
  icon: {
    fontSize: 40
  },
  reasonText: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 300,
    marginBottom: 16
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    fontSize: 24,
    textAlign: 'center',
    backgroundColor: colors.secondary
  },
  timerText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 32
  },
  expiredText: {
    ...typography.caption,
    color: colors.error,
    marginBottom: 32
  },
  verifyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16
  },
  buttonDisabled: {
    opacity: 0.7
  },
  verifyButtonText: {
    ...typography.body,
    color: colors.secondary,
    fontWeight: 'bold',
    fontSize: 16
  },
  resendButton: {
    paddingVertical: 12
  },
  resendText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600'
  },
  resendTextDisabled: {
    color: colors.textSecondary
  },
  securityNote: {
    flexDirection: 'row',
    backgroundColor: colors.accent + '20',
    padding: 16,
    borderRadius: 8,
    marginTop: 40,
    borderWidth: 1,
    borderColor: colors.accent
  },
  securityIcon: {
    fontSize: 20,
    marginRight: 12
  },
  securityText: {
    ...typography.caption,
    color: colors.text,
    flex: 1
  }
});

export default TwoFactorAuthScreen;
