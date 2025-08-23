// screens/ScheduledTransferScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  ScrollView,
  FlatList,
  Switch,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import api from '../services/api';

const ScheduledTransferScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('create'); // create, active, history
  const [recipientPhone, setRecipientPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState('monthly');
  const [endDate, setEndDate] = useState(null);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeSchedules, setActiveSchedules] = useState([]);
  const [scheduledHistory, setScheduledHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (activeTab === 'active') {
      loadActiveSchedules();
    } else if (activeTab === 'history') {
      loadScheduleHistory();
    }
  }, [activeTab]);

  const loadActiveSchedules = async () => {
    try {
      const response = await api.get('/scheduled/active');
      setActiveSchedules(response.data.schedules || []);
    } catch (error) {
      console.error('Load active schedules error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadScheduleHistory = async () => {
    try {
      const response = await api.get('/scheduled/history');
      setScheduledHistory(response.data.schedules || []);
    } catch (error) {
      console.error('Load schedule history error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateSchedule = async () => {
    if (!recipientPhone || !amount) {
      Alert.alert('Error', 'Please enter recipient phone and amount');
      return;
    }

    if (parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Amount must be greater than 0');
      return;
    }

    if (scheduleDate < new Date()) {
      Alert.alert('Error', 'Schedule date must be in the future');
      return;
    }

    if (isRecurring && endDate && endDate <= scheduleDate) {
      Alert.alert('Error', 'End date must be after schedule date');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/scheduled/create', {
        recipientPhone,
        amount: parseFloat(amount),
        description,
        scheduleDate: scheduleDate.toISOString(),
        recurring: isRecurring,
        frequency: isRecurring ? frequency : null,
        endDate: isRecurring && endDate ? endDate.toISOString() : null
      });

      Alert.alert(
        'Success',
        `Scheduled transfer created successfully!\nID: ${response.data.schedule.schedule_id}`,
        [{ 
          text: 'OK', 
          onPress: () => {
            // Reset form
            setRecipientPhone('');
            setAmount('');
            setDescription('');
            setScheduleDate(new Date());
            setIsRecurring(false);
            setEndDate(null);
            setActiveTab('active');
          }
        }]
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create scheduled transfer');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSchedule = (scheduleId) => {
    Alert.alert(
      'Cancel Schedule',
      'Are you sure you want to cancel this scheduled transfer?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/scheduled/${scheduleId}/cancel`);
              Alert.alert('Success', 'Scheduled transfer cancelled');
              loadActiveSchedules();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel schedule');
            }
          }
        }
      ]
    );
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatFrequency = (freq) => {
    switch(freq) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      default: return 'One-time';
    }
  };

  const renderCreateTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Schedule a Transfer</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Recipient Phone Number</Text>
        <View style={styles.phoneInput}>
          <Text style={styles.countryCode}>+92</Text>
          <TextInput
            style={styles.input}
            placeholder="3XX XXX XXXX"
            value={recipientPhone}
            onChangeText={setRecipientPhone}
            keyboardType="phone-pad"
            maxLength={11}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Amount (PKR)</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Monthly rent, salary, etc."
          value={description}
          onChangeText={setDescription}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Schedule Date</Text>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>{formatDate(scheduleDate)}</Text>
          <Text style={styles.dateIcon}>📅</Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={scheduleDate}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setScheduleDate(selectedDate);
            }
          }}
        />
      )}

      <View style={styles.recurringContainer}>
        <View style={styles.recurringHeader}>
          <Text style={styles.label}>Recurring Transfer</Text>
          <Switch
            value={isRecurring}
            onValueChange={setIsRecurring}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.secondary}
          />
        </View>

        {isRecurring && (
          <>
            <View style={styles.frequencyContainer}>
              <Text style={styles.sublabel}>Frequency</Text>
              <View style={styles.frequencyButtons}>
                {['daily', 'weekly', 'monthly'].map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.frequencyButton,
                      frequency === freq && styles.frequencyButtonActive
                    ]}
                    onPress={() => setFrequency(freq)}
                  >
                    <Text style={[
                      styles.frequencyText,
                      frequency === freq && styles.frequencyTextActive
                    ]}>
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.sublabel}>End Date (Optional)</Text>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {endDate ? formatDate(endDate) : 'No end date'}
                </Text>
                <Text style={styles.dateIcon}>📅</Text>
              </TouchableOpacity>
            </View>

            {showEndDatePicker && (
              <DateTimePicker
                value={endDate || new Date()}
                mode="date"
                display="default"
                minimumDate={scheduleDate}
                onChange={(event, selectedDate) => {
                  setShowEndDatePicker(false);
                  if (selectedDate) {
                    setEndDate(selectedDate);
                  }
                }}
              />
            )}
          </>
        )}
      </View>

      <TouchableOpacity
        style={[styles.scheduleButton, loading && styles.buttonDisabled]}
        onPress={handleCreateSchedule}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.secondary} />
        ) : (
          <Text style={styles.scheduleButtonText}>
            {isRecurring ? 'Set Up Recurring Transfer' : 'Schedule Transfer'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderScheduleItem = ({ item }) => (
    <View style={styles.scheduleCard}>
      <View style={styles.scheduleHeader}>
        <View>
          <Text style={styles.scheduleName}>{item.recipient_name}</Text>
          <Text style={styles.schedulePhone}>{item.recipient_phone}</Text>
        </View>
        <Text style={styles.scheduleAmount}>PKR {parseFloat(item.amount).toLocaleString()}</Text>
      </View>

      <View style={styles.scheduleDetails}>
        <View style={styles.scheduleRow}>
          <Text style={styles.scheduleLabel}>Next Run:</Text>
          <Text style={styles.scheduleValue}>{formatDate(item.next_run_date)}</Text>
        </View>
        <View style={styles.scheduleRow}>
          <Text style={styles.scheduleLabel}>Frequency:</Text>
          <Text style={styles.scheduleValue}>{formatFrequency(item.frequency)}</Text>
        </View>
        {item.description && (
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleLabel}>Description:</Text>
            <Text style={styles.scheduleValue}>{item.description}</Text>
          </View>
        )}
      </View>

      {item.status === 'active' && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleCancelSchedule(item.schedule_id)}
        >
          <Text style={styles.cancelButtonText}>Cancel Schedule</Text>
        </TouchableOpacity>
      )}

      {item.status !== 'active' && (
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Scheduled Transfers</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'create' && styles.tabActive]}
          onPress={() => setActiveTab('create')}
        >
          <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>
            Create
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Active ({activeSchedules.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'create' && renderCreateTab()}

      {activeTab === 'active' && (
        <FlatList
          data={activeSchedules}
          renderItem={renderScheduleItem}
          keyExtractor={item => item.schedule_id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadActiveSchedules();
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No active scheduled transfers</Text>
          }
        />
      )}

      {activeTab === 'history' && (
        <FlatList
          data={scheduledHistory}
          renderItem={renderScheduleItem}
          keyExtractor={item => item.schedule_id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadScheduleHistory();
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No scheduled transfer history</Text>
          }
        />
      )}
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
  sublabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 8
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
  amountInput: {
    ...typography.h2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    backgroundColor: colors.secondary,
    fontSize: 24
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    backgroundColor: colors.secondary
  },
  dateText: {
    ...typography.body,
    color: colors.text
  },
  dateIcon: {
    fontSize: 20
  },
  recurringContainer: {
    marginBottom: 20
  },
  recurringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  frequencyContainer: {
    marginBottom: 16
  },
  frequencyButtons: {
    flexDirection: 'row',
    gap: 8
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border
  },
  frequencyButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  frequencyText: {
    ...typography.body,
    color: colors.text
  },
  frequencyTextActive: {
    color: colors.secondary,
    fontWeight: 'bold'
  },
  scheduleButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20
  },
  scheduleButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: 'bold'
  },
  buttonDisabled: {
    opacity: 0.7
  },
  listContent: {
    padding: 24
  },
  scheduleCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  scheduleName: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text
  },
  schedulePhone: {
    ...typography.caption,
    color: colors.textSecondary
  },
  scheduleAmount: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.primary
  },
  scheduleDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  scheduleLabel: {
    ...typography.caption,
    color: colors.textSecondary
  },
  scheduleValue: {
    ...typography.caption,
    color: colors.text
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.error
  },
  statusBadge: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignSelf: 'flex-start'
  },
  statusText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: 'bold'
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 50
  }
});

export default ScheduledTransferScreen;
