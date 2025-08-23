// screens/SplitBillsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator
} from 'react-native';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import api from '../services/api';

const SplitBillsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('create'); // create, active, history
  const [createdBills, setCreatedBills] = useState([]);
  const [participatingBills, setParticipatingBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Create split form
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [participants, setParticipants] = useState([]);
  const [newParticipantPhone, setNewParticipantPhone] = useState('');
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newParticipantAmount, setNewParticipantAmount] = useState('');
  const [splitEqually, setSplitEqually] = useState(true);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('restaurant');

  const billCategories = [
    { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
    { id: 'shopping', name: 'Shopping', icon: '🛍️' },
    { id: 'travel', name: 'Travel', icon: '✈️' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
    { id: 'utilities', name: 'Utilities', icon: '💡' },
    { id: 'groceries', name: 'Groceries', icon: '🛒' },
    { id: 'other', name: 'Other', icon: '📌' }
  ];

  useEffect(() => {
    if (activeTab !== 'create') {
      loadBills();
    }
  }, [activeTab]);

  const loadBills = async () => {
    try {
      const response = await api.get('/splitbills');
      setCreatedBills(response.data.created || []);
      setParticipatingBills(response.data.participating || []);
    } catch (error) {
      console.error('Load bills error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const addParticipant = () => {
    if (!newParticipantPhone) {
      Alert.alert('Error', 'Please enter participant phone number');
      return;
    }

    const amount = splitEqually 
      ? (parseFloat(totalAmount) / (participants.length + 2)).toFixed(2)
      : newParticipantAmount;

    if (!splitEqually && !amount) {
      Alert.alert('Error', 'Please enter amount for participant');
      return;
    }

    setParticipants([...participants, {
      phone: newParticipantPhone,
      name: newParticipantName || newParticipantPhone,
      amount: parseFloat(amount)
    }]);

    setNewParticipantPhone('');
    setNewParticipantName('');
    setNewParticipantAmount('');
  };

  const removeParticipant = (index) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const createSplitBill = async () => {
    if (!title || !totalAmount) {
      Alert.alert('Error', 'Please enter bill title and amount');
      return;
    }

    if (participants.length === 0) {
      Alert.alert('Error', 'Please add at least one participant');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/splitbills/create', {
        title,
        totalAmount: parseFloat(totalAmount),
        participants,
        description,
        category
      });

      Alert.alert(
        'Success',
        `Split bill created!\nID: ${response.data.splitId}`,
        [{ 
          text: 'OK', 
          onPress: () => {
            // Reset form
            setTitle('');
            setTotalAmount('');
            setParticipants([]);
            setDescription('');
            setActiveTab('active');
          }
        }]
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create split bill');
    } finally {
      setLoading(false);
    }
  };

  const handlePayShare = async (splitId, amount) => {
    Alert.alert(
      'Pay Your Share',
      `Pay PKR ${amount}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await api.post(`/splitbills/${splitId}/pay`);
              Alert.alert('Success', 'Payment successful!');
              loadBills();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.error || 'Payment failed');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSendReminder = async (splitId, participantPhone) => {
    try {
      await api.post(`/splitbills/${splitId}/remind`, { participantPhone });
      Alert.alert('Success', 'Reminder sent');
    } catch (error) {
      Alert.alert('Error', 'Failed to send reminder');
    }
  };

  const getCategoryIcon = (categoryId) => {
    const cat = billCategories.find(c => c.id === categoryId);
    return cat ? cat.icon : '📌';
  };

  const renderCreateTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Create Split Bill</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Bill Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Dinner at Pizza Place"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Total Amount (PKR)</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0.00"
          value={totalAmount}
          onChangeText={setTotalAmount}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.categoryContainer}>
            {billCategories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryButton,
                  category === cat.id && styles.categoryButtonActive
                ]}
                onPress={() => setCategory(cat.id)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={[
                  styles.categoryText,
                  category === cat.id && styles.categoryTextActive
                ]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Add notes about this bill"
          value={description}
          onChangeText={setDescription}
          multiline
        />
      </View>

      <View style={styles.splitTypeContainer}>
        <Text style={styles.label}>Split Type</Text>
        <View style={styles.splitTypeButtons}>
          <TouchableOpacity
            style={[
              styles.splitTypeButton,
              splitEqually && styles.splitTypeButtonActive
            ]}
            onPress={() => setSplitEqually(true)}
          >
            <Text style={[
              styles.splitTypeText,
              splitEqually && styles.splitTypeTextActive
            ]}>
              Split Equally
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.splitTypeButton,
              !splitEqually && styles.splitTypeButtonActive
            ]}
            onPress={() => setSplitEqually(false)}
          >
            <Text style={[
              styles.splitTypeText,
              !splitEqually && styles.splitTypeTextActive
            ]}>
              Custom Amounts
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.participantsSection}>
        <Text style={styles.label}>Add Participants</Text>
        
        <View style={styles.addParticipantForm}>
          <TextInput
            style={styles.participantPhoneInput}
            placeholder="+92 3XX XXX XXXX"
            value={newParticipantPhone}
            onChangeText={setNewParticipantPhone}
            keyboardType="phone-pad"
          />
          
          <TextInput
            style={styles.participantNameInput}
            placeholder="Name (optional)"
            value={newParticipantName}
            onChangeText={setNewParticipantName}
          />
          
          {!splitEqually && (
            <TextInput
              style={styles.participantAmountInput}
              placeholder="Amount"
              value={newParticipantAmount}
              onChangeText={setNewParticipantAmount}
              keyboardType="numeric"
            />
          )}
          
          <TouchableOpacity style={styles.addParticipantButton} onPress={addParticipant}>
            <Text style={styles.addParticipantButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {participants.length > 0 && (
          <View style={styles.participantsList}>
            <Text style={styles.participantsTitle}>
              Participants ({participants.length + 1} including you)
            </Text>
            
            {/* Creator (You) */}
            <View style={styles.participantItem}>
              <View style={styles.participantInfo}>
                <Text style={styles.participantName}>You (Bill Payer)</Text>
                <Text style={styles.participantPhone}>Creator</Text>
              </View>
              <Text style={styles.participantAmount}>
                PKR {splitEqually 
                  ? (parseFloat(totalAmount || 0) / (participants.length + 1)).toFixed(2)
                  : '0.00'}
              </Text>
            </View>
            
            {participants.map((participant, index) => (
              <View key={index} style={styles.participantItem}>
                <View style={styles.participantInfo}>
                  <Text style={styles.participantName}>{participant.name}</Text>
                  <Text style={styles.participantPhone}>{participant.phone}</Text>
                </View>
                <View style={styles.participantRight}>
                  <Text style={styles.participantAmount}>
                    PKR {splitEqually 
                      ? (parseFloat(totalAmount || 0) / (participants.length + 1)).toFixed(2)
                      : participant.amount}
                  </Text>
                  <TouchableOpacity onPress={() => removeParticipant(index)}>
                    <Text style={styles.removeButton}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.createButton, loading && styles.buttonDisabled]}
        onPress={createSplitBill}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.secondary} />
        ) : (
          <Text style={styles.createButtonText}>Create Split Bill</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderCreatedBill = ({ item }) => {
    const progress = (item.paid_count / item.total_participants) * 100;
    
    return (
      <TouchableOpacity 
        style={styles.billCard}
        onPress={() => navigation.navigate('SplitBillDetails', { splitId: item.split_id })}
      >
        <View style={styles.billHeader}>
          <View style={styles.billInfo}>
            <Text style={styles.billIcon}>{getCategoryIcon(item.category)}</Text>
            <View>
              <Text style={styles.billTitle}>{item.title}</Text>
              <Text style={styles.billDate}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <Text style={styles.billAmount}>
            PKR {parseFloat(item.total_amount).toLocaleString()}
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {item.paid_count}/{item.total_participants} paid
          </Text>
        </View>

        <View style={styles.billFooter}>
          <Text style={styles.collectedAmount}>
            Collected: PKR {parseFloat(item.amount_collected || 0).toLocaleString()}
          </Text>
          {item.status === 'settled' ? (
            <View style={styles.settledBadge}>
              <Text style={styles.settledText}>Settled ✓</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.remindAllButton}>
              <Text style={styles.remindAllText}>Remind All</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderParticipatingBill = ({ item }) => (
    <View style={styles.billCard}>
      <View style={styles.billHeader}>
        <View style={styles.billInfo}>
          <Text style={styles.billIcon}>{getCategoryIcon(item.category)}</Text>
          <View>
            <Text style={styles.billTitle}>{item.title}</Text>
            <Text style={styles.billCreator}>by {item.creator_name}</Text>
          </View>
        </View>
        <View style={styles.amountSection}>
          <Text style={styles.yourShare}>Your Share</Text>
          <Text style={styles.billAmount}>
            PKR {parseFloat(item.amount_owed).toLocaleString()}
          </Text>
        </View>
      </View>

      {item.my_status === 'pending' ? (
        <TouchableOpacity
          style={styles.payButton}
          onPress={() => handlePayShare(item.split_id, item.amount_owed)}
        >
          <Text style={styles.payButtonText}>Pay Now</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.paidBadge}>
          <Text style={styles.paidText}>
            Paid on {new Date(item.paid_at).toLocaleDateString()} ✓
          </Text>
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
        <Text style={styles.title}>Split Bills</Text>
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
            My Bills ({createdBills.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            To Pay ({participatingBills.filter(b => b.my_status === 'pending').length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'create' && renderCreateTab()}

      {activeTab === 'active' && (
        <FlatList
          data={createdBills}
          renderItem={renderCreatedBill}
          keyExtractor={item => item.split_id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadBills();
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No split bills created</Text>
          }
        />
      )}

      {activeTab === 'pending' && (
        <FlatList
          data={participatingBills}
          renderItem={renderParticipatingBill}
          keyExtractor={item => item.split_id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadBills();
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No pending split bills</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ... (styles continue in next message due to length)
});

export default SplitBillsScreen;
