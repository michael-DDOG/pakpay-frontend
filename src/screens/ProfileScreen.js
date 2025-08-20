import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
  Switch,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import api from '../services/api';

const ProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [changePinModal, setChangePinModal] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [savingPin, setSavingPin] = useState(false);
  
  // Settings states
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    loadUserData();
    loadSettings();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
      
      // Get fresh data from server
      const response = await api.get('/auth/profile');
      setUser(response.data.user);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    } catch (error) {
      console.error('Load user error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const biometric = await AsyncStorage.getItem('biometric_enabled');
      const notifications = await AsyncStorage.getItem('notifications_enabled');
      const twoFactor = await AsyncStorage.getItem('two_factor_enabled');
      
      setBiometricEnabled(biometric === 'true');
      setNotificationsEnabled(notifications !== 'false');
      setTwoFactorEnabled(twoFactor === 'true');
    } catch (error) {
      console.error('Load settings error:', error);
    }
  };

  const handleChangePin = async () => {
    if (!currentPin || !newPin || !confirmPin) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert('Error', 'New PIN and confirmation do not match');
      return;
    }

    if (newPin.length !== 4) {
      Alert.alert('Error', 'PIN must be 4 digits');
      return;
    }

    setSavingPin(true);
    try {
      await api.post('/auth/change-pin', {
        currentPin,
        newPin
      });

      Alert.alert('Success', 'PIN changed successfully');
      setChangePinModal(false);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to change PIN');
    } finally {
      setSavingPin(false);
    }
  };

  const toggleBiometric = async (value) => {
    setBiometricEnabled(value);
    await AsyncStorage.setItem('biometric_enabled', value.toString());
    
    if (value) {
      Alert.alert('Biometric Login', 'Biometric login has been enabled');
    }
  };

  const toggleNotifications = async (value) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notifications_enabled', value.toString());
  };

  const toggleTwoFactor = async (value) => {
    setTwoFactorEnabled(value);
    await AsyncStorage.setItem('two_factor_enabled', value.toString());
    
    if (value) {
      Alert.alert('2FA Enabled', 'Two-factor authentication has been enabled');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        }
      ]
    );
  };

  const getKYCLevelText = (level) => {
    switch(level) {
      case 0: return 'Unverified';
      case 1: return 'Basic';
      case 2: return 'Enhanced';
      case 3: return 'Full KYC';
      default: return 'Basic';
    }
  };

  const getKYCLevelColor = (level) => {
    switch(level) {
      case 0: return '#ef4444';
      case 1: return '#f59e0b';
      case 2: return '#3b82f6';
      case 3: return '#10b981';
      default: return '#f59e0b';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Profile & Settings</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Text style={styles.editAvatarText}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userPhone}>{user?.phone}</Text>
          
          <View style={styles.kycBadge}>
            <View style={[styles.kycDot, { backgroundColor: getKYCLevelColor(user?.kyc_level) }]} />
            <Text style={styles.kycText}>KYC Level: {getKYCLevelText(user?.kyc_level)}</Text>
          </View>

          {user?.kyc_level < 3 && (
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={() => navigation.navigate('KYCUpgrade')}
            >
              <Text style={styles.upgradeButtonText}>Upgrade Account</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Account Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue}>{user?.name}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone Number</Text>
            <Text style={styles.infoValue}>{user?.phone}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || 'Not set'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>CNIC</Text>
            <Text style={styles.infoValue}>{user?.cnic?.replace(/(\d{5})(\d{7})(\d)/, '$1-****-$3')}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Number</Text>
            <Text style={styles.infoValue}>{user?.account_number}</Text>
          </View>
        </View>

        {/* Security Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <TouchableOpacity style={styles.settingRow} onPress={() => setChangePinModal(true)}>
            <Text style={styles.settingLabel}>Change PIN</Text>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Biometric Login</Text>
            <Switch
              value={biometricEnabled}
              onValueChange={toggleBiometric}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.secondary}
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Two-Factor Authentication</Text>
            <Switch
              value={twoFactorEnabled}
              onValueChange={toggleTwoFactor}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.secondary}
            />
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.secondary}
            />
          </View>
          
          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>Language</Text>
            <Text style={styles.settingValue}>English →</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction Limits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Limits</Text>
          
          <View style={styles.limitRow}>
            <Text style={styles.limitLabel}>Daily Limit</Text>
            <Text style={styles.limitValue}>PKR {user?.daily_limit?.toLocaleString() || '50,000'}</Text>
          </View>
          
          <View style={styles.limitRow}>
            <Text style={styles.limitLabel}>Monthly Limit</Text>
            <Text style={styles.limitValue}>PKR {user?.monthly_limit?.toLocaleString() || '200,000'}</Text>
          </View>
          
          <View style={styles.limitRow}>
            <Text style={styles.limitLabel}>Per Transaction</Text>
            <Text style={styles.limitValue}>PKR {user?.per_transaction_limit?.toLocaleString() || '25,000'}</Text>
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>Help Center</Text>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>Terms of Service</Text>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>About</Text>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Change PIN Modal */}
      <Modal
        visible={changePinModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setChangePinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change PIN</Text>
            
            <TextInput
              style={styles.pinInput}
              placeholder="Current PIN"
              value={currentPin}
              onChangeText={setCurrentPin}
              keyboardType="numeric"
              secureTextEntry
              maxLength={4}
            />
            
            <TextInput
              style={styles.pinInput}
              placeholder="New PIN"
              value={newPin}
              onChangeText={setNewPin}
              keyboardType="numeric"
              secureTextEntry
              maxLength={4}
            />
            
            <TextInput
              style={styles.pinInput}
              placeholder="Confirm New PIN"
              value={confirmPin}
              onChangeText={setConfirmPin}
              keyboardType="numeric"
              secureTextEntry
              maxLength={4}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setChangePinModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.saveButton, savingPin && styles.buttonDisabled]}
                onPress={handleChangePin}
                disabled={savingPin}
              >
                {savingPin ? (
                  <ActivityIndicator color={colors.secondary} />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
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
    color: colors.primary
  },
  title: {
    ...typography.h2,
    color: colors.text
  },
  content: {
    flex: 1
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: colors.secondary,
    marginBottom: 16
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    fontSize: 40,
    color: colors.secondary,
    fontWeight: 'bold'
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  editAvatarText: {
    ...typography.caption,
    color: colors.primary
  },
  userName: {
    ...typography.h2,
    color: colors.text,
    marginBottom: 4
  },
  userPhone: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 12
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12
  },
  kycDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8
  },
  kycText: {
    ...typography.caption,
    color: colors.text
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20
  },
  upgradeButtonText: {
    ...typography.body,
    color: colors.secondary,
    fontWeight: 'bold'
  },
  section: {
    backgroundColor: colors.secondary,
    marginBottom: 16,
    paddingVertical: 16
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text,
    paddingHorizontal: 24,
    marginBottom: 16
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  infoLabel: {
    ...typography.body,
    color: colors.textSecondary
  },
  infoValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500'
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  settingLabel: {
    ...typography.body,
    color: colors.text
  },
  settingValue: {
    ...typography.body,
    color: colors.textSecondary
  },
  settingArrow: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 20
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12
  },
  limitLabel: {
    ...typography.body,
    color: colors.textSecondary
  },
  limitValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: 'bold'
  },
  logoutButton: {
    backgroundColor: colors.error,
    marginHorizontal: 24,
    marginVertical: 24,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  logoutText: {
    ...typography.body,
    color: colors.secondary,
    fontWeight: 'bold',
    fontSize: 16
  },
  bottomSpace: {
    height: 50
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 24
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center'
  },
  pinInput: {
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    backgroundColor: colors.secondary,
    textAlign: 'center',
    fontSize: 18
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.text
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: colors.primary
  },
  saveButtonText: {
    ...typography.body,
    color: colors.secondary,
    fontWeight: 'bold'
  },
  buttonDisabled: {
    opacity: 0.7
  }
});

export default ProfileScreen;
