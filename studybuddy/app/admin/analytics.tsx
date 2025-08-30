// File: studybuddy/app/admin/analytics.tsx
// Description: Admin analytics with subject analytics and engagement metrics

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchAnalytics } from '../../services/adminService';

const { width } = Dimensions.get('window');

interface SubjectAnalytics {
  subject: string;
  sets_count: number;
  total_learners: number;
  engagement_rate: number;
}

interface AnalyticsData {
  subjectAnalytics: SubjectAnalytics[];
  totalEngagement: number;
  averageEngagement: number;
  topSubject: string;
  mostEngagedSubject: string;
}

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    subjectAnalytics: [],
    totalEngagement: 0,
    averageEngagement: 0,
    topSubject: '',
    mostEngagedSubject: '',
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Fetches analytics data from the service
   */
  const fetchAnalyticsData = async () => {
    try {
      console.log('[AdminAnalytics] Fetching analytics data...');
      const data = await fetchAnalytics();
      console.log('[AdminAnalytics] Analytics data received:', data);
      setAnalytics(data);
    } catch (error) {
      console.error('[AdminAnalytics] Error fetching analytics:', error);
      
      // Show specific error message based on error type
      let errorMessage = 'Failed to load analytics data';
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
    fetchAnalyticsData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalyticsData();
  };

  /**
   * Renders a subject analytics card
   */
  const renderSubjectCard = (subject: SubjectAnalytics, index: number) => {
    const colors = ['#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#ffa726'];
    const color = colors[index % colors.length];

    return (
      <View key={subject.subject} style={[styles.subjectCard, { borderLeftColor: color }]}>
        <View style={styles.subjectHeader}>
          <Text style={styles.subjectName}>{subject.subject}</Text>
          <Text style={styles.subjectRank}>#{index + 1}</Text>
        </View>
        
        <View style={styles.subjectStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{subject.sets_count}</Text>
            <Text style={styles.statLabel}>Sets</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{subject.total_learners}</Text>
            <Text style={styles.statLabel}>Learners</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{subject.engagement_rate.toFixed(1)}%</Text>
            <Text style={styles.statLabel}>Engagement</Text>
          </View>
        </View>
      </View>
    );
  };

  /**
   * Renders overview statistics
   */
  const renderOverviewStats = () => (
    <View style={styles.overviewSection}>
      <Text style={styles.sectionTitle}>📊 Overview Statistics</Text>
      <View style={styles.overviewGrid}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewIcon}>🎯</Text>
          <Text style={styles.overviewValue}>{analytics.totalEngagement}</Text>
          <Text style={styles.overviewLabel}>Total Engagement</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewIcon}>📈</Text>
          <Text style={styles.overviewValue}>{analytics.averageEngagement.toFixed(1)}%</Text>
          <Text style={styles.overviewLabel}>Avg Engagement</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewIcon}>🏆</Text>
          <Text style={styles.overviewValue}>{analytics.topSubject}</Text>
          <Text style={styles.overviewLabel}>Top Subject</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewIcon}>🔥</Text>
          <Text style={styles.overviewValue}>{analytics.mostEngagedSubject}</Text>
          <Text style={styles.overviewLabel}>Most Engaged</Text>
        </View>
      </View>
    </View>
  );

  /**
   * Renders subject analytics section
   */
  const renderSubjectAnalytics = () => (
    <View style={styles.subjectsSection}>
      <Text style={styles.sectionTitle}>📚 Subject Analytics</Text>
      {analytics.subjectAnalytics.length > 0 ? (
        analytics.subjectAnalytics.map((subject, index) => 
          renderSubjectCard(subject, index)
        )
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No Subject Data</Text>
          <Text style={styles.emptyDescription}>
            Subject analytics will appear here once sets are created
          </Text>
        </View>
      )}
    </View>
  );

  /**
   * Renders engagement insights
   */
  const renderEngagementInsights = () => (
    <View style={styles.insightsSection}>
      <Text style={styles.sectionTitle}>💡 Engagement Insights</Text>
      <View style={styles.insightsCard}>
        <Text style={styles.insightsTitle}>Key Findings</Text>
        <View style={styles.insightItem}>
          <Text style={styles.insightIcon}>📈</Text>
          <Text style={styles.insightText}>
            {analytics.topSubject} has the most sets created
          </Text>
        </View>
        <View style={styles.insightItem}>
          <Text style={styles.insightIcon}>🔥</Text>
          <Text style={styles.insightText}>
            {analytics.mostEngagedSubject} shows highest learner engagement
          </Text>
        </View>
        <View style={styles.insightItem}>
          <Text style={styles.insightIcon}>📊</Text>
          <Text style={styles.insightText}>
            Average engagement rate is {analytics.averageEngagement.toFixed(1)}%
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.loadingGradient}
        >
          <Text style={styles.loadingText}>Loading Analytics...</Text>
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
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>Subject Performance & Engagement</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Statistics */}
        {renderOverviewStats()}

        {/* Subject Analytics */}
        {renderSubjectAnalytics()}

        {/* Engagement Insights */}
        {renderEngagementInsights()}
      </ScrollView>
    </View>
  );
};

export default AdminAnalytics;

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
  overviewSection: {
    marginTop: 10,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  overviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    width: (width - 50) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  subjectsSection: {
    marginTop: 10,
  },
  subjectCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subjectRank: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4facfe',
  },
  subjectStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4facfe',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  insightsSection: {
    marginTop: 10,
  },
  insightsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  insightText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  emptyContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
