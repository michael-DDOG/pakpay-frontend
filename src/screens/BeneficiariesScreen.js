// screens/BeneficiariesScreen.js
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
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import api from '../services/api';

const BeneficiariesScreen = ({ navigation }) => {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [recentRecipients, setRecentRecipients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [nickname, setNickname] = useState('');
  const [category, setCategory] = useState('personal');
  const [activeTab, setActiveTab] = useState('saved'); // saved, recent

  const categories = [
    { id: 'personal', name: 'Personal', icon: '👤' },
    { id: 'family', name: 'Family', icon: '👨‍👩‍👧‍👦' },
    { id: 'business', name: 'Business', icon: '💼' },
    { id: 'friends', name: 'Friends', icon: '👥' },
    { id: 'services', name: 'Services', icon: '🛠️' },
    { id: 'other', name: 'Other', icon: '📌' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [beneficiariesRes, recentRes] = await Promise.all([
        api.get('/beneficiaries'),
        api.get('/beneficiaries/recent')
      ]);
      
      setBeneficiaries(beneficiariesRes.data.beneficiaries || []);
      setRecentRecipients(recentRes.data.recipients || []);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleQuickSend = (beneficiary) => {
    navigation.navigate('Transfer', {
      prefilledPhone: beneficiary.beneficiary_phone || beneficiary.phone,
      prefilledName: beneficiary.nickname || beneficiary.beneficiary_name || beneficiary.name
    });
  };

  const handleAddBeneficiary = async (recipient) => {
    try {
      setLoading(true);
      
      const response = await api.post('/beneficiaries/add', {
        phone: recipient.phone,
        nickname: nickname || recipient.name,
        category
      });
      
      Alert.alert('Success', 'Beneficiary added successfully');
      setModalVisible(false);
      setNickname('');
      setCategory('personal');
      loadData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to add beneficiary');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (beneficiaryRef) => {
    try {
      const response = await api.post(`/beneficiaries/${beneficiaryRef}/favorite`);
      
      // Update local state
      setBeneficiaries(prev => prev.map(b => 
        b.beneficiary_ref === beneficiaryRef 
          ? { ...b, is_favorite: response.data.isFavorite }
          : b
      ));
    } catch (error) {
      console.error('Toggle favorite error:', error);
    }
  };

  const handleDelete = (beneficiary) => {
    Alert.alert(
      'Remove Beneficiary',
      `Remove ${beneficiary.nickname || beneficiary.beneficiary_name} from your saved beneficiaries?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/beneficiaries/${beneficiary.beneficiary_ref}`);
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove beneficiary');
            }
          }
        }
      ]
    );
  };

  const getCategoryIcon = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.icon : '📌';
  };

  const filteredBeneficiaries = beneficiaries.filter(b => {
    const searchLower = searchQuery.toLowerCase();
    return (
      b.nickname?.toLowerCase().includes(searchLower) ||
      b.beneficiary_name?.toLowerCase().includes(searchLower) ||
      b.beneficiary_phone?.includes(searchQuery)
    );
  });

  const renderBeneficiary = ({ item }) => (
    <TouchableOpacity
      style={styles.beneficiaryCard}
      onPress={() => handleQuickSend(item)}
      onLongPress={() => handleDelete(item)}
    >
      <View style={styles.beneficiaryLeft}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>
            {getCategoryIcon(item.category)}
          </Text>
          {item.is_favorite && (
            <View style={styles.favoriteBadge}>
              <Text style={styles.favoriteIcon}>⭐</Text>
            </View>
          )}
        </View>
        
        <View style={styles.beneficiaryInfo}>
          <Text style={styles.beneficiaryName}>
            {item.nickname || item.beneficiary_name}
          </Text>
          <Text style={styles.beneficiaryPhone}>
            {item.beneficiary_phone}
          </Text>
          {item.last_transaction && (
            <Text style={styles.lastTransaction}>
              Last: {new Date(item.last_transaction).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.beneficiaryRight}>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(item.beneficiary_ref)}
        >
          <Text style={styles.favoriteButtonIcon}>
            {item.is_favorite ? '⭐' : '☆'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => handleQuickSend(item)}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderRecentRecipient = ({ item }) => (
    <View style={styles.recentCard}>
      <View style={styles.recentInfo}>
        <Text style={styles.recentName}>{item.name}</Text>
        <Text style={styles.recentPhone}>{item.phone}</Text>
        <Text style={styles.recentTransactions}>
          {item.transaction_count} transactions
        </Text>
      </View>
      
      <View style={styles.recentActions}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setSelectedBeneficiary(item);
            setModalVisible(true);
          }}
        >
          <Text style={styles.addButtonText}>+ Save</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.sendSmallButton}
          onPress={() => handleQuickSend(item)}
        >
          <Text style={styles.sendSmallButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Beneficiaries</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddBeneficiary')}>
          <Text style={styles.addNewButton}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search beneficiaries..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
          onPress={() => setActiveTab('saved')}
        >
          <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
            Saved ({filteredBeneficiaries.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recent' && styles.tabActive]}
          onPress={() => setActiveTab('recent')}
        >
          <Text style={[styles.tabText, activeTab === 'recent' && styles.tabTextActive]}>
            Recent ({recentRecipients.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          {activeTab === 'saved' ? (
            <FlatList
              data={filteredBeneficiaries}
              renderItem={renderBeneficiary}
              keyExtractor={item => item.beneficiary_ref}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => {
                  setRefreshing(true);
                  loadData();
                }} />
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>👥</Text>
                  <Text style={styles.emptyTitle}>No Saved Beneficiaries</Text>
                  <Text style={styles.emptyText}>
                    Add frequently used recipients for quick transfers
                  </Text>
                </View>
              }
            />
          ) : (
            <FlatList
              data={recentRecipients}
              renderItem={renderRecentRecipient}
              keyExtractor={(item, index) => `${item.phone}-${index}`}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => {
                  setRefreshing(true);
                  loadData();
                }} />
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🕐</Text>
                  <Text style={styles.emptyTitle}>No Recent Recipients</Text>
                  <Text style={styles.emptyText}>
                    Your recent transfer recipients will appear here
                  </Text>
                </View>
              }
            />
          )}
        </>
      )}

      {/* Add Beneficiary Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Save Beneficiary</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedBeneficiary && (
              <View style={styles.modalBody}>
                <View style={styles.recipientInfo}>
                  <Text style={styles.recipientName}>{selectedBeneficiary.name}</Text>
                  <Text style={styles.recipientPhone}>{selectedBeneficiary.phone}</Text>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Nickname (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Mom, Landlord, etc."
                    value={nickname}
                    onChangeText={setNickname}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Category</Text>
                  <View style={styles.categoryGrid}>
                    {categories.map(cat => (
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
                  style={[styles.saveButton, loading && styles.buttonDisabled]}
                  onPress={() => handleAddBeneficiary(selectedBeneficiary)}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.secondary} />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Beneficiary</Text>
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
    ...typography.h3,
    color: colors.text
  },
  addNewButton: {
    ...typography.body,
    color: colors.primary,
    fontWeight: 'bold'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    paddingVertical: 12
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 12
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  tabActive: {
    borderBottomColor: colors.primary
  },
  tabText: {
    ...typography.body,
    color: colors.textSecondary
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: 'bold'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  listContent: {
    paddingBottom: 24
  },
  beneficiaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    marginHorizontal: 24,
    marginTop: 12,
    padding: 16,
    borderRadius: 12
  },
  beneficiaryLeft: {
    flexDirection: 'row',
    flex: 1
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12
  },
  avatar: {
    fontSize: 32
  },
  favoriteBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.accent,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  favoriteIcon: {
    fontSize: 12
  },
  beneficiaryInfo: {
    flex: 1
  },
  beneficiaryName: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text
  },
  beneficiaryPhone: {
    ...typography.caption,
    color: colors.textSecondary
  },
  lastTransaction: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4
  },
  beneficiaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  favoriteButton: {
    padding: 8
  },
  favoriteButtonIcon: {
    fontSize: 20,
    color: colors.accent
  },
  sendButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6
  },
  sendButtonText: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: 'bold'
  },
  recentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    marginHorizontal: 24,
    marginTop: 12,
    padding: 16,
    borderRadius: 12
  },
  recentInfo: {
    flex: 1
  },
  recentName: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text
  },
  recentPhone: {
    ...typography.caption,
    color: colors.textSecondary
  },
  recentTransactions: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4
  },
  recentActions: {
    flexDirection: 'row',
    gap: 8
  },
  addButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary
  },
  addButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold'
  },
  sendSmallButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6
  },
  sendSmallButtonText: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: 'bold'
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
    paddingHorizontal: 48
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
    maxHeight: '70%'
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
  recipientInfo: {
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 8,
    marginBottom: 20
  },
  recipientName: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text
  },
  recipientPhone: {
    ...typography.caption,
    color: colors.textSecondary
  },
  inputContainer: {
    marginBottom: 20
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  categoryButton: {
    width: '31%',
    backgroundColor: colors.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    alignItems: 'center'
  },
  categoryButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10'
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4
  },
  categoryText: {
    ...typography.caption,
    color: colors.text
  },
  categoryTextActive: {
    color: colors.primary,
    fontWeight: 'bold'
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  saveButtonText: {
    ...typography.body,
    color: colors.secondary,
    fontWeight: 'bold'
  },
  buttonDisabled: {
    opacity: 0.7
  }
});

export default BeneficiariesScreen;
