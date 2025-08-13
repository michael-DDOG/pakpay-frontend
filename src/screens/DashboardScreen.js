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
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../styles/colors';
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
        walletService.getTransactions(5, 0),
      ]);

      setBalance(balanceData?.balance ?? null);
      setTransactions(transactionsData?.transactions ?? []);
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
    if (!showBalance) return '••••••';
    if (amount == null || isNaN(Number(amount))) return `${t('common.pkr')} —`;
    return `${t('common.pkr')} ${Number(amount).toLocaleString('en-PK')}`;
  };

  const getTransactionSign = (tx) => (tx?.isSender ? '-' : '+');

  const getTransactionColor = (tx) => (tx?.isSender ? colors.error : colors.success);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return t('dashboard.today');
    if (date.toDateString() === yesterday.toDateString()) return t('dashboard.yesterday');
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
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

        {/* Balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t('dashboard.yourBalance')}</Text>
          <Text style={styles.balanceAmount}>{formatAmount(balance)}</Text>

          <TouchableOpacity
            style={styles.toggleBalance}
            onPress={() => setShowBalance((prev) => !prev)}
          >
            <Text style={styles.toggleText}>
              👁 {showBalance ? t('dashboard.hideBalance') : t('dashboard.showBalance')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Actions */}
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

        {/* Transactions */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>{t('dashboard.recentTransactions')}</Text>

          {transactions && transactions.length > 0 ? (
            transactions.map((tx) => (
              <TouchableOpacity key={tx.id} style={styles.transactionItem} activeOpacity={0.7}>
                <View style={styles.transactionLeft}>
                  <Text style={styles.transactionSign}>{getTransactionSign(tx)}</Text>
                  <View>
                    <Text style={styles.transactionName}>{tx.counterparty}</Text>
                    <Text style={styles.transactionDate}>{formatDate(tx.createdAt)}</Text>
                  </View>
                </View>

                <Text style={[styles.transactionAmount, { color: getTransactionColor(tx) }]}>
                  {getTransactionSign(tx)} {t('common.pkr')} {Number(tx.amount).toLocaleString('en-PK')}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noTransactions}>{t('dashboard.noRecentTransactions') || 'No recent transactions'}</Text>
          )}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutText}>{t('common.signOut') || 'Sign out'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors?.background || '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 16,
  },
  header: {
    marginTop: 8,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuIcon: {
    fontSize: 22,
  },
  notificationIcon: {
    position: 'relative',
    padding: 6,
  },
  bellIcon: {
    fontSize: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors?.error || '#E63946',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  greeting: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '700',
    color: colors?.textPrimary || '#111',
  },
  balanceCard: {
    backgroundColor: colors?.card || '#F6F7FB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors?.textSecondary || '#666',
    marginBottom: 6,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: colors?.textPrimary || '#111',
  },
  toggleBalance: {
    marginTop: 10,
  },
  toggleText: {
    fontSize: 14,
    color: colors?.primary || '#0A84FF',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors?.primaryLight || '#E8F1FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors?.textPrimary || '#111',
  },
  transactionsSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    color: colors?.textPrimary || '#111',
  },
  transactionItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  transactionSign: {
    width: 22,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
  },
  transactionName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors?.textPrimary || '#111',
  },
  transactionDate: {
    fontSize: 12,
    color: colors?.textSecondary || '#666',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  noTransactions: {
    fontSize: 14,
    color: colors?.textSecondary || '#666',
  },
  signOutButton: {
    backgroundColor: colors?.error || '#E63946',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default DashboardScreen;
