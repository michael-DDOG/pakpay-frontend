// src/screens/MerchantDashboardScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator
} from 'react-native';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import api from '../services/api';

const MerchantDashboardScreen = ({ navigation }) => {
  const [merchantData, setMerchantData] = useState(null);
  const [todayStats, setTodayStats] = useState({
    transaction_count: 0,
    // Continue MerchantDashboardScreen.js
   total_revenue: 0
 });
 const [monthlyStats, setMonthlyStats] = useState({
   transaction_count: 0,
   total_revenue: 0
 });
 const [recentTransactions, setRecentTransactions] = useState([]);
 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 const [qrModalVisible, setQrModalVisible] = useState(false);
 const [qrAmount, setQrAmount] = useState('');
 const [qrDescription, setQrDescription] = useState('');

 useEffect(() => {
   loadMerchantData();
 }, []);

 const loadMerchantData = async () => {
   try {
     const response = await api.get('/merchants/dashboard');
     
     if (response.data.success) {
       setMerchantData(response.data.merchant);
       setTodayStats(response.data.todayStats);
       setMonthlyStats(response.data.monthlyStats);
       
       // Load recent transactions
       const txResponse = await api.get('/merchants/transactions');
       setRecentTransactions(txResponse.data.transactions || []);
     }
   } catch (error) {
     if (error.response?.status === 404) {
       // Not a merchant yet
       Alert.alert(
         'Not a Merchant',
         'You need to register as a merchant first',
         [
           { text: 'Cancel', onPress: () => navigation.goBack() },
           { 
             text: 'Register', 
             onPress: () => navigation.navigate('MerchantRegistration') 
           }
         ]
       );
     }
   } finally {
     setLoading(false);
     setRefreshing(false);
   }
 };

 const generateQRCode = async () => {
   if (!qrAmount || parseFloat(qrAmount) <= 0) {
     Alert.alert('Error', 'Please enter a valid amount');
     return;
   }

   try {
     const response = await api.post('/merchants/generate-qr', {
       amount: parseFloat(qrAmount),
       description: qrDescription
     });

     Alert.alert(
       'QR Code Generated',
       `QR ID: ${response.data.qrCode.qr_id}\nAmount: PKR ${qrAmount}`,
       [{ text: 'OK', onPress: () => {
         setQrModalVisible(false);
         setQrAmount('');
         setQrDescription('');
       }}]
     );
   } catch (error) {
     Alert.alert('Error', 'Failed to generate QR code');
   }
 };

 const onRefresh = () => {
   setRefreshing(true);
   loadMerchantData();
 };

 if (loading) {
   return (
     <SafeAreaView style={styles.container}>
       <View style={styles.loadingContainer}>
         <ActivityIndicator size="large" color={colors.primary} />
       </View>
     </SafeAreaView>
   );
 }

 if (!merchantData) {
   return null;
 }

 return (
   <SafeAreaView style={styles.container}>
     <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
     
     <ScrollView
       showsVerticalScrollIndicator={false}
       refreshControl={
         <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
       }
     >
       {/* Header */}
       <View style={styles.header}>
         <TouchableOpacity onPress={() => navigation.goBack()}>
           <Text style={styles.backButton}>← Back</Text>
         </TouchableOpacity>
         <Text style={styles.title}>Merchant Dashboard</Text>
         <TouchableOpacity onPress={() => navigation.navigate('MerchantSettings')}>
           <Text style={styles.settingsIcon}>⚙️</Text>
         </TouchableOpacity>
       </View>

       {/* Business Info */}
       <View style={styles.businessCard}>
         <View style={styles.businessInfo}>
           <Text style={styles.businessName}>{merchantData.business_name}</Text>
           <Text style={styles.businessType}>{merchantData.business_type}</Text>
           <Text style={styles.merchantId}>ID: {merchantData.merchant_id}</Text>
         </View>
         <View style={[styles.statusBadge, 
           merchantData.status === 'approved' ? styles.approvedBadge : styles.pendingBadge
         ]}>
           <Text style={styles.statusText}>
             {merchantData.status === 'approved' ? '✓ Verified' : 'Pending'}
           </Text>
         </View>
       </View>

       {/* Today's Stats */}
       <View style={styles.statsSection}>
         <Text style={styles.sectionTitle}>Today's Performance</Text>
         <View style={styles.statsGrid}>
           <View style={styles.statCard}>
             <Text style={styles.statValue}>
               {todayStats.transaction_count}
             </Text>
             <Text style={styles.statLabel}>Transactions</Text>
           </View>
           <View style={styles.statCard}>
             <Text style={styles.statValue}>
               PKR {parseFloat(todayStats.total_revenue).toLocaleString()}
             </Text>
             <Text style={styles.statLabel}>Revenue</Text>
           </View>
         </View>
       </View>

       {/* Monthly Stats */}
       <View style={styles.statsSection}>
         <Text style={styles.sectionTitle}>This Month</Text>
         <View style={styles.monthlyCard}>
           <View style={styles.monthlyRow}>
             <Text style={styles.monthlyLabel}>Total Transactions</Text>
             <Text style={styles.monthlyValue}>
               {monthlyStats.transaction_count}
             </Text>
           </View>
           <View style={styles.monthlyRow}>
             <Text style={styles.monthlyLabel}>Total Revenue</Text>
             <Text style={styles.monthlyValueLarge}>
               PKR {parseFloat(monthlyStats.total_revenue).toLocaleString()}
             </Text>
           </View>
           <View style={styles.monthlyRow}>
             <Text style={styles.monthlyLabel}>Average Transaction</Text>
             <Text style={styles.monthlyValue}>
               PKR {monthlyStats.transaction_count > 0 
                 ? (monthlyStats.total_revenue / monthlyStats.transaction_count).toFixed(0)
                 : '0'}
             </Text>
           </View>
         </View>
       </View>

       {/* Quick Actions */}
       <View style={styles.actionsSection}>
         <Text style={styles.sectionTitle}>Quick Actions</Text>
         <View style={styles.actionsGrid}>
           <TouchableOpacity 
             style={styles.actionButton}
             onPress={() => setQrModalVisible(true)}
           >
             <Text style={styles.actionIcon}>📱</Text>
             <Text style={styles.actionText}>Generate QR</Text>
           </TouchableOpacity>
           
           <TouchableOpacity 
             style={styles.actionButton}
             onPress={() => navigation.navigate('MerchantTransactions')}
           >
             <Text style={styles.actionIcon}>📊</Text>
             <Text style={styles.actionText}>Transactions</Text>
           </TouchableOpacity>
           
           <TouchableOpacity 
             style={styles.actionButton}
             onPress={() => navigation.navigate('MerchantReports')}
           >
             <Text style={styles.actionIcon}>📈</Text>
             <Text style={styles.actionText}>Reports</Text>
           </TouchableOpacity>
           
           <TouchableOpacity 
             style={styles.actionButton}
             onPress={() => navigation.navigate('MerchantWithdraw')}
           >
             <Text style={styles.actionIcon}>💰</Text>
             <Text style={styles.actionText}>Withdraw</Text>
           </TouchableOpacity>
         </View>
       </View>

       {/* Recent Transactions */}
       <View style={styles.transactionsSection}>
         <View style={styles.transactionHeader}>
           <Text style={styles.sectionTitle}>Recent Transactions</Text>
           <TouchableOpacity onPress={() => navigation.navigate('MerchantTransactions')}>
             <Text style={styles.viewAllText}>View All →</Text>
           </TouchableOpacity>
         </View>
         
         {recentTransactions.length > 0 ? (
           recentTransactions.slice(0, 5).map((tx, index) => (
             <View key={index} style={styles.transactionItem}>
               <View style={styles.transactionLeft}>
                 <Text style={styles.transactionCustomer}>
                   {tx.customer_name || 'Customer'}
                 </Text>
                 <Text style={styles.transactionTime}>
                   {new Date(tx.created_at).toLocaleTimeString()}
                 </Text>
               </View>
               <Text style={styles.transactionAmount}>
                 +PKR {parseFloat(tx.amount).toLocaleString()}
               </Text>
             </View>
           ))
         ) : (
           <Text style={styles.emptyText}>No transactions yet today</Text>
         )}
       </View>
     </ScrollView>

     {/* QR Generation Modal */}
     {qrModalVisible && (
       <View style={styles.modalOverlay}>
         <View style={styles.modalContent}>
           <Text style={styles.modalTitle}>Generate Payment QR</Text>
           
           <View style={styles.inputContainer}>
             <Text style={styles.label}>Amount (PKR)</Text>
             <TextInput
               style={styles.input}
               placeholder="Enter amount"
               value={qrAmount}
               onChangeText={setQrAmount}
               keyboardType="numeric"
             />
           </View>
           
           <View style={styles.inputContainer}>
             <Text style={styles.label}>Description (Optional)</Text>
             <TextInput
               style={styles.input}
               placeholder="What is this payment for?"
               value={qrDescription}
               onChangeText={setQrDescription}
             />
           </View>
           
           <View style={styles.modalButtons}>
             <TouchableOpacity 
               style={styles.cancelButton}
               onPress={() => setQrModalVisible(false)}
             >
               <Text style={styles.cancelButtonText}>Cancel</Text>
             </TouchableOpacity>
             
             <TouchableOpacity 
               style={styles.generateButton}
               onPress={generateQRCode}
             >
               <Text style={styles.generateButtonText}>Generate</Text>
             </TouchableOpacity>
           </View>
         </View>
       </View>
     )}
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
 header: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'center',
   paddingHorizontal: 24,
   paddingVertical: 16
 },
 backButton: {
   ...typography.body,
   color: colors.primary
 },
 title: {
   ...typography.h3,
   color: colors.text
 },
 settingsIcon: {
   fontSize: 24
 },
 businessCard: {
   backgroundColor: colors.primary,
   marginHorizontal: 24,
   marginBottom: 20,
   padding: 20,
   borderRadius: 12,
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'center'
 },
 businessInfo: {
   flex: 1
 },
 businessName: {
   ...typography.h3,
   color: colors.secondary,
   marginBottom: 4
 },
 businessType: {
   ...typography.body,
   color: colors.secondary,
   opacity: 0.9,
   marginBottom: 4
 },
 merchantId: {
   ...typography.caption,
   color: colors.secondary,
   opacity: 0.8
 },
 statusBadge: {
   paddingHorizontal: 12,
   paddingVertical: 6,
   borderRadius: 20
 },
 approvedBadge: {
   backgroundColor: colors.success
 },
 pendingBadge: {
   backgroundColor: colors.accent
 },
 statusText: {
   ...typography.caption,
   color: colors.secondary,
   fontWeight: 'bold'
 },
 statsSection: {
   marginHorizontal: 24,
   marginBottom: 20
 },
 sectionTitle: {
   ...typography.body,
   fontWeight: 'bold',
   color: colors.text,
   marginBottom: 12
 },
 statsGrid: {
   flexDirection: 'row',
   gap: 12
 },
 statCard: {
   flex: 1,
   backgroundColor: colors.secondary,
   padding: 16,
   borderRadius: 12,
   alignItems: 'center'
 },
 statValue: {
   ...typography.h2,
   color: colors.primary,
   fontWeight: 'bold'
 },
 statLabel: {
   ...typography.caption,
   color: colors.textSecondary,
   marginTop: 4
 },
 monthlyCard: {
   backgroundColor: colors.secondary,
   padding: 16,
   borderRadius: 12
 },
 monthlyRow: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   marginBottom: 12
 },
 monthlyLabel: {
   ...typography.body,
   color: colors.textSecondary
 },
 monthlyValue: {
   ...typography.body,
   color: colors.text,
   fontWeight: '500'
 },
 monthlyValueLarge: {
   ...typography.body,
   color: colors.primary,
   fontWeight: 'bold',
   fontSize: 18
 },
 actionsSection: {
   marginHorizontal: 24,
   marginBottom: 20
 },
 actionsGrid: {
   flexDirection: 'row',
   flexWrap: 'wrap',
   gap: 12
 },
 actionButton: {
   width: '47%',
   backgroundColor: colors.secondary,
   padding: 20,
   borderRadius: 12,
   alignItems: 'center'
 },
 actionIcon: {
   fontSize: 32,
   marginBottom: 8
 },
 actionText: {
   ...typography.caption,
   color: colors.text,
   fontWeight: '600'
 },
 transactionsSection: {
   marginHorizontal: 24,
   marginBottom: 24
 },
 transactionHeader: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'center',
   marginBottom: 12
 },
 viewAllText: {
   ...typography.caption,
   color: colors.primary
 },
 transactionItem: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   backgroundColor: colors.secondary,
   padding: 16,
   borderRadius: 8,
   marginBottom: 8
 },
 transactionLeft: {
   flex: 1
 },
 transactionCustomer: {
   ...typography.body,
   color: colors.text
 },
 transactionTime: {
   ...typography.caption,
   color: colors.textSecondary
 },
 transactionAmount: {
   ...typography.body,
   color: colors.success,
   fontWeight: 'bold'
 },
 emptyText: {
   ...typography.body,
   color: colors.textSecondary,
   textAlign: 'center',
   paddingVertical: 20
 },
 modalOverlay: {
   position: 'absolute',
   top: 0,
   left: 0,
   right: 0,
   bottom: 0,
   backgroundColor: 'rgba(0,0,0,0.5)',
   justifyContent: 'center',
   padding: 24
 },
 modalContent: {
   backgroundColor: colors.background,
   borderRadius: 12,
   padding: 24
 },
 modalTitle: {
   ...typography.h3,
   color: colors.text,
   marginBottom: 20,
   textAlign: 'center'
 },
 inputContainer: {
   marginBottom: 16
 },
 label: {
   ...typography.caption,
   color: colors.text,
   marginBottom: 8
 },
 input: {
   ...typography.body,
   borderWidth: 1,
   borderColor: colors.border,
   borderRadius: 8,
   padding: 12,
   backgroundColor: colors.secondary
 },
 modalButtons: {
   flexDirection: 'row',
   gap: 12,
   marginTop: 20
 },
 cancelButton: {
   flex: 1,
   padding: 16,
   borderRadius: 8,
   backgroundColor: colors.secondary,
   alignItems: 'center'
 },
 cancelButtonText: {
   ...typography.body,
   color: colors.text
 },
 generateButton: {
   flex: 1,
   padding: 16,
   borderRadius: 8,
   backgroundColor: colors.primary,
   alignItems: 'center'
 },
 generateButtonText: {
   ...typography.body,
   color: colors.secondary,
   fontWeight: 'bold'
 }
});

export default MerchantDashboardScreen;
