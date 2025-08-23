// screens/QRScannerScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { CameraScreen } from 'react-native-camera-kit';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import api from '../services/api';

const QRScannerScreen = ({ navigation }) => {
  const [scanned, setScanned] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQRCodeRead = (event) => {
    if (!scanned) {
      setScanned(true);
      try {
        const data = JSON.parse(event.nativeEvent.codeStringValue);
        
        // Validate QR code
        if (data.type && data.type.startsWith('PAKPAY_')) {
          setQrData(data);
          
          // If QR has fixed amount, use it
          if (data.data.amount) {
            setAmount(data.data.amount.toString());
            handlePayment(data, data.data.amount);
          } else {
            // Show modal to enter amount
            setModalVisible(true);
          }
        } else {
          Alert.alert('Invalid QR Code', 'This is not a valid PakPay QR code');
          setTimeout(() => setScanned(false), 2000);
        }
      } catch (error) {
        Alert.alert('Invalid QR Code', 'Could not read QR code');
        setTimeout(() => setScanned(false), 2000);
      }
    }
  };

  const handlePayment = async (qrPayload, paymentAmount) => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/qrcode/pay', {
        qrData: qrPayload,
        amount: parseFloat(paymentAmount)
      });

      Alert.alert(
        'Payment Successful',
        `Paid PKR ${paymentAmount} to ${response.data.receiverName}\nTransaction ID: ${response.data.transactionRef}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Payment Failed', error.response?.data?.error || 'Transaction failed');
      setScanned(false);
    } finally {
      setLoading(false);
      setModalVisible(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Scan QR Code</Text>
        <View style={{ width: 40 }} />
      </View>

      <CameraScreen
        style={styles.camera}
        scanBarcode={true}
        onReadCode={handleQRCodeRead}
        showFrame={true}
        laserColor={colors.primary}
        frameColor={colors.secondary}
      />

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          Point your camera at a PakPay QR code
        </Text>
      </View>

      {/* Amount Input Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Amount</Text>
            
            {qrData && (
              <View style={styles.qrInfo}>
                <Text style={styles.qrInfoLabel}>Paying to:</Text>
                <Text style={styles.qrInfoValue}>
                  {qrData.data.receiverName || qrData.data.merchantName}
                </Text>
                <Text style={styles.qrInfoPhone}>
                  {qrData.data.receiverPhone || qrData.data.merchantPhone}
                </Text>
              </View>
            )}

            <TextInput
              style={styles.amountInput}
              placeholder="Enter amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setScanned(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.payButton, loading && styles.buttonDisabled]}
                onPress={() => handlePayment(qrData, amount)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.secondary} />
                ) : (
                  <Text style={styles.payButtonText}>Pay Now</Text>
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
    backgroundColor: '#000'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10
  },
  backButton: {
    padding: 4
  },
  backText: {
    color: colors.secondary,
    fontSize: 28
  },
  title: {
    ...typography.h3,
    color: colors.secondary
  },
  camera: {
    flex: 1
  },
  instructions: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center'
  },
  instructionText: {
    ...typography.body,
    color: colors.secondary,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20
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
    marginBottom: 20,
    textAlign: 'center'
  },
  qrInfo: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: colors.secondary,
    borderRadius: 8
  },
  qrInfoLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4
  },
  qrInfoValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: 'bold'
  },
  qrInfoPhone: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4
  },
  amountInput: {
    ...typography.h2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    backgroundColor: colors.secondary,
    fontSize: 24,
    textAlign: 'center'
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between'
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
  payButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: colors.primary
  },
  payButtonText: {
    ...typography.body,
    color: colors.secondary,
    fontWeight: 'bold'
  },
  buttonDisabled: {
    opacity: 0.7
  }
});

export default QRScannerScreen;
