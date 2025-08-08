// src/screens/CNICVerificationScreen.js
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
import { Camera } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import { authService } from '../services/authService';
import AuthContext from '../context/AuthContext';

const CNICVerificationScreen = ({ navigation, route } ) => {
  const { t } = useTranslation();
  const { signIn } = useContext(AuthContext);
  const { phoneNumber } = route.params;
  
  const [cnic, setCnic] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);

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

  const handleScanCNIC = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
    
    if (status === 'granted') {
      setShowCamera(true);
    } else {
      Alert.alert('Permission Denied', 'Camera permission is required to scan CNIC');
    }
  };

  const handleVerifyCNIC = async () => {
    if (!validateCNIC(cnic)) {
      Alert.alert('Error', t('cnic.invalid'));
      return;
    }

    setLoading(true);
    try {
      // Complete registration with backend
      const registrationData = {
        phoneNumber,
        cnic,
        password: 'TempPassword123', // In production, add password screen
        firstName: 'Test', // In production, add user details screen
        lastName: 'User',
        email: 'test@example.com'
      };
      
      const response = await authService.register(registrationData);
      
      // Sign in the user
      await signIn(response.token, response.user);
      
      // Navigate to dashboard
      navigation.reset({
        index: 0,
        routes: [{ name: 'Dashboard' }],
      });
    } catch (error) {
      Alert.alert('Error', error.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <Camera style={styles.camera} type={Camera.Constants.Type.back}>
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraFrame} />
            <Text style={styles.cameraText}>Point at CNIC</Text>
            
            <TouchableOpacity
              style={styles.closeCameraButton}
              onPress={() => setShowCamera(false)}
            >
              <Text style={styles.closeCameraText}>✕ Close</Text>
            </TouchableOpacity>
          </View>
        </Camera>
      </View>
    );
  }

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
  },
  cameraContainer: {
    flex: 1
  },
  camera: {
    flex: 1
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cameraFrame: {
    width: 300,
    height: 180,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderRadius: 8,
    marginBottom: 24
  },
  cameraText: {
    color: colors.secondary,
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4
  },
  closeCameraButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4
  },
  closeCameraText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default CNICVerificationScreen;

// src/screens/DashboardScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import { walletService } from '../services/walletService';
import AuthContext from '../context/AuthContext';
import LanguageToggle from '../components/LanguageToggle';

const DashboardScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { userData, signOut } = useContext(AuthContext);
  
  const [balance, setBalance] = useState(null);
  const [showBalance, setShowBalance] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [balanceData, transactionsData] = await Promise.all([
        walletService.getBalance(),
        walletService.getTransactions(5, 0)
      ]);
      
      setBalance(balanceData.balance);
      setTransactions(transactionsData.transactions);
    } catch (error) {
      console.error('Load dashboard error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const formatAmount = (amount) => {
    if (!showBalance) {
      return '••••••';
    }
    return `${t('common.pkr')} ${parseFloat(amount).toLocaleString('en-PK')}`;
  };

  const getTransactionSign = (transaction) => {
    return transaction.isSender ? '-' : '+';
  };

  const getTransactionColor = (transaction) => {
    return transaction.isSender ? colors.error : colors.success;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return t('dashboard.today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('dashboard.yesterday');
    }
    
    return date.toLocaleDateString('en-PK');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => console.log('Menu')}>
              <Text style={styles.menuIcon}>☰</Text>
            </TouchableOpacity>
            
            <LanguageToggle />
            
            <TouchableOpacity onPress={() => console.log('Notifications')}>
              <View style={styles.notificationIcon}>
                <Text style={styles.bellIcon}>🔔</Text>
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>2</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.greeting}>
            {t('dashboard.goodMorning')}, {userData?.firstName || 'User'}
          </Text>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t('dashboard.yourBalance')}</Text>
          <Text style={styles.balanceAmount}>{formatAmount(balance)}</Text>
          
          <TouchableOpacity
            style={styles.toggleBalance}
            onPress={() => setShowBalance(!showBalance)}
          >
            <Text style={styles.toggleText}>
              👁 {showBalance ? t('dashboard.hideBalance') : t('dashboard.showBalance')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>↗</Text>
            </View>
            <Text style={styles.actionText}>{t('dashboard.send')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>↙</Text>
            </View>
            <Text style={styles.actionText}>{t('dashboard.receive')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>{t('dashboard.recentTransactions')}</Text>
          
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <TouchableOpacity
                key={transaction.id}
                style={styles.transactionItem}
                activeOpacity={0.7}
              >
                <View style={styles.transactionLeft}>
                  <Text style={styles.transactionSign}>
                    {getTransactionSign(transaction)}
                  </Text>
                  <View>
                    <Text style={styles.transactionName}>
                      {transaction.counterparty}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatDate(transaction.createdAt)}
                    </Text>
                  </View>
                </View>
                
                <Text
                  style={[
                    styles.transactionAmount,
                    { color: getTransactionColor(transaction) }
                  ]}
                >
                  {getTransactionSign(transaction)} {t('common.pkr')} {transaction.amount}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noTransactions}>No recent transactions</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={signOut}
        >
          <Text style={styles.signOutText}>Sign Out (Dev)</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    flex: 1
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 24
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  menuIcon: {
    fontSize: 24,
    color: colors.text
  },
  notificationIcon: {
    position: 'relative'
  },
  bellIcon: {
    fontSize: 24
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  badgeText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: 'bold'
  },
  greeting: {
    ...typography.h2,
    color: colors.text
  },
  balanceCard: {
    backgroundColor: colors.primary,
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center'
  },
  balanceLabel: {
    ...typography.body,
    color: colors.secondary,
    opacity: 0.9,
    marginBottom: 8
  },
  balanceAmount: {
    ...typography.h1,
    color: colors.secondary,
    fontWeight: 'bold',
    marginBottom: 16
  },
  toggleBalance: {
    paddingVertical: 8,
    paddingHorizontal: 16
  },
  toggleText: {
    ...typography.caption,
    color: colors.secondary
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 32,
    justifyContent: 'space-between'
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    marginHorizontal: 8,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  actionIcon: {
    fontSize: 24,
    color: colors.primary
  },
  actionText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600'
  },
  transactionsSection: {
    paddingHorizontal: 24,
    marginBottom: 24
  },
  sectionTitle: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 16
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  transactionSign: {
    fontSize: 20,
    marginRight: 12,
    fontWeight: 'bold'
  },
  transactionName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500'
  },
  transactionDate: {
    ...typography.caption,
    color: colors.textSecondary
  },
  transactionAmount: {
    ...typography.body,
    fontWeight: 'bold'
  },
  noTransactions: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 32
  },
  signOutButton: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 16,
    backgroundColor: colors.error,
    borderRadius: 8,
    alignItems: 'center'
  },
  signOutText: {
    color: colors.secondary,
    fontWeight: 'bold'
  }
});

export default DashboardScreen;
