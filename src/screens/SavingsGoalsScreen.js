// screens/SavingsGoalsScreen.js
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
  Modal,
  Alert,
  ActivityIndicator
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import api from '../services/api';

const SavingsGoalsScreen = ({ navigation }) => {
  const [goals, setGoals] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [depositModal, setDepositModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Create goal form states
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState('general');
  const [depositAmount, setDepositAmount] = useState('');

  const categories = [
    { id: 'general', name: 'General', icon: '💰' },
    { id: 'vacation', name: 'Vacation', icon: '✈️' },
    { id: 'emergency', name: 'Emergency', icon: '🚨' },
    { id: 'education', name: 'Education', icon: '🎓' },
    { id: 'purchase', name: 'Purchase', icon: '🛍️' },
    { id: 'wedding', name: 'Wedding', icon: '💍' },
    { id: 'retirement', name: 'Retirement', icon: '🏖️' },
    { id: 'home', name: 'Home', icon: '🏠' }
  ];

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const response = await api.get('/savings/goals');
      setGoals(response.data.goals || []);
    } catch (error) {
      console.error('Load goals error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const createGoal = async () => {
    if (!goalName || !targetAmount) {
      Alert.alert('Error', 'Please enter goal name and target amount');
      return;
    }

    if (parseFloat(targetAmount) <= 0) {
      Alert.alert('Error', 'Target amount must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/savings/create', {
        name: goalName,
        targetAmount: parseFloat(targetAmount),
        targetDate: targetDate.toISOString(),
        category
      });

      Alert.alert(
        'Success',
        `Savings goal "${goalName}" created successfully!`,
        [{ 
          text: 'OK', 
          onPress: () => {
            setModalVisible(false);
            setGoalName('');
            setTargetAmount('');
            setTargetDate(new Date());
            setCategory('general');
            loadGoals();
          }
        }]
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/savings/goals/${selectedGoal.goal_id}/deposit`, {
        amount: parseFloat(depositAmount)
      });

      Alert.alert(
        'Success',
        response.data.goalReached 
          ? `Congratulations! You've reached your goal!` 
          : `Added PKR ${depositAmount} to your savings`,
        [{ 
          text: 'OK', 
          onPress: () => {
            setDepositModal(false);
            setDepositAmount('');
            setSelectedGoal(null);
            loadGoals();
          }
        }]
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to add to savings');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = (goal) => {
    Alert.alert(
      'Withdraw from Savings',
      'Are you sure you want to withdraw from this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: () => {
            // Navigate to withdrawal screen or show withdrawal modal
            navigation.navigate('WithdrawSavings', { goal });
          }
        }
      ]
    );
  };

  const getCategoryIcon = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.icon : '💰';
  };

  const getProgressColor = (progress) => {
    if (progress >= 100) return colors.success;
    if (progress >= 75) return '#4CAF50';
    if (progress >= 50) return colors.accent;
    if (progress >= 25) return '#FFA500';
    return colors.primary;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateDaysLeft = (targetDate) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = Math.abs(target - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renderGoal = ({ item }) => {
    const progress = (parseFloat(item.current_amount) / parseFloat(item.target_amount)) * 100;
    const progressColor = getProgressColor(progress);
    
    return (
      <TouchableOpacity 
        style={styles.goalCard}
        onPress={() => navigation.navigate('GoalDetails', { goalId: item.goal_id })}
      >
        <View style={styles.goalHeader}>
          <View style={styles.goalInfo}>
            <Text style={styles.goalIcon}>{getCategoryIcon(item.category)}</Text>
            <View>
              <Text style={styles.goalName}>{item.name}</Text>
              <Text style={styles.goalCategory}>{item.category}</Text>
            </View>
          </View>
          <View style={styles.goalAmounts}>
            <Text style={styles.currentAmount}>
              PKR {parseFloat(item.current_amount).toLocaleString()}
            </Text>
            <Text style={styles.targetAmount}>
              of {parseFloat(item.target_amount).toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min(progress, 100)}%`,
                  backgroundColor: progressColor 
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{progress.toFixed(1)}%</Text>
        </View>

        <View style={styles.goalFooter}>
          <Text style={styles.daysLeft}>
            {calculateDaysLeft(item.target_date)} days left
          </Text>
          <View style={styles.goalActions}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setSelectedGoal(item);
                setDepositModal(true);
              }}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
            {item.current_amount > 0 && (
              <TouchableOpacity
                style={styles.withdrawButton}
                onPress={() => handleWithdraw(item)}
              >
                <Text style={styles.withdrawButtonText}>Withdraw</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTotalSavings = () => {
    const total = goals.reduce((sum, goal) => sum + parseFloat(goal.current_amount || 0), 0);
    
    return (
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Savings</Text>
        <Text style={styles.totalAmount}>PKR {total.toLocaleString()}</Text>
        <Text style={styles.totalGoals}>{goals.length} active goals</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Savings Goals</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.addNewButton}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={goals}
        renderItem={renderGoal}
        keyExtractor={item => item.goal_id}
        ListHeaderComponent={renderTotalSavings}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          loadGoals();
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>No Savings Goals</Text>
            <Text style={styles.emptyText}>
              Start saving for your dreams by creating a goal
            </Text>
            <TouchableOpacity 
              style={styles.createFirstButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.createFirstText}>Create Your First Goal</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Create Goal Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Savings Goal</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Goal Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Dream Vacation"
                  value={goalName}
                  onChangeText={setGoalName}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Target Amount (PKR)</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Target Date</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateText}>{formatDate(targetDate)}</Text>
                  <Text style={styles.dateIcon}>📅</Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={targetDate}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setTargetDate(selectedDate);
                    }
                  }}
                />
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryGrid}>
                  {categories.map((cat) => (
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
              </View>

              <TouchableOpacity
                style={[styles.createButton, loading && styles.buttonDisabled]}
                onPress={createGoal}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.secondary} />
                ) : (
                  <Text style={styles.createButtonText}>Create Goal</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Deposit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={depositModal}
        onRequestClose={() => setDepositModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add to Savings</Text>
              <TouchableOpacity onPress={() => setDepositModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedGoal && (
              <View style={styles.modalBody}>
                <View style={styles.goalSummary}>
                  <Text style={styles.goalSummaryName}>{selectedGoal.name}</Text>
                  <Text style={styles.goalSummaryProgress}>
                    Current: PKR {parseFloat(selectedGoal.current_amount).toLocaleString()}
                  </Text>
                  <Text style={styles.goalSummaryTarget}>
                    Target: PKR {parseFloat(selectedGoal.target_amount).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Amount to Add (PKR)</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    value={depositAmount}
                    onChangeText={setDepositAmount}
                    keyboardType="numeric"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.depositButton, loading && styles.buttonDisabled]}
                  onPress={handleDeposit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.secondary} />
                  ) : (
                    <Text style={styles.depositButtonText}>Add to Savings</Text>
                  )}
                </TouchableOpacity>
              </View>
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
  addNewButton: {
    ...typography.body,
    color: colors.primary,
    fontWeight: 'bold'
  },
  listContent: {
    paddingBottom: 24
  },
  totalCard: {
    backgroundColor: colors.primary,
    margin: 24,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center'
  },
  totalLabel: {
    ...typography.caption,
    color: colors.secondary,
    opacity: 0.9
  },
  totalAmount: {
    ...typography.h1,
    color: colors.secondary,
    fontWeight: 'bold',
    marginVertical: 8
  },
  totalGoals: {
    ...typography.caption,
    color: colors.secondary,
    opacity: 0.9
  },
  goalCard: {
    backgroundColor: colors.secondary,
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  goalIcon: {
    fontSize: 32,
    marginRight: 12
  },
  goalName: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text
  },
  goalCategory: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'capitalize'
  },
  goalAmounts: {
    alignItems: 'flex-end'
  },
  currentAmount: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.primary
  },
  targetAmount: {
    ...typography.caption,
    color: colors.textSecondary
  },
  progressContainer: {
    marginBottom: 16
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 4
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right'
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  daysLeft: {
    ...typography.caption,
    color: colors.textSecondary
  },
  goalActions: {
    flexDirection: 'row',
    gap: 8
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6
  },
  addButtonText: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: 'bold'
  },
  withdrawButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border
  },
  withdrawButtonText: {
    ...typography.caption,
    color: colors.text
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 8
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24
  },
  createFirstButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  createFirstText: {
    ...typography.body,
    color: colors.secondary,
    fontWeight: 'bold'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text
  },
  closeButton: {
    fontSize: 24,
    color: colors.textSecondary
  },
  modalBody: {
    padding: 20
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
  amountInput: {
    ...typography.h2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    backgroundColor: colors.secondary,
    fontSize: 24,
    textAlign: 'center'
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.secondary
  },
  dateText: {
    ...typography.body,
    color: colors.text
  },
  dateIcon: {
    fontSize: 20
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  categoryButton: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8
  },
  categoryButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20'
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4
  },
  categoryText: {
    ...typography.caption,
    color: colors.text,
    fontSize: 10
  },
  categoryTextActive: {
    color: colors.primary,
    fontWeight: 'bold'
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20
  },
  createButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: 'bold'
  },
  buttonDisabled: {
    opacity: 0.7
  },
  goalSummary: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 8,
    marginBottom: 20
  },
  goalSummaryName: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8
  },
  goalSummaryProgress: {
    ...typography.caption,
    color: colors.textSecondary
  },
  goalSummaryTarget: {
    ...typography.caption,
    color: colors.textSecondary
  },
  depositButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  depositButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default SavingsGoalsScreen;
