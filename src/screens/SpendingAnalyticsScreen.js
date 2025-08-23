// screens/SpendingAnalyticsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import api from '../services/api';

const { width } = Dimensions.get('window');

const SpendingAnalyticsScreen = ({ navigation }) => {
  const [timeRange, setTimeRange] = useState('week'); // week, month, year
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/analytics/spending?range=${timeRange}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Load analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  const categoryColors = {
    transfer: '#4CAF50',
    bills: '#2196F3',
    remittance: '#FF9800',
    savings: '#9C27B0',
    qr_payment: '#00BCD4',
    request_payment: '#FFEB3B',
    other: '#607D8B'
  };

  const getCategoryName = (category) => {
    const names = {
      transfer: 'Transfers',
      bills: 'Bill Payments',
      remittance: 'Remittance',
      savings: 'Savings',
      qr_payment: 'QR Payments',
      request_payment: 'Request Payments',
      other: 'Other'
    };
    return names[category] || category;
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

  if (!analytics) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Failed to load analytics</Text>
      </SafeAreaView>
    );
  }

  const renderSummaryCards = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.summaryCards}
    >
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Spent</Text>
        <Text style={styles.summaryAmount}>
          PKR {analytics.totalSpent.toLocaleString()}
        </Text>
        <Text style={styles.summaryChange}>
          {analytics.percentageChange > 0 ? '↑' : '↓'} {Math.abs(analytics.percentageChange)}%
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Average Daily</Text>
        <Text style={styles.summaryAmount}>
          PKR {analytics.averageDaily.toLocaleString()}
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Transactions</Text>
        <Text style={styles.summaryAmount}>{analytics.transactionCount}</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Largest Expense</Text>
        <Text style={styles.summaryAmount}>
          PKR {analytics.largestExpense.toLocaleString()}
        </Text>
      </View>
    </ScrollView>
  );

  const renderSpendingTrend = () => {
    if (!analytics.trendData || analytics.trendData.labels.length === 0) {
      return null;
    }

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Spending Trend</Text>
        <LineChart
          data={{
            labels: analytics.trendData.labels,
            datasets: [{
              data: analytics.trendData.values
            }]
          }}
          width={width - 48}
          height={200}
          chartConfig={{
            backgroundColor: colors.secondary,
            backgroundGradientFrom: colors.secondary,
            backgroundGradientTo: colors.secondary,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 168, 107, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
            style: {
              borderRadius: 16
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: colors.primary
            }
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16
          }}
        />
      </View>
    );
  };

  const renderCategoryBreakdown = () => {
    if (!analytics.categoryBreakdown || analytics.categoryBreakdown.length === 0) {
      return null;
    }

    const pieData = analytics.categoryBreakdown.map(item => ({
      name: getCategoryName(item.category),
      amount: item.amount,
      color: categoryColors[item.category] || '#999',
      legendFontColor: colors.text,
      legendFontSize: 12
    }));

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Category Breakdown</Text>
        <PieChart
          data={pieData}
          width={width - 48}
          height={220}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`
          }}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
        
        <View style={styles.categoryList}>
          {analytics.categoryBreakdown.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.categoryItem}
              onPress={() => setSelectedCategory(
                selectedCategory === item.category ? null : item.category
              )}
            >
              <View style={styles.categoryLeft}>
                <View 
                  style={[
                    styles.categoryDot,
                    { backgroundColor: categoryColors[item.category] }
                  ]}
                />
                <Text style={styles.categoryName}>
                  {getCategoryName(item.category)}
                </Text>
              </View>
              <View style={styles.categoryRight}>
                <Text style={styles.categoryAmount}>
                  PKR {item.amount.toLocaleString()}
                </Text>
                <Text style={styles.categoryPercentage}>
                  {item.percentage.toFixed(1)}%
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderTopMerchants = () => {
    if (!analytics.topMerchants || analytics.topMerchants.length === 0) {
      return null;
    }

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Top Recipients</Text>
        {analytics.topMerchants.map((merchant, index) => (
          <View key={index} style={styles.merchantItem}>
            <Text style={styles.merchantRank}>#{index + 1}</Text>
            <View style={styles.merchantInfo}>
              <Text style={styles.merchantName}>{merchant.name}</Text>
              <Text style={styles.merchantTransactions}>
                {merchant.transactionCount} transactions
              </Text>
            </View>
            <Text style={styles.merchantAmount}>
              PKR {merchant.totalAmount.toLocaleString()}
            </Text>
          </View>
        ))}
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
        <Text style={styles.title}>Spending Analytics</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.timeRangeTabs}>
        {['week', 'month', 'year'].map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.timeRangeTab,
              timeRange === range && styles.timeRangeTabActive
            ]}
            onPress={() => setTimeRange(range)}
          >
            <Text style={[
              styles.timeRangeText,
              timeRange === range && styles.timeRangeTextActive
            ]}>
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSummaryCards()}
        {renderSpendingTrend()}
        {renderCategoryBreakdown()}
        {renderTopMerchants()}
        
        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>💡 Insights</Text>
          {analytics.insights && analytics.insights.map((insight, index) => (
            <Text key={index} style={styles.insightText}>• {insight}</Text>
          ))}
        </View>
      </ScrollView>
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
  timeRangeTabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.secondary
  },
  timeRangeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8
  },
  timeRangeTabActive: {
    backgroundColor: colors.primary
  },
  timeRangeText: {
    ...typography.body,
    color: colors.textSecondary
  },
  timeRangeTextActive: {
    color: colors.secondary,
    fontWeight: 'bold'
  },
  content: {
    flex: 1
  },
  summaryCards: {
    paddingVertical: 16
  },
  summaryCard: {
    backgroundColor: colors.secondary,
    padding: 16,
    marginLeft: 24,
    marginRight: 8,
    borderRadius: 12,
    minWidth: 150
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 8
  },
  summaryAmount: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold'
  },
  summaryChange: {
    ...typography.caption,
    color: colors.success,
    marginTop: 4
  },
  chartContainer: {
    marginHorizontal: 24,
    marginBottom: 24
  },
  chartTitle: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16
  },
  categoryList: {
    marginTop: 16
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12
  },
  categoryName: {
    ...typography.body,
    color: colors.text
  },
  categoryRight: {
    alignItems: 'flex-end'
  },
  categoryAmount: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text
  },
  categoryPercentage: {
    ...typography.caption,
    color: colors.textSecondary
  },
  merchantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  merchantRank: {
    ...typography.body,
    color: colors.primary,
    fontWeight: 'bold',
    width: 30
  },
  merchantInfo: {
    flex: 1,
    marginLeft: 12
  },
  merchantName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500'
  },
  merchantTransactions: {
    ...typography.caption,
    color: colors.textSecondary
  },
  merchantAmount: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text
  },
  insightCard: {
    backgroundColor: colors.primary + '10',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + '30'
  },
  insightTitle: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12
  },
  insightText: {
    ...typography.body,
    color: colors.text,
    marginBottom: 8,
    lineHeight: 20
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
    marginTop: 50
  }
});

export default SpendingAnalyticsScreen;
