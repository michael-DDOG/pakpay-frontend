import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import api from '../services/api';

const BillPaymentScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('utility'); // utility, mobile, internet
  const [billers, setBillers] = useState([]);
  const [selectedBiller, setSelectedBiller] = useState(null);
  const [consumerNumber, setConsumerNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [billDetails, setBillDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Predefined amounts for mobile top-up
  const topupAmounts = [100, 300, 500, 1000];

  useEffect(() => {
    loadBillers();
  }, [activeTab]);

  const loadBillers = async () => {
    try {
      const response = await api.get(`/bills/billers?type=${activeTab === 'utility' ? 'electricity' : activeTab}`);
      setBillers(response.data.billers);
    } catch (error) {
      console.error('Load billers error:', error);
    }
  };

  const validateBill = async () => {
    if (!selectedBiller || !consumerNumber) {
      Alert.alert('Error', 'Please select a biller and enter consumer number');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/bills/validate', {
        billerCode: selectedBiller.code,
        consumerNumber
      });
      
      setBillDetails(response.data.bill);
      setAmount(response.data.bill.amountDue.toString());
      setModalVisible(true);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to fetch bill');
    } finally {
      setLoading(false);
    }
  };

  const payBill = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/bills/pay', {
        billerCode: selectedBiller.code,
        consumerNumber: consumerNumber || mobileNumber,
        amount: parseFloat(amount)
      });

      Alert.alert(
        'Success',
        `Payment successful!\nReference: ${response.data.paymentRef}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setModalVisible(false);
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMobileTopup = async () => {
    if (!selectedBiller || !mobileNumber || !amount) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/bills/topup', {
        mobileNumber,
        operator: selectedBiller.code,
        amount: parseFloat(amount)
      });

      Alert.alert(
        'Success',
        `Top-up successful!\nReference: ${response.data.paymentRef}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Top-up failed');
    } finally {
      setLoading(false);
    }
  };

  const renderBillerItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.billerItem,
        selectedBiller?.code === item.code && styles.billerItemSelected
      ]}
      onPress={() => setSelectedBiller(item)}
    >
      <Text style={styles.billerName}>{item.name}</Text>
      {selectedBiller?.code === item.code && (
        <Text style={styles.checkmark}>✓</Text>
      )}
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    if (activeTab === 'mobile') {
      return (
        <View style={styles.tabContent}>
          <Text style={styles.sectionTitle}>Select Operator</Text>
          <FlatList
            data={billers}
            renderItem={renderBillerItem}
            keyExtractor={(item) => item.code}
            style={styles.billerList}
          />

          {selectedBiller && (
            <>
              <Text style={styles.label}>Mobile Number</Text>
              <View style={styles.phoneInput}>
                <Text style={styles.countryCode}>+92</Text>
                <TextInput
                  style={styles.input}
                  placeholder="3XX XXX XXXX"
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  keyboardType="phone-pad"
                  maxLength={11}
                />
              </View>

              <Text style={styles.label}>Select Amount</Text>
              <View style={styles.amountGrid}>
                {topupAmounts.map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={[
                      styles.amountButton,
                      amount === amt.toString() && styles.amountButtonSelected
                    ]}
                    onPress={() => setAmount(amt.toString())}
                  >
                    <Text style={[
                      styles.amountButtonText,
                      amount === amt.toString() && styles.amountButtonTextSelected
                    ]}>
                      PKR {amt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Or Enter Amount</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="Enter amount"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={[styles.payButton, loading && styles.buttonDisabled]}
                onPress={handleMobileTopup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.secondary} />
                ) : (
                  <Text style={styles.payButtonText}>Top Up Now</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      );
    }

    // Utility and Internet bills
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>
          Select {activeTab === 'utility' ? 'Utility Provider' : 'Internet Provider'}
        </Text>
        <FlatList
          data={billers}
          renderItem={renderBillerItem}
          keyExtractor={(item) => item.code}
          style={styles.billerList}
        />

        {selectedBiller && (
          <>
            <Text style={styles.label}>Consumer Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter consumer/account number"
              value={consumerNumber}
              onChangeText={setConsumerNumber}
            />

            <TouchableOpacity
              style={[styles.validateButton, loading && styles.buttonDisabled]}
              onPress={validateBill}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={styles.validateButtonText}>Fetch Bill</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bill Payments</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'utility' && styles.tabActive]}
          onPress={() => setActiveTab('utility')}
        >
          <Text style={[styles.tabText, activeTab === 'utility' && styles.tabTextActive]}>
            Utility
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'mobile' && styles.tabActive]}
          onPress={() => setActiveTab('mobile')}
        >
          <Text style={[styles.tabText, activeTab === 'mobile' && styles.tabTextActive]}>
            Mobile
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'internet' && styles.tabActive]}
          onPress={() => setActiveTab('internet')}
        >
          <Text style={[styles.tabText, activeTab === 'internet' && styles.tabTextActive]}>
            Internet
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {renderTabContent()}
      </ScrollView>

      {/* Bill Payment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Bill Details</Text>
            
            {billDetails && (
              <>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Biller:</Text>
                  <Text style={styles.billValue}>{billDetails.billerName}</Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Consumer:</Text>
                  <Text style={styles.billValue}>{billDetails.consumerNumber}</Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Bill Month:</Text>
                  <Text style={styles.billValue}>{billDetails.billMonth}</Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Due Date:</Text>
                  <Text style={styles.billValue}>
                    {new Date(billDetails.dueDate).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Amount Due:</Text>
                  <Text style={styles.billAmount}>PKR {billDetails.amountDue}</Text>
                </View>

                <TextInput
                  style={styles.amountInput}
                  placeholder="Enter amount to pay"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.payButton, loading && styles.buttonDisabled]}
                    onPress={payBill}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.secondary} />
                    ) : (
                      <Text style={styles.payButtonText}>Pay Now</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  content: {
    flex: 1
  },
  tabContent: {
    padding: 24
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16
  },
  billerList: {
    maxHeight: 200,
    marginBottom: 20
  },
  billerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  billerItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.background
  },
  billerName: {
    ...typography.body,
    color: colors.text
  },
  checkmark: {
    color: colors.primary,
    fontSize: 20
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
    marginBottom: 16,
    backgroundColor: colors.secondary
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
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
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  amountButton: {
    width: '48%',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: colors.secondary
  },
  amountButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  amountButtonText: {
    ...typography.body,
    color: colors.text
  },
  amountButtonTextSelected: {
    color: colors.secondary,
    fontWeight: 'bold'
  },
  amountInput: {
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    backgroundColor: colors.secondary
  },
  validateButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary
  },
  validateButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold'
  },
  payButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  payButtonText: {
    color: colors.secondary,
    fontSize: 18,
    fontWeight: 'bold'
  },
  buttonDisabled: {
    opacity: 0.7
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
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  billLabel: {
    ...typography.body,
    color: colors.textSecondary
  },
  billValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500'
  },
  billAmount: {
    ...typography.body,
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 18
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
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
  }
});

export default BillPaymentScreen;
