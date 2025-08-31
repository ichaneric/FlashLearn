// File: studybuddy/app/admin/set-viewer.tsx
// Description: Admin set viewer for viewing cards in a set without quiz functionality

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createApiUrl, API_ENDPOINTS, getApiConfig } from '../../config/api';
import axios from 'axios';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Card {
  card_id: string;
  card_question: string;
  card_answer: string;
  color: string;
}

interface SetData {
  set_id: string;
  set_name: string;
  set_subject: string;
  description: string;
  date_created: string;
  posted: boolean;
  status: string;
  number_of_cards: number;
  user: {
    username: string;
    full_name: string;
  };
}

const AdminSetViewer = () => {
  const { setid } = useLocalSearchParams<{ setid: string }>();
  const [setData, setSetData] = useState<SetData | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flipAnimation] = useState(new Animated.Value(0));

  /**
   * Fetches set data and cards
   */
  const fetchSetData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      // Fetch set details and cards in one request
      const response = await axios.get(
        createApiUrl(`${API_ENDPOINTS.SET}/${setid}`),
        getApiConfig(token)
      );
      
      if (response.data.success) {
        setSetData(response.data.set);
        setCards(response.data.cards || []);
      } else {
        Alert.alert('Error', response.data.error || 'Failed to load set data');
      }
    } catch (error) {
      console.error('[AdminSetViewer] Error fetching set data:', error);
      Alert.alert('Error', 'Failed to load set data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (setid) {
      fetchSetData();
    }
  }, [setid]);

  /**
   * Handles card flip animation
   */
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    Animated.spring(flipAnimation, {
      toValue: isFlipped ? 0 : 1,
      useNativeDriver: true,
      tension: 10,
      friction: 8,
    }).start();
  };

  /**
   * Navigate to next card
   */
  const nextCard = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      flipAnimation.setValue(0);
    }
  };

  /**
   * Navigate to previous card
   */
  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      flipAnimation.setValue(0);
    }
  };

  /**
   * Formats date for display
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.loadingGradient}
        >
          <Text style={styles.loadingText}>Loading Set...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (!setData || cards.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.errorGradient}
        >
          <Text style={styles.errorText}>Set Not Found</Text>
          <Text style={styles.errorSubtext}>This set doesn't exist or has no cards</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{setData.set_name}</Text>
          <Text style={styles.headerSubtitle}>by @{setData.user.username}</Text>
        </View>
      </View>

      {/* Set Info */}
      <View style={styles.setInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Subject:</Text>
          <Text style={styles.infoValue}>{setData.set_subject}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Cards:</Text>
          <Text style={styles.infoValue}>{cards.length}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Created:</Text>
          <Text style={styles.infoValue}>{formatDate(setData.date_created)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status:</Text>
          <Text style={[styles.infoValue, { color: setData.posted ? '#43e97b' : '#ffa726' }]}>
            {setData.posted ? 'Published' : 'Draft'}
          </Text>
        </View>
      </View>

      {/* Cards Counter */}
      <View style={styles.cardsCounter}>
        <Text style={styles.cardsCounterText}>
          Card {currentIndex + 1} of {cards.length}
        </Text>
      </View>

      {/* Flashcard */}
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
            onPress={handleFlip}
            activeOpacity={0.9}
          >
            <ScrollView 
              style={styles.cardScrollView}
              contentContainerStyle={styles.cardScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardText}>
                  {isFlipped ? currentCard.card_answer : currentCard.card_question}
                </Text>
              </View>
            </ScrollView>
            
            {/* Flip hint */}
            <View style={styles.flipHint}>
              <Text style={styles.flipIcon}>🔄</Text>
              <Text style={styles.flipText}>
                {isFlipped ? 'Tap to see question' : 'Tap to see answer'}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
          onPress={prevCard}
          disabled={currentIndex === 0}
        >
          <Text style={[styles.navButtonText, currentIndex === 0 && styles.navButtonTextDisabled]}>
            ← Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, currentIndex === cards.length - 1 && styles.navButtonDisabled]}
          onPress={nextCard}
          disabled={currentIndex === cards.length - 1}
        >
          <Text style={[styles.navButtonText, currentIndex === cards.length - 1 && styles.navButtonTextDisabled]}>
            Next →
          </Text>
        </TouchableOpacity>
      </View>

      {/* Admin Notice */}
      <View style={styles.adminNotice}>
        <Text style={styles.adminNoticeText}>
          👨‍💼 Admin View - No Quiz Mode
        </Text>
      </View>
    </View>
  );
};

export default AdminSetViewer;

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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    marginRight: 15,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  setInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardsCounter: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cardsCounterText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  flashcard: {
    width: screenWidth - 40,
    height: screenHeight * 0.4,
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
  cardTextContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 26,
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
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  navButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  adminNotice: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  adminNoticeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
  },
});
