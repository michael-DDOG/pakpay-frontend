// screens/QRCodeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert,
  Share,
  ScrollView
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import api from '../services/api';

const QRCodeScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('receive'); // receive, scan
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qrCodeRef, setQrCodeRef] = useState(null);

  const generateQRCode = async () => {
    setLoading(true);
    try {
      const response = await api.post('/qrcode/generate', {
        amount: amount || null,
        description
      });
      
      setQrData(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const shareQRCode = async () => {
    try {
      await Share.share({
        message: `Pay me PKR ${amount || 'any amount'} using PakPay QR Code`,
        title: 'PakPay Payment Request'
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleScanQR = () => {
    navigation.navigate('QRScanner');
  };

  const renderReceiveTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Generate QR Code to Receive Money</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Amount (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter amount or leave empty"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="What's this payment for?"
          value={description}
          onChangeText={setDescription}
        />
      </View>
      
      <TouchableOpacity
        style={[styles.generateButton, loading && styles.buttonDisabled]}
        onPress={generateQRCode}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.secondary} />
        ) : (
          <Text style={styles.generateButtonText}>Generate QR Code</Text>
        )}
      </TouchableOpacity>
      
      {qrData && (
        <View style={styles.qrContainer}>
          <View style={styles.qrBox}>
            <QRCode
              value={JSON.stringify(qrData.payload)}
              size={250}
              color={colors.text}
              backgroundColor={colors.secondary}
              getRef={setQrCodeRef}
            />
          </View>
          
          <Text style={styles.qrAmount}>
            {amount ? `PKR ${parseFloat(amount).toLocaleString()}` : 'Any Amount'}
          </Text>
          
          <Text style={styles.qrDescription}>
            {description || 'Payment Request'}
          </Text>
          
          <Text style={styles.qrExpiry}>
            Expires in 5 minutes
          </Text>
          
          <View style={styles.qrActions}>
            <TouchableOpacity style={styles.shareButton} onPress={shareQRCode}>
              <Text style={styles.shareButtonText}>Share QR</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.newQRButton} onPress={generateQRCode}>
              <Text style={styles.newQRButtonText}>New QR</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderScanTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Scan QR Code to Send Money</Text>
      
      <TouchableOpacity style={styles.scanButton} onPress={handleScanQR}>
        <Text style={styles.scanIcon}>📷</Text>
        <Text style={styles.scanText}>Tap to Scan QR Code</Text>
      </TouchableOpacity>
      
      <Text style={styles.orText}>OR</Text>
      
      <TouchableOpacity style={styles.galleryButton}>
        <Text style={styles.galleryText}>Select from Gallery</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>QR Payment</Text>
        <View style={{ width: 50 }} />
      </View>
      
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'receive' && styles.tabActive]}
          onPress={() => setActiveTab('receive')}
        >
          <Text style={[styles.tabText, activeTab === 'receive' && styles.tabTextActive]}>
            Receive
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'scan' && styles.tabActive]}
          onPress={() => setActiveTab('scan')}
        >
          <Text style={[styles.tabText, activeTab === 'scan' && styles.tabTextActive]}>
            Scan & Pay
          </Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'receive' ? renderReceiveTab() : renderScanTab()}
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
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.secondary
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8
  },
  tabActive: {
    backgroundColor: colors.primary
  },
  tabText: {
    ...typography.body,
    color: colors.textSecondary
  },
  tabTextActive: {
    color: colors.secondary,
    fontWeight: 'bold'
  },
  tabContent: {
    flex: 1,
    padding: 24
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20
  },
  inputContainer: {
    marginBottom: 16
  },
  label: {
    ...typography.caption,
    color: colors.text,
    marginBottom: 8,
    fontWeight: '600'
  },
  input: {
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.secondary
  },
  generateButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8
  },
  generateButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: 'bold'
  },
  buttonDisabled: {
    opacity: 0.7
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: 24
  },
  qrBox: {
    padding: 20,
    backgroundColor: colors.secondary,
    borderRadius: 16,
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  qrAmount: {
    ...typography.h2,
    color: colors.primary,
    marginTop: 16,
    fontWeight: 'bold'
  },
  qrDescription: {
    ...typography.body,
    color: colors.text,
    marginTop: 8
  },
  qrExpiry: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 8
  },
  qrActions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12
  },
  shareButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  shareButtonText: {
    color: colors.secondary,
    fontWeight: 'bold'
  },
  newQRButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary
  },
  newQRButtonText: {
    color: colors.primary,
    fontWeight: 'bold'
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
    marginVertical: 20
  },
  galleryButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  galleryText: {
    ...typography.body,
    color: colors.text
  }
});

export default QRCodeScreen;
