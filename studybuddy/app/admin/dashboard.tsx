// File: studybuddy/app/admin/dashboard.tsx
// Description: Admin dashboard with KPI cards and overview statistics

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchDashboardStats } from '../../services/adminService';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalUsers: number;
  activeUsersToday: number;
  activeUsersWeek: number;
  totalSets: number;
  totalCards: number;
  userGrowth: Array<{ date: string; count: number }>;
  setCreationTrend: Array<{ date: string; count: number }>;
  topCreators: Array<{ username: string; learners: number; sets: number }>;
  topSets: Array<{ set_name: string; creator: string; learners: number }>;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsersToday: 0,
    activeUsersWeek: 0,
    totalSets: 0,
    totalCards: 0,
    userGrowth: [],
    setCreationTrend: [],
    topCreators: [],
    topSets: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Fetches dashboard statistics from the service
   */
  const fetchStats = async () => {
    try {
      console.log('[AdminDashboard] Fetching dashboard stats...');
      const data = await fetchDashboardStats();
      console.log('[AdminDashboard] Stats received:', data);
      setStats(data);
    } catch (error) {
      console.error('[AdminDashboard] Error fetching stats:', error);
      
      // Show specific error message based on error type
      let errorMessage = 'Failed to load dashboard data';
      if (error.message.includes('Authentication failed')) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (error.message.includes('Access denied')) {
        errorMessage = 'Access denied. Admin privileges required.';
      } else if (error.message.includes('Server error')) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message.includes('Network error')) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  /**
   * Renders a KPI card with title, value, and icon
   */
  const renderKPICard = (title: string, value: number, icon: string, color: string) => (
    <View style={[styles.kpiCard, { borderLeftColor: color }]}>
      <View style={styles.kpiHeader}>
        <Text style={styles.kpiIcon}>{icon}</Text>
        <Text style={styles.kpiTitle}>{title}</Text>
      </View>
      <Text style={styles.kpiValue}>{value.toLocaleString()}</Text>
    </View>
  );

  /**
   * Renders a simple chart placeholder
   */
  const renderChartPlaceholder = (title: string, data: any[], color: string) => (
    <View style={[styles.chartCard, { borderLeftColor: color }]}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.chartPlaceholder}>
        <Text style={styles.chartPlaceholderText}>📊 Chart Data</Text>
        <Text style={styles.chartDataText}>
          {data.length > 0 ? `${data.length} data points` : 'No data available'}
        </Text>
      </View>
    </View>
  );

  /**
   * Renders top creators list
   */
  const renderTopCreators = () => (
    <View style={styles.listCard}>
      <Text style={styles.listTitle}>🏆 Top Creators</Text>
      {stats.topCreators.length > 0 ? (
        stats.topCreators.slice(0, 5).map((creator, index) => (
          <View key={index} style={styles.listItem}>
            <View style={styles.listItemLeft}>
              <Text style={styles.listItemRank}>#{index + 1}</Text>
              <Text style={styles.listItemName}>{creator.username}</Text>
            </View>
            <View style={styles.listItemRight}>
              <Text style={styles.listItemValue}>{creator.learners} learners</Text>
              <Text style={styles.listItemSubtext}>{creator.sets} sets</Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No creator data available</Text>
      )}
    </View>
  );

  /**
   * Renders top sets list
   */
  const renderTopSets = () => (
    <View style={styles.listCard}>
      <Text style={styles.listTitle}>🔥 Top Sets</Text>
      {stats.topSets.length > 0 ? (
        stats.topSets.slice(0, 5).map((set, index) => (
          <View key={index} style={styles.listItem}>
            <View style={styles.listItemLeft}>
              <Text style={styles.listItemRank}>#{index + 1}</Text>
              <Text style={styles.listItemName} numberOfLines={1}>
                {set.set_name}
              </Text>
            </View>
            <View style={styles.listItemRight}>
              <Text style={styles.listItemValue}>{set.learners} learners</Text>
              <Text style={styles.listItemSubtext}>by {set.creator}</Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No set data available</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.loadingGradient}
        >
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
                    <Text style={styles.headerSubtitle}>FlashLearn Analytics Overview</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* KPI Cards */}
        <View style={styles.kpiSection}>
          <Text style={styles.sectionTitle}>📊 Key Performance Indicators</Text>
          <View style={styles.kpiGrid}>
            {renderKPICard('Total Users', stats.totalUsers, '👥', '#4facfe')}
            {renderKPICard('Active Today', stats.activeUsersToday, '🔥', '#00f2fe')}
            {renderKPICard('Active This Week', stats.activeUsersWeek, '📈', '#43e97b')}
            {renderKPICard('Total Sets', stats.totalSets, '📚', '#fa709a')}
          </View>
        </View>

        {/* Charts Section */}
        <View style={styles.chartsSection}>
          <Text style={styles.sectionTitle}>📈 Analytics Charts</Text>
          {renderChartPlaceholder('User Growth Over Time', stats.userGrowth, '#4facfe')}
          {renderChartPlaceholder('Set Creation Trend', stats.setCreationTrend, '#00f2fe')}
        </View>

        {/* Top Lists */}
        <View style={styles.listsSection}>
          <Text style={styles.sectionTitle}>🏆 Top Performers</Text>
          {renderTopCreators()}
          {renderTopSets()}
        </View>
      </ScrollView>
    </View>
  );
};

export default AdminDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    marginTop: 20,
  },
  kpiSection: {
    marginTop: 10,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  kpiCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    width: (width - 50) / 2,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  kpiTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  chartsSection: {
    marginTop: 10,
  },
  chartCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  chartPlaceholder: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  chartPlaceholderText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  chartDataText: {
    fontSize: 14,
    color: '#999',
  },
  listsSection: {
    marginTop: 10,
  },
  listCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listItemRank: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4facfe',
    marginRight: 10,
    minWidth: 30,
  },
  listItemName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  listItemRight: {
    alignItems: 'flex-end',
  },
  listItemValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  listItemSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});
