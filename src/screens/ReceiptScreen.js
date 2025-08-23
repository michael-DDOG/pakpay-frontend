// screens/ReceiptScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Share,
  Alert,
  ActivityIndicator
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import api from '../services/api';

const ReceiptScreen = ({ navigation, route }) => {
  const { transactionRef, transaction } = route.params;
  const [loading, setLoading] = useState(true);
  const [receiptHtml, setReceiptHtml] = useState('');
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    loadReceipt();
  }, []);

  const loadReceipt = async () => {
    try {
      const response = await api.get(`/receipts/html/${transactionRef}`);
      setReceiptHtml(response.data.html);
      setReceiptData(response.data.transaction);
    } catch (error) {
      console.error('Load receipt error:', error);
      Alert.alert('Error', 'Failed to load receipt');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      setLoading(true);
      
      // Get PDF from backend
      const response = await api.get(`/receipts/pdf/${transactionRef}`, {
        responseType: 'blob'
      });
      
      // Save to device
      const fileUri = `${FileSystem.documentDirectory}receipt_${transactionRef}.pdf`;
      await FileSystem.writeAsStringAsync(fileUri, response.data, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save Receipt'
        });
      } else {
        Alert.alert('Success', 'Receipt saved to device');
      }
      
    } catch (error) {
      console.error('Download PDF error:', error);
      Alert.alert('Error', 'Failed to download receipt');
    } finally {
      setLoading(false);
    }
  };

  const shareReceipt = async () => {
    try {
      const message = `
PakPay Transaction Receipt
${receiptData?.entry_type === 'debit' ? 'Sent' : 'Received'}: PKR ${parseFloat(receiptData?.amount || 0).toLocaleString()}
Transaction ID: ${transactionRef}
Date: ${new Date(receiptData?.created_at).toLocaleDateString()}

Download the PakPay app for easy money transfers!
      `;
      
      await Share.share({
        message,
        title: 'Transaction Receipt'
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const getStatusColor = () => {
    return receiptData?.entry_type === 'debit' ? colors.error : colors.success;
  };

  const getStatusText = () => {
    return receiptData?.entry_type === 'debit' ? 'PAYMENT SENT' : 'PAYMENT RECEIVED';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading receipt...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Transaction Receipt</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={downloadPDF}>
          <Text style={styles.actionIcon}>📥</Text>
          <Text style={styles.actionText}>Download</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={shareReceipt}>
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => Alert.alert('Coming Soon', 'Email feature coming soon!')}
        >
          <Text style={styles.actionIcon}>📧</Text>
          <Text style={styles.actionText}>Email</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.receiptContainer}>
        <WebView
          source={{ html: receiptHtml }}
          style={styles.webView}
          scalesPageToFit={true}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Receipt generated on {new Date().toLocaleDateString()}
        </Text>
      </View>
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
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 16
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
    ...typography.h3,
    color: colors.text
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: colors.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  actionButton: {
    alignItems: 'center',
    padding: 8
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 4
  },
  actionText: {
    ...typography.caption,
    color: colors.text
  },
  receiptContainer: {
    flex: 1,
    margin: 16,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  webView: {
    flex: 1
  },
  footer: {
    padding: 16,
    alignItems: 'center'
  },
  footerText: {
    ...typography.caption,
    color: colors.textSecondary
  }
});

export default ReceiptScreen;
