// screens/RequestMoneyScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import api from '../services/api';

const RequestMoneyScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('create'); // create, pending, sent
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (activeTab === 'pending') {
      loadPendingRequests();
    } else if (activeTab === 'sent') {
      loadSentRequests();
    }
  }, [activeTab]);

  const loadPendingRequests = async () => {
    try {
      const response = await api.get('/requests/pending');
      setPendingRequests(response.data.requests);
    } catch (error) {
      console.error('Load pending requests error:', error);
    }
  };

  const loadSentRequests = async () => {
    try {
      const response = await api.get('/requests/sent');
      setSentRequests(response.data.requests);
    } catch (error) {
      console.error('Load sent requests error:', error);
    }
  };

  const createRequest = async () => {
    if (!phone || !amount) {
      Alert.alert('Error', 'Please enter phone number and amount');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/requests/create', {
        requestFromPhone: phone,
        amount: parseFloat(amount),
        description
      });

      Alert.alert(
        'Success',
        `Money request sent to ${response.data.request.requestedFromName}`,
        [{ text: 'OK', onPress: () => {
          setPhone('');
          setAmount('');
          setDescription('');
          setActiveTab('sent');
        }}]
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, amount, requesterName) => {
    Alert.alert(
      'Approve Request',
      `Send PKR ${amount} to ${requesterName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              const response = await api.post(`/requests/${requestId}/approve`);
              Alert.alert('Success', 'Payment sent successfully');
              loadPendingRequests();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to approve request');
            }
          }
        }
      ]
    );
  };

  const handleDecline = async (requestId) => {
    Alert.alert(
      'Decline Request',
      'Are you sure you want to decline this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/requests/${requestId}/decline`);
              Alert.alert('Success', 'Request declined');
              loadPendingRequests();
            } catch (error) {
              Alert.alert('Error', 'Failed to decline request');
            }
          }
        }
      ]
    );
  };

  const handleCancel = async (requestId) => {
    try {
      await api.post(`/requests/${requestId}/cancel`);
      Alert.alert('Success', 'Request cancelled');
      loadSentRequests();
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel request');
    }
  };

  const handleRemind = async (requestId) => {
    try {
      await api.post(`/requests/${requestId}/remind`);
      Alert.alert('Success', 'Reminder sent');
    } catch (error) {
      Alert.alert('Error', 'Failed to send reminder');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return colors.accent;
      case 'approved': return colors.success;
      case 'declined': return colors.error;
      case 'cancelled': return colors.textSecondary;
      default: return colors.text;
    }
  };

  const renderPendingRequest = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Text style={styles.requesterName}>{item.requester_name}</Text>
        <Text style={styles.requestAmount}>PKR {parseFloat(item.amount).toLocaleString()}</Text>
      </View>
      
      <Text style={styles.requestPhone}>{item.requester_phone}</Text>
      {item.description && <Text style={styles.requestDescription}>{item.description}</Text>}
      
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={styles.declineButton}
          onPress={() => handleDecline(item.request_id)}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.approveButton}
          onPress={() => handleApprove(item.request_id, item.amount, item.requester_name)}
        >
          <Text style={styles.approveButtonText}>Pay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSentRequest = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Text style={styles.requesterName}>{item.requested_name}</Text>
        <Text style={styles.requestAmount}>PKR {parseFloat(item.amount).toLocaleString()}</Text>
      </View>
      
      <Text style={styles.requestPhone}>{item.requested_phone}</Text>
      
      <View style={styles.requestStatus}>
        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
          {item.status.toUpperCase()}
        </Text>
        <Text style={styles.requestDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      
      {item.status === 'pending' && (
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancel(item.request_id)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.remindButton}
            onPress={() => handleRemind(item.request_id)}
          >
            <Text style={styles.remindButtonText}>Remind</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderCreateTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Request Money From</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Phone Number</Text>
        <View style={styles.phoneInput}>
          <Text style={styles.countryCode}>+92</Text>
          <TextInput
            style={styles.input}
            placeholder="3XX XXX XXXX"
            value={phone}
            onChangeText={setPhone}
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
          placeholder="What's this request for?"
          value={description}
          onChangeText={setDescription}
        />
      </View>
      
      <TouchableOpacity
        style={[styles.requestButton, loading && styles.buttonDisabled]}
        onPress={createRequest}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.secondary} />
        ) : (
          <Text style={styles.requestButtonText}>Send Request</Text>
        )}
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
        <Text style={styles.title}>Request Money</Text>
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
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            Pending ({pendingRequests.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sent' && styles.tabActive]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles.tabText, activeTab === 'sent' && styles.tabTextActive]}>
            Sent
          </Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'create' && renderCreateTab()}
      
      {activeTab === 'pending' && (
        <FlatList
          data={pendingRequests}
          renderItem={renderPendingRequest}
          keyExtractor={item => item.request_id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadPendingRequests} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No pending requests</Text>
          }
        />
      )}
      
      {activeTab === 'sent' && (
        <FlatList
          data={sentRequests}
          renderItem={renderSentRequest}
          keyExtractor={item => item.request_id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadSentRequests} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No sent requests</Text>
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
  requestButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8
  },
  requestButtonText: {
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
  requestCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  requesterName: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text
  },
  requestAmount: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.primary
  },
  requestPhone: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4
  },
  requestDescription: {
    ...typography.caption,
    color: colors.text,
    marginTop: 8
  },
  requestStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
 statusText: {
   ...typography.caption,
   fontWeight: 'bold'
 },
 requestDate: {
   ...typography.caption,
   color: colors.textSecondary
 },
 requestActions: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   marginTop: 12,
   gap: 8
 },
 approveButton: {
   flex: 1,
   backgroundColor: colors.primary,
   paddingVertical: 10,
   borderRadius: 8,
   alignItems: 'center'
 },
 approveButtonText: {
   color: colors.secondary,
   fontWeight: 'bold'
 },
 declineButton: {
   flex: 1,
   backgroundColor: colors.secondary,
   paddingVertical: 10,
   borderRadius: 8,
   alignItems: 'center',
   borderWidth: 1,
   borderColor: colors.error
 },
 declineButtonText: {
   color: colors.error,
   fontWeight: 'bold'
 },
 cancelButton: {
   flex: 1,
   backgroundColor: colors.secondary,
   paddingVertical: 10,
   borderRadius: 8,
   alignItems: 'center',
   borderWidth: 1,
   borderColor: colors.border
 },
 cancelButtonText: {
   color: colors.text
 },
 remindButton: {
   flex: 1,
   backgroundColor: colors.primary,
   paddingVertical: 10,
   borderRadius: 8,
   alignItems: 'center'
 },
 remindButtonText: {
   color: colors.secondary,
   fontWeight: 'bold'
 },
 emptyText: {
   ...typography.body,
   color: colors.textSecondary,
   textAlign: 'center',
   marginTop: 50
 }
});

export default RequestMoneyScreen;
