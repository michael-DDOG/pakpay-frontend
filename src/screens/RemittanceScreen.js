import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StatusBar, Alert, Picker } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import api from '../services/api';

const RemittanceScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [recipientPhone, setRecipientPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('AED'); // Default to UAE Dirham

  const handleRemittance = async () => {
    if (!recipientPhone || !amount || isNaN(amount) || amount <= 0) {
      Alert.alert('Error', t('common.error', 'Please enter a valid recipient phone and amount'));
      return;
    }

    try {
      const response = await api.post('/remittance', { recipientPhone, amount: parseFloat(amount), currency });
      Alert.alert('Success', t('common.success', `Sent ${amount} ${currency} to ${recipientPhone}`));
      navigation.goBack(); // Return to Dashboard
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || t('common.error', 'Remittance failed'));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.content}>
        <Text style={styles.title}>{t('dashboard.receive')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('dashboard.recipientPhone', 'Recipient Phone (e.g., +971501234567)')}
          value={recipientPhone}
          onChangeText={setRecipientPhone}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          placeholder={t('dashboard.amount', 'Amount')}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        <Picker
          selectedValue={currency}
          style={styles.picker}
          onValueChange={(itemValue) => setCurrency(itemValue)}
        >
          <Picker.Item label="AED (UAE Dirham)" value="AED" />
          <Picker.Item label="SAR (Saudi Riyal)" value="SAR" />
        </Picker>
        <TouchableOpacity style={styles.button} onPress={handleRemittance} activeOpacity={0.8}>
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
  picker: { height: 50, width: '100%', marginBottom: 16, backgroundColor: colors.secondary, borderRadius: 8 },
  button: { backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: colors.secondary, ...typography.body, fontWeight: 'bold' },
});

export default RemittanceScreen;
