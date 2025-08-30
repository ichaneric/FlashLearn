// File: studybuddy/app/(tabs)/quiz.tsx
// Description: Quiz history and progress tracking screen with grouped results and bar graphs

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadQuizRecords, clearQuizRecords } from '../../utils/quizStorage';

const { width } = Dimensions.get('window');

const QuizHistoryScreen = () => {
  const router = useRouter();
  const [groupedQuizzes, setGroupedQuizzes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Color palette for bar graphs
  const colors = ['#FF6B9D', '#FF9F5A', '#4ECDC4', '#A8E6CF', '#FFD3B6'];

  useEffect(() => {
    loadQuizHistory();
  }, []);

  /**
   * Loads quiz history from AsyncStorage and groups by set
   * Uses user-scoped storage with backward compatibility
   */
  const loadQuizHistory = async () => {
    try {
      const records = await loadQuizRecords();
      
      if (records.length > 0) {
        // Sort by completion date (newest first)
        records.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
        
        // Group quizzes by set
        const grouped = groupQuizzesBySet(records);
        setGroupedQuizzes(grouped);
      } else {
        setGroupedQuizzes([]);
      }
    } catch (error) {
      console.error('[loadQuizHistory] Error:', error);
      Alert.alert('Error', 'Failed to load quiz history');
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Groups quiz records by set and processes them for display
   */
  const groupQuizzesBySet = (records: any[]) => {
    const groups: { [key: string]: any } = {};
    
    records.forEach(record => {
      const key = record.setId || record.set_id || 'unknown';
      if (!groups[key]) {
        groups[key] = {
          setId: key,
          setName: record.setName || 'Unknown Set',
          subject: record.subject || 'General',
          quizzes: []
        };
      }
      groups[key].quizzes.push(record);
    });

    // Convert to array, assign attempt numbers chronologically, then sort groups by latest attempt
    return Object.values(groups)
      .map(group => {
        // Oldest -> Newest to assign attempt numbers
        const chronological = [...group.quizzes]
          .sort((a: any, b: any) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
          .map((q: any, idx: number) => ({ ...q, attemptNumber: idx + 1 }));

        // Default order for rendering lists: newest first; attemptNumber is preserved on items
        const newestFirst = [...chronological]
          .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

        return { ...group, quizzes: newestFirst };
      })
      .sort((a: any, b: any) => new Date(b.quizzes[0].completedAt).getTime() - new Date(a.quizzes[0].completedAt).getTime());
  };

  /**
   * Handles refresh action
   */
  const onRefresh = () => {
    setRefreshing(true);
    loadQuizHistory();
  };

  /**
   * Clears all quiz history for the current user
   */
  const clearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all quiz history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await clearQuizRecords();
              if (success) {
                setGroupedQuizzes([]);
                Alert.alert('Success', 'Quiz history cleared successfully');
              } else {
                Alert.alert('Error', 'Failed to clear history');
              }
            } catch (error) {
              console.error('[clearHistory] Error:', error);
              Alert.alert('Error', 'Failed to clear history');
            }
          },
        },
      ]
    );
  };

  /**
   * Formats time duration
   */
  const formatTime = (seconds) => {
    const safeSeconds = seconds || 0;
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Calculates accuracy percentage
   */
  const calculateAccuracy = (correct, total) => {
    if (!total || total === 0) return 0;
    return Math.round((correct / total) * 100);
  };

  /**
   * Returns ordinal labels like 1st, 2nd, 3rd, 4th, 11th, etc.
   */
  const toOrdinal = (n: number) => {
    const v = n % 100;
    if (v >= 11 && v <= 13) return `${n}th`;
    switch (n % 10) {
      case 1: return `${n}st`;
      case 2: return `${n}nd`;
      case 3: return `${n}rd`;
      default: return `${n}th`;
    }
  };

  /**
   * Renders a bar graph for multiple quiz attempts
   */
  const renderBarGraph = (quizzes) => {
    // Safety check for empty quizzes
    if (!quizzes || quizzes.length === 0) {
      return null;
    }

    // Sort by completion date (oldest first) to get chronological order
    const chronologicalQuizzes = [...quizzes]
      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
    
    // Get the last 3 attempts (most recent)
    const recentQuizzes = chronologicalQuizzes.slice(-3);
    
    // Calculate max score based on total questions, with intelligent scaling
    const maxPossibleScore = Math.max(...recentQuizzes.map(q => q.totalQuestions || 0));
    const actualMaxScore = Math.max(...recentQuizzes.map(q => q.score !== undefined ? q.score : (q.correctAnswers || 0)));
    
    // Use the higher of actual max score or 80% of max possible for better visual scaling
    const maxScore = Math.max(actualMaxScore, Math.ceil(maxPossibleScore * 0.8), 1); // Ensure minimum of 1
    
    // Ultra-compact graph dimensions to fit perfectly within container
    const graphHeight = Math.min(70, Math.max(60, width * 0.15)); // Even smaller height: 60-70px
    const availableWidth = width - 140; // More space reserved for y-axis
    const barWidth = Math.min(30, Math.max(15, availableWidth / (recentQuizzes.length + 2))); // Ultra-compact bars: 15-30px width
    const barSpacing = Math.max(6, (availableWidth - (barWidth * recentQuizzes.length)) / (recentQuizzes.length + 1)); // Minimal spacing

    return (
      <View style={styles.barGraphContainer}>
        <Text style={styles.graphTitle}>{recentQuizzes[0]?.setName || 'Quiz'} Results</Text>
        <View style={[styles.graphContainer, { height: graphHeight + 100 }]}>
          <View style={styles.yAxis}>
            <Text style={styles.yAxisLabel}>Score</Text>
            <Text style={styles.yAxisValue}>{maxScore}</Text>
            <Text style={styles.yAxisValue}>{Math.round(maxScore / 2)}</Text>
            <Text style={styles.yAxisValue}>0</Text>
          </View>
                     <View style={[styles.barsContainer, { paddingHorizontal: barSpacing }]}>
            {recentQuizzes.map((quiz, index) => {
              // Use score if available, otherwise fall back to correctAnswers
              const correctAnswers = quiz.score !== undefined ? quiz.score : (quiz.correctAnswers || 0);
              const height = maxScore > 0 ? Math.max((correctAnswers / maxScore) * graphHeight, 8) : 8; // Ensure minimum height
              
              // Calculate the actual attempt number based on chronological order
              const attemptNumber = chronologicalQuizzes.indexOf(quiz) + 1;
              
              return (
                                 <View key={index} style={[styles.barColumn, { 
                   width: barWidth + barSpacing,
                   marginHorizontal: barSpacing / 4
                 }]}>
                   <View style={[styles.bar, { 
                     height: height, // Height already calculated with minimum
                     backgroundColor: colors[index % colors.length],
                     width: barWidth * 0.75, // Thinner bars for ultra-compact layout
                     borderRadius: Math.max(1, barWidth * 0.08) // Smaller border radius
                   }]} />
                  <Text style={styles.barLabel}>{toOrdinal(attemptNumber)}</Text>
                  <Text style={styles.barValue}>{correctAnswers}</Text>
                </View>
              );
            })}
          </View>
        </View>
        <View style={styles.xAxis}>
          <Text style={styles.xAxisLabel}>Takes</Text>
        </View>
      </View>
    );
  };

  /**
   * Renders a single quiz result (for tests taken only once)
   */
  const renderSingleQuizResult = (quiz) => {
    // Use score if available, otherwise fall back to correctAnswers
    const correctAnswers = quiz.score !== undefined ? quiz.score : (quiz.correctAnswers || 0);
    const accuracy = calculateAccuracy(correctAnswers, quiz.totalQuestions || 0);
    const duration = quiz.timeTaken || 0;

    return (
      <View style={styles.singleQuizContainer}>
        <View style={styles.quizInfo}>
          <Text style={styles.quizTitle}>{quiz.setName}</Text>
          <Text style={styles.quizSubject}>{quiz.subject || 'General'}</Text>
        </View>
        <View style={styles.quizStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{correctAnswers}/{quiz.totalQuestions || 0}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatTime(duration)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{accuracy}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
        </View>
      </View>
    );
  };

  /**
   * Renders a grouped quiz item
   */
  const renderGroupedQuizItem = ({ item }) => {
    const hasMultipleAttempts = item.quizzes.length > 1;
    const latestQuiz = item.quizzes[0];
    const totalAccuracy = calculateAccuracy(
      item.quizzes.reduce((sum, q) => sum + (q.score !== undefined ? q.score : (q.correctAnswers || 0)), 0),
      item.quizzes.reduce((sum, q) => sum + (q.totalQuestions || 0), 0)
    );
    const totalTime = item.quizzes.reduce((sum, q) => sum + (q.timeTaken || 0), 0);

    return (
      <View style={styles.quizCard}>
        <View style={styles.cardHeader}>
          <View style={styles.setInfo}>
            <Text style={styles.setName} numberOfLines={2}>{item.setName}</Text>
            <Text style={styles.setSubject}>{item.subject}</Text>
          </View>
        </View>

        {hasMultipleAttempts ? (
          // Show bar graph for multiple attempts
          <>
            {renderBarGraph(item.quizzes)}
            <View style={styles.overallStats}>
              <Text style={styles.overallStatLabel}>Accuracy : {totalAccuracy}%</Text>
              <Text style={styles.overallStatLabel}>Total Time: {formatTime(totalTime)}</Text>
            </View>
          </>
        ) : (
          // Show single quiz result
          renderSingleQuizResult(latestQuiz)
        )}
      </View>
    );
  };

  /**
   * Renders empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image source={require('../../assets/images/bulb.png')} style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>No Quiz History Yet</Text>
      <Text style={styles.emptyDescription}>
        Take your first quiz to see your progress and track your learning journey!
      </Text>
      <TouchableOpacity 
        style={styles.emptyButton}
        onPress={() => router.push('/(tabs)/home')}
      >
        <LinearGradient
          colors={['#4facfe', '#00f2fe']}
          style={styles.emptyButtonGradient}
        >
          <Text style={styles.emptyButtonText}>Explore Sets</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quiz History</Text>
        {groupedQuizzes.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quiz History List */}
      <FlatList
        data={groupedQuizzes}
        renderItem={renderGroupedQuizItem}
        keyExtractor={(item) => item.setId}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
            colors={['#4facfe']}
          />
        }
      />
    </View>
  );
};

