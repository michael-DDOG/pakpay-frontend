import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StatusBar, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import api from '../services/api';

const TransferScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [recipientPhone, setRecipientPhone] = useState('');
  const [amount, setAmount] = useState('');

  const handleTransfer = async () => {
    if (!recipientPhone || !amount || isNaN(amount) || amount <= 0) {
      Alert.alert('Error', t('common.error', 'Please enter a valid recipient phone and amount'));
      return;
    }

    try {
      const response = await api.post('/transfer', { recipientPhone, amount: parseFloat(amount) });
      Alert.alert('Success', t('common.success', `Transferred ${amount} PKR to ${recipientPhone}`));
      navigation.goBack(); // Return to Dashboard
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || t('common.error', 'Transfer failed'));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.content}>
        <Text style={styles.title}>{t('dashboard.send')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('dashboard.recipientPhone', 'Recipient Phone (e.g., 03334567890)')}
          value={recipientPhone}
          onChangeText={setRecipientPhone}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          placeholder={t('dashboard.amount', 'Amount (PKR)')}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.button} onPress={handleTransfer} activeOpacity={0.8}>
          <Text style={styles.buttonText}>{t('common.continue')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { ...typography.h2, color: colors.text, textAlign: 'center', marginBottom: 24 },
  input: { ...typography.body, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: colors.secondary },
  button: { backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: colors.secondary, ...typography.body, fontWeight: 'bold' },
});

export default TransferScreen;
