// File: studybuddy/app/quiz/quiz-results.tsx
// Description: Comprehensive quiz results screen with detailed history and analysis

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const QuizResultsScreen = () => {
  const { quizData } = useLocalSearchParams();
  const router = useRouter();
  const [quizResult, setQuizResult] = useState(null);
  const [previousBest, setPreviousBest] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (quizData) {
      const result = JSON.parse(quizData);
      setQuizResult(result);
      setPreviousBest(result.previousBestScore || 0);
      
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }
  }, [quizData]);

  const getScoreColor = (score) => {
    if (score >= 90) return '#4CAF50';
    if (score >= 80) return '#2196F3';
    if (score >= 70) return '#FF9800';
    return '#F44336';
  };

  const getPerformanceMessage = (score, improvement) => {
    if (improvement > 0) return `🎉 ${improvement}% improvement!`;
    if (improvement < 0) return `📉 ${Math.abs(improvement)}% decrease`;
    if (score >= 90) return '🌟 Outstanding performance!';
    if (score >= 80) return '👏 Great job!';
    if (score >= 70) return '💪 Good effort!';
    return '📚 Keep practicing!';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!quizResult) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.gradient}
        />
        <Text style={styles.loadingText}>Loading results...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Image source={require('../../assets/images/close.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quiz Results</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Main Score Card */}
        <View style={styles.scoreCard}>
          <Text style={styles.completedText}>Quiz Completed! 🎯</Text>
          <Text style={styles.setName}>{quizResult.setName}</Text>
          
          <View style={styles.mainScore}>
            <Text style={[styles.scoreText, { color: getScoreColor(quizResult.score) }]}>
              {quizResult.score}%
            </Text>
            <Text style={styles.scoreSubtext}>
              {quizResult.correctAnswers}/{quizResult.totalQuestions} correct
            </Text>
          </View>

          <Text style={styles.performanceMessage}>
            {getPerformanceMessage(quizResult.score, quizResult.improvement)}
          </Text>
        </View>

        {/* Performance Metrics */}
        <View style={styles.metricsCard}>
          <Text style={styles.cardTitle}>📊 Performance Metrics</Text>
          
          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{formatTime(quizResult.totalTime)}</Text>
              <Text style={styles.metricLabel}>Total Time</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{formatTime(Math.round(quizResult.averageResponseTime / 1000))}</Text>
              <Text style={styles.metricLabel}>Avg Response</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{quizResult.timeUpCount}</Text>
              <Text style={styles.metricLabel}>Time Outs</Text>
            </View>
          </View>

          {/* Progress Comparison */}
          {previousBest > 0 && (
            <View style={styles.comparisonSection}>
              <Text style={styles.comparisonTitle}>📈 Score Comparison</Text>
              <View style={styles.comparisonBar}>
                <View style={styles.previousScore}>
                  <View style={[styles.scoreBar, { width: `${(previousBest/100)*100}%`, backgroundColor: '#E0E0E0' }]} />
                  <Text style={styles.comparisonLabel}>Previous Best: {previousBest}%</Text>
                </View>
                <View style={styles.currentScore}>
                  <View style={[styles.scoreBar, { width: `${(quizResult.score/100)*100}%`, backgroundColor: getScoreColor(quizResult.score) }]} />
                  <Text style={styles.comparisonLabel}>Current: {quizResult.score}%</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Detailed Answer Review */}
        <View style={styles.reviewCard}>
          <Text style={styles.cardTitle}>📝 Answer Review</Text>
          {quizResult.userAnswers.map((answer, index) => (
            <View key={index} style={styles.answerItem}>
              <View style={styles.answerHeader}>
                <Text style={styles.questionNumber}>Q{index + 1}</Text>
                <View style={[styles.answerStatus, { backgroundColor: answer.isCorrect ? '#4CAF50' : '#F44336' }]}>
                  <Text style={styles.answerStatusText}>
                    {answer.isCorrect ? '✓' : '✗'}
                  </Text>
                </View>
                <Text style={styles.responseTime}>
                  {formatTime(Math.round(answer.responseTime / 1000))}
                </Text>
              </View>
              
              <Text style={styles.questionText}>{answer.question}</Text>
              
              <View style={styles.answerComparison}>
                <View style={styles.answerSection}>
                  <Text style={styles.answerLabel}>Your Answer:</Text>
                  <Text style={[styles.answerText, { color: answer.isCorrect ? '#4CAF50' : '#F44336' }]}>
                    {answer.userAnswer || '(No answer)'}
                  </Text>
                </View>
                
                {!answer.isCorrect && (
                  <View style={styles.answerSection}>
                    <Text style={styles.answerLabel}>Correct Answer:</Text>
                    <Text style={[styles.answerText, { color: '#4CAF50' }]}>
                      {answer.correctAnswer}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <LinearGradient
              colors={['#4facfe', '#00f2fe']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.homeButton}
            onPress={() => router.push('/(tabs)/home')}
          >
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

export default QuizResultsScreen;

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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 100,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scoreCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  completedText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  setName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  mainScore: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 64,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scoreSubtext: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  performanceMessage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  metricsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4facfe',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
  },
  comparisonSection: {
    marginTop: 20,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  comparisonBar: {
    gap: 10,
  },
  previousScore: {
    marginBottom: 8,
  },
  currentScore: {
    marginBottom: 8,
  },
  scoreBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  comparisonLabel: {
    fontSize: 12,
    color: '#666',
  },
  reviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  answerItem: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4facfe',
    marginRight: 10,
  },
  answerStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  answerStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  responseTime: {
    fontSize: 12,
    color: '#666',
    marginLeft: 'auto',
  },
  questionText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    fontWeight: '500',
  },
  answerComparison: {
    gap: 8,
  },
  answerSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  answerLabel: {
    fontSize: 12,
    color: '#666',
    width: 80,
  },
  answerText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  actionButtons: {
    paddingBottom: 30,
    gap: 15,
  },
  retryButton: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  homeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: 'center',
  },
  homeButtonText: {
    color: '#4facfe',
    fontSize: 16,
    fontWeight: '600',
  },
});