export default QuizHistoryScreen;

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  clearButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statsOverview: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  overallStat: {
    alignItems: 'center',
  },
  overallStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4facfe',
    marginBottom: 4,
  },
  additionalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  additionalStat: {
    alignItems: 'center',
  },
  additionalStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  additionalStatLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  quizCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  setInfo: {
    flex: 1,
    marginRight: 15,
  },
  setName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  setSubject: {
    fontSize: 14,
    color: '#666',
  },
  quizMode: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  scoreCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreEmoji: {
    fontSize: 16,
    marginTop: 2,
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  improvementBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  improvementText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    tintColor: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 30,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  emptyButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyButtonGradient: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    alignItems: 'center',
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  barGraphContainer: {
    marginTop: 15,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  graphContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minHeight: 70,
  },
  yAxis: {
    alignItems: 'center',
    paddingRight: 8,
    justifyContent: 'space-between',
    height: '100%',
  },
  yAxisLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  yAxisValue: {
    fontSize: 10,
    color: '#333',
    marginBottom: 6,
    fontWeight: '500',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    flex: 1,
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 20,
    maxWidth: 40,
  },
  bar: {
    borderRadius: 4,
    marginTop: 5,
    minHeight: 8,
  },
  barLabel: {
    fontSize: 9,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  barValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 1,
  },
  xAxis: {
    marginTop: 10,
    alignItems: 'center',
  },
  xAxisLabel: {
    fontSize: 12,
    color: '#666',
  },
  singleQuizContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quizInfo: {
    marginBottom: 10,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  quizSubject: {
    fontSize: 13,
    color: '#666',
  },
  quizStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  overallStats: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  overallStatLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});