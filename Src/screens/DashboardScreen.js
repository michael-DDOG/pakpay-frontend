import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import { walletService } from '../services/walletService';
import AuthContext from '../context/AuthContext';
import LanguageToggle from '../components/LanguageToggle';

const DashboardScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { userData, signOut } = useContext(AuthContext);
  
  const [balance, setBalance] = useState(null);
  const [showBalance, setShowBalance] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [balanceData, transactionsData] = await Promise.all([
        walletService.getBalance(),
        walletService.getTransactions(5, 0)
      ]);
      
      setBalance(balanceData.balance);
      setTransactions(transactionsData.transactions);
    } catch (error) {
      console.error('Load dashboard error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const formatAmount = (amount) => {
    if (!showBalance) {
      return '••••••';
    }
    return `${t('common.pkr')} ${parseFloat(amount).toLocaleString('en-PK')}`;
  };

  const getTransactionSign = (transaction) => {
    return transaction.isSender ? '-' : '+';
  };

  const getTransactionColor = (transaction) => {
    return transaction.isSender ? colors.error : colors.success;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return t('dashboard.today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('dashboard.yesterday');
    }
    
    return date.toLocaleDateString('en-PK');
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => console.log('Menu')}>
              <Text style={styles.menuIcon}>☰</Text>
            </TouchableOpacity>
            
            <LanguageToggle />
            
            <TouchableOpacity onPress={() => console.log('Notifications')}>
              <View style={styles.notificationIcon}>
                <Text style={styles.bellIcon}>🔔</Text>
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>2</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.greeting}>
            {t('dashboard.goodMorning')}, {userData?.firstName || 'User'}
          </Text>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t('dashboard.yourBalance')}</Text>
          <Text style={styles.balanceAmount}>{formatAmount(balance)}</Text>
          
          <TouchableOpacity
            style={styles.toggleBalance}
            onPress={() => setShowBalance(!showBalance)}
          >
            <Text style={styles.toggleText}>
              👁 {showBalance ? t('dashboard.hideBalance') : t('dashboard.showBalance')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>↗</Text>
            </View>
            <Text style={styles.actionText}>{t('dashboard.send')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>↙</Text>
            </View>
            <Text style={styles.actionText}>{t('dashboard.receive')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>{t('dashboard.recentTransactions')}</Text>
          
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <TouchableOpacity
                key={transaction.id}
                style={styles.transactionItem}
                activeOpacity={0.7}
              >
                <View style={styles.transactionLeft}>
                  <Text style={styles.transactionSign}>
                    {getTransactionSign(transaction)}
                  </Text>
                  <View>
                    <Text style={styles.transactionName}>
                      {transaction.counterparty}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatDate(transaction.createdAt)}
                    </Text>
                  </View>
                </View>
                
                <Text
                  style={[
                    styles.transactionAmount,
                    { color: getTransactionColor(transaction) }
                  ]}
                >
                  {getTransactionSign(transaction)} {t('common.pkr')} {transaction.amount}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noTransactions}>No recent transactions</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={signOut}
        >
          <Text style={styles
