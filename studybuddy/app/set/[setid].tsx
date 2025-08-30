// File: studybuddy/app/set/[setid].tsx
// Description: Simple and clean flashcard viewer with enhanced readability

import { StyleSheet, Text, View, TouchableOpacity, Image, Dimensions, Animated, ActivityIndicator, StatusBar, ScrollView } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { createApiUrl, getApiConfig } from '../../config/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const Set = () => {
  const { setid } = useLocalSearchParams<{ setid: string }>();
  const [cards, setCards] = useState<{ card_id: string; card_question: string; card_answer: string; color: string }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [setName, setSetName] = useState('');
  const [setSubject, setSetSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('flashcards'); // 'flashcards' or 'information'
  const [setOwner, setSetOwner] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  
  // Flip animation state
  const [showAnswer, setShowAnswer] = useState(false);
  const flipAnimation = useRef(new Animated.Value(0)).current;

  /**
   * Fetches set data and cards from the backend API
   */
  const fetchSetData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const response = await axios.get(createApiUrl(`/api/set/${setid}`), getApiConfig(token));

      // Handle API response format - always expect array for cards
      if (response.data && response.data.success !== false) {
        const setData = response.data.set || response.data.data || response.data;
        const cardsData = response.data.cards || setData.cards || [];
        
        setSetName(setData.set_name || 'Untitled Set');
        setSetSubject(setData.set_subject || '');
        setCards(cardsData);
        setSetOwner(setData.user?.user_id || setData.user_id || '');
        
        // Get current user ID from token
        try {
          const token = await AsyncStorage.getItem('token');
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setCurrentUserId(payload.user_id || '');
          }
        } catch (error) {
          console.error('[fetchSetData] Error parsing token:', error);
        }
        
        // Check if set has no cards
        if (!cardsData || cardsData.length === 0) {
          setError('This set has no cards yet');
        }
      } else {
        // Handle error response
        const errorMessage = response.data?.error || 'Failed to load set data';
        setError(errorMessage);
      }
    } catch (error: any) {
      console.error('[fetchSetData] Error:', error.message, error.stack);
      
      // Handle specific error types
      if (error.response?.status === 404) {
        setError('Set not found');
      } else if (error.response?.status === 401) {
        setError('Please login to view this set');
        router.replace('/auth/login');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to view this set');
      } else {
        setError('Failed to load set data. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSetData();
  }, [setid]);

  /**
   * Handles card flip animation to reveal/hide answer
   */
  const handleCardFlip = () => {
    setShowAnswer(!showAnswer);
    Animated.spring(flipAnimation, {
      toValue: showAnswer ? 0 : 1,
      tension: 80,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  /**
   * Handles navigation between cards and resets flip state
   */
  const handleSwipe = (direction: 'left' | 'right') => {
    if (cards.length < 2) return;
    
    // Reset flip state when changing cards
    setShowAnswer(false);
    flipAnimation.setValue(0);
    
    if (direction === 'left') {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    } else {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }
  };

  /**
   * Shuffles the cards array and resets to first card with flip state reset
   */
  const handleShuffle = () => {
    if (cards.length < 2) return;
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setCards(shuffled);
    setCurrentIndex(0);
    
    // Reset flip state
    setShowAnswer(false);
    flipAnimation.setValue(0);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading flashcard set...</Text>
        </View>
      </View>
    );
  }

  if (error || cards.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error || 'No cards found in this set'}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentCard = cards[currentIndex];
  if (!currentCard) return null;

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Simple Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{setName}</Text>
        
                 <View style={styles.headerActions}>
           <TouchableOpacity 
             style={styles.quizButton}
             onPress={() => router.push({ 
               pathname: '/quiz/[setid]', 
               params: { setid, setname: setName } 
             })}
           >
             <Text style={styles.quizButtonText}>Take Quiz</Text>
           </TouchableOpacity>
         </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'information' && styles.activeTab]}
          onPress={() => setActiveTab('information')}
        >
          <Text style={[styles.tabText, activeTab === 'information' && styles.activeTabText]}>Information</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'flashcards' && styles.activeTab]}
          onPress={() => setActiveTab('flashcards')}
        >
          <Text style={[styles.tabText, activeTab === 'flashcards' && styles.activeTabText]}>Flashcards ({cards.length})</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'flashcards' ? (
        <>
          {/* Cards Viewed Counter */}
          <View style={styles.cardsViewedContainer}>
            <Text style={styles.cardsViewedText}>
              Card {currentIndex + 1} of {cards.length}
            </Text>
          </View>

          {/* Large Flashcard */}
          <View style={styles.cardContainer}>
            <Animated.View 
              style={[
                styles.flashcard,
                {
                  transform: [
                    {
                      rotateY: flipAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '180deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity 
                style={styles.flashcardContent} 
                onPress={handleCardFlip} 
                activeOpacity={0.9}
              >
                <ScrollView 
                  style={styles.cardScrollView}
                  contentContainerStyle={styles.cardScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  <Animated.View
                    style={{
                      transform: [
                        {
                          rotateY: flipAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '-180deg'],
                          }),
                        },
                      ],
                    }}
                  >
                    <Text style={styles.cardText}>
                      {showAnswer ? currentCard.card_answer : currentCard.card_question}
                    </Text>
                  </Animated.View>
                </ScrollView>
                <Animated.View 
                  style={[
                    styles.flipHint,
                    {
                      transform: [
                        {
                          rotateY: flipAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '-180deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.flipIcon}>↻</Text>
                  <Text style={styles.flipText}>Tap to flip</Text>
                </Animated.View>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Navigation Buttons */}
          <View style={styles.navigationContainer}>
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={() => handleSwipe('right')}
              disabled={cards.length < 2}
            >
              <Text style={styles.navButtonText}>Previous</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.navButton, styles.shuffleButton]} 
              onPress={handleShuffle}
              disabled={cards.length < 2}
            >
              <Text style={styles.navButtonText}>Shuffle</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.navButton, styles.primaryNavButton]} 
              onPress={() => handleSwipe('left')}
              disabled={cards.length < 2}
            >
              <Text style={[styles.navButtonText, styles.primaryNavButtonText]}>Next</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        /* Information Tab - Notebook Style */
        <ScrollView style={styles.informationContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.notebookContainer}>
            <Text style={styles.notebookTitle}>All Questions & Answers</Text>
            {cards.map((card, index) => (
              <View key={card.card_id} style={styles.notebookEntry}>
                <View style={styles.questionSection}>
                  <Text style={styles.questionLabel}>Q{index + 1}:</Text>
                  <Text style={styles.questionText}>{card.card_question}</Text>
                </View>
                <View style={styles.answerSection}>
                  <Text style={styles.answerLabel}>A{index + 1}:</Text>
                  <Text style={styles.answerText}>{card.card_answer}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </GestureHandlerRootView>
  );
};

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
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Simple Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  quizButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  quizButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Navigation Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeTab: {
    borderBottomColor: '#4facfe',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Cards Viewed Counter
  cardsViewedContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cardsViewedText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  // Flashcard
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  flashcard: {
    width: screenWidth - 40,
    height: screenHeight * 0.5, // Much larger flashcard
    backgroundColor: '#4A90E2',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
  },
  flashcardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardScrollView: {
    flex: 1,
  },
  cardScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  cardText: {
    fontSize: 20, // Larger font size
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28, // Better line height for readability
    paddingHorizontal: 10,
  },
  flipHint: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipIcon: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 8,
  },
  flipText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  // Navigation
  navigationContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  navButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  shuffleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  primaryNavButton: {
    backgroundColor: '#4facfe',
  },
  primaryNavButtonText: {
    color: '#FFFFFF',
  },
  // Information Tab - Notebook Style
  informationContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  notebookContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  notebookTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  notebookEntry: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  questionSection: {
    marginBottom: 12,
  },
  questionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  questionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  answerSection: {
    marginLeft: 16,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  answerText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
});

export default Set;