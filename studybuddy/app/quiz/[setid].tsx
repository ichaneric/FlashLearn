// File: studybuddy/app/quiz/[setid].tsx
// Description: Modern quiz interface with multiple modes and timer functionality

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  Dimensions,
  Animated,
  TextInput,
  Image,
  Vibration,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createApiUrl, getApiConfig } from '../../config/api';
import { addQuizRecord } from '../../utils/quizStorage';

const { width, height } = Dimensions.get('window');

const QuizScreen = () => {
  const { setid, setname } = useLocalSearchParams();
  const router = useRouter();
  
  const [cards, setCards] = useState([]);
  const [setData, setSetData] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizMode, setQuizMode] = useState(''); // 'multiple-choice', 'type-answer', 'review'
  const [userAnswers, setUserAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [selectedChoice, setSelectedChoice] = useState('');
  const [multipleChoices, setMultipleChoices] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds per question
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef(null);
  
  // Pair quiz specific states
  const [pairQuestions, setPairQuestions] = useState([]);
  const [pairAnswers, setPairAnswers] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [pairedItems, setPairedItems] = useState([]);
  const [incorrectPairs, setIncorrectPairs] = useState([]);
  const [showAnswer, setShowAnswer] = useState(false);
  
  // Settings states
  const [showSettings, setShowSettings] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [timerMode, setTimerMode] = useState('question'); // 'question' or 'test'
  const [questionTimer, setQuestionTimer] = useState(0); // 0 = disabled, 5,10,15,20,25,30 seconds
  const [testTimer, setTestTimer] = useState(0); // 0 = disabled, 1-60 minutes
  const [testTimeLeft, setTestTimeLeft] = useState(0);
  const [testTimerRunning, setTestTimerRunning] = useState(false);
  const testTimerRef = useRef(null);

  useEffect(() => {
    fetchCards();
  }, []);

  // Question timer effect
  useEffect(() => {
    if (timerRunning && timeLeft > 0 && timerMode === 'question' && questionTimer > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerRunning && timerMode === 'question' && questionTimer > 0) {
      handleTimeUp();
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft, timerRunning, timerMode, questionTimer]);

  // Test timer effect
  useEffect(() => {
    if (testTimerRunning && testTimeLeft > 0 && timerMode === 'test') {
      testTimerRef.current = setTimeout(() => {
        setTestTimeLeft(testTimeLeft - 1);
      }, 1000);
    } else if (testTimeLeft === 0 && testTimerRunning && timerMode === 'test') {
      // Test time is up, end the quiz
      setTestTimerRunning(false);
      setQuizCompleted(true);
      saveQuizRecord();
      Alert.alert('Time\'s Up!', 'The test timer has expired.');
    }
    
    return () => {
      if (testTimerRef.current) {
        clearTimeout(testTimerRef.current);
      }
    };
  }, [testTimeLeft, testTimerRunning, timerMode]);

  const fetchCards = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Please log in again');
        router.back();
        return;
      }

      const response = await axios.get(createApiUrl(`/api/set/${setid}`), getApiConfig(token));

      if (response.data) {
        // Store set data for quiz records
        setSetData(response.data);
        
        if (response.data.cards) {
          const shuffledCards = response.data.cards.sort(() => Math.random() - 0.5);
          setCards(shuffledCards);
        }
      }
    } catch (error) {
      console.error('[fetchCards] Error:', error.message, error.stack);
      Alert.alert('Error', 'Failed to load quiz cards');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Generates multiple choice options for the current question
   */
  const generateMultipleChoices = (correctAnswer, allCards, currentIndex) => {
    const choices = [correctAnswer];
    const otherCards = allCards.filter((_, index) => index !== currentIndex);
    
    // Add 3 random wrong answers
    const shuffledOthers = otherCards.sort(() => Math.random() - 0.5);
    for (let i = 0; i < 3 && i < shuffledOthers.length; i++) {
      choices.push(shuffledOthers[i].card_answer);
    }
    
    // If we don't have enough cards, add some generic wrong answers
    while (choices.length < 4) {
      const genericAnswers = ['Option A', 'Option B', 'Option C', 'Option D'];
      const randomGeneric = genericAnswers[Math.floor(Math.random() * genericAnswers.length)];
      if (!choices.includes(randomGeneric)) {
        choices.push(randomGeneric);
      }
    }
    
    // Shuffle the choices
    return choices.sort(() => Math.random() - 0.5);
  };

  /**
   * Generates pairs for the pair quiz
   */
  const generatePairQuiz = () => {
    const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
    const questions = shuffledCards.map((card, index) => ({
      id: index,
      text: card.card_question,
      originalIndex: index,
    }));
    
    const answers = shuffledCards.map((card, index) => ({
      id: index,
      text: card.card_answer,
      originalIndex: index,
    }));
    
    // Shuffle answers separately
    const shuffledAnswers = [...answers].sort(() => Math.random() - 0.5);
    
    setPairQuestions(questions);
    setPairAnswers(shuffledAnswers);
    setPairedItems([]);
    setIncorrectPairs([]);
    setSelectedQuestion(null);
    setSelectedAnswer(null);
  };

  /**
   * Handles pairing selection
   */
  const handlePairSelection = (item, type) => {
    if (type === 'question') {
      if (selectedQuestion?.id === item.id) {
        setSelectedQuestion(null);
      } else {
        setSelectedQuestion(item);
        if (selectedAnswer) {
          checkPairMatch(item, selectedAnswer);
        }
      }
    } else {
      if (selectedAnswer?.id === item.id) {
        setSelectedAnswer(null);
      } else {
        setSelectedAnswer(item);
        if (selectedQuestion) {
          checkPairMatch(selectedQuestion, item);
        }
      }
    }
  };

  /**
   * Checks if the selected pair is correct
   */
  const checkPairMatch = (question, answer) => {
    if (question.originalIndex === answer.originalIndex) {
      // Correct match
      const newPair = { questionId: question.id, answerId: answer.id };
      setPairedItems(prev => [...prev, newPair]);
      
      // Remove from available options
      setPairQuestions(prev => prev.filter(q => q.id !== question.id));
      setPairAnswers(prev => prev.filter(a => a.id !== answer.id));
      
      // Clear selections
      setSelectedQuestion(null);
      setSelectedAnswer(null);
      
      // Check if quiz is complete - all pairs should be matched
      const updatedPairedItems = [...pairedItems, newPair];
      if (updatedPairedItems.length === cards.length) {
        setTimeout(() => {
          setQuizCompleted(true);
          // Always record perfect score for pair quiz when completed
          const perfectScore = cards.length;
          setUserAnswers([{ 
            correctPairs: perfectScore,
            totalPairs: cards.length,
            isCorrect: true // Always true when quiz is completed
          }]);
          saveQuizRecord([{ 
            correctPairs: perfectScore,
            totalPairs: cards.length,
            isCorrect: true
          }]);
        }, 500);
      }
    } else {
      // Incorrect match
      const incorrectPair = { questionId: question.id, answerId: answer.id };
      setIncorrectPairs(prev => [...prev, incorrectPair]);
      
      // Clear incorrect highlighting after delay
      setTimeout(() => {
        setIncorrectPairs(prev => prev.filter(p => 
          p.questionId !== question.id || p.answerId !== answer.id
        ));
        setSelectedQuestion(null);
        setSelectedAnswer(null);
      }, 1000);
    }
  };

  /**
   * Starts the quiz with the selected mode
   */
  const startQuiz = (mode) => {
    setQuizMode(mode);
    setQuizStarted(true);
    setCurrentCardIndex(0);
    setUserAnswers([]);
    setCurrentAnswer('');
    setSelectedChoice('');
    
    // Initialize timers based on mode
    if (timerMode === 'question' && questionTimer > 0) {
      setTimeLeft(questionTimer);
      setTimerRunning(true);
    } else if (timerMode === 'test' && testTimer > 0) {
      setTestTimeLeft(testTimer * 60);
      setTestTimerRunning(true);
      setTimeLeft(0);
      setTimerRunning(false);
    } else {
      setTimeLeft(0);
      setTimerRunning(false);
    }
    
    if (mode === 'multiple-choice') {
      const choices = generateMultipleChoices(cards[0].card_answer, cards, 0);
      setMultipleChoices(choices);
    } else if (mode === 'pair') {
      generatePairQuiz();
    }
  };

  /**
   * Handles when time runs out
   */
  const handleTimeUp = () => {
    setTimerRunning(false);
    if (quizMode === 'multiple-choice') {
      submitMultipleChoiceAnswer(''); // Submit with no answer
    } else {
      submitAnswer(''); // Submit with no answer
    }
  };

  /**
   * Submits multiple choice answer
   */
  const submitMultipleChoiceAnswer = (answer) => {
    setTimerRunning(false);
    const correctAnswer = cards[currentCardIndex].card_answer;
    // Fix: Only compare if answer is not empty (timer didn't run out)
    const isCorrect = answer && answer.trim() !== '' ? 
      answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim() : 
      false;
    
    const answerData = {
      questionIndex: currentCardIndex,
      question: cards[currentCardIndex].card_question,
      correctAnswer: correctAnswer,
      userAnswer: answer || 'No answer (time up)',
      isCorrect: isCorrect,
      timeTaken: 30 - timeLeft,
    };
    
    const nextAnswers = [...userAnswers, answerData];
    setUserAnswers(nextAnswers);
    
    if (currentCardIndex < cards.length - 1) {
      const nextIndex = currentCardIndex + 1;
      setCurrentCardIndex(nextIndex);
      const choices = generateMultipleChoices(cards[nextIndex].card_answer, cards, nextIndex);
      setMultipleChoices(choices);
      setSelectedChoice('');
      if (timerMode === 'question' && questionTimer > 0) {
        setTimeLeft(questionTimer);
        setTimerRunning(true);
      }
    } else {
      setQuizCompleted(true);
      saveQuizRecord(nextAnswers);
    }
  };



  const submitAnswer = (answer) => {
    const correctAnswer = cards[currentCardIndex].card_answer;
    // Fix: Only compare if answer is not empty
    const isCorrect = answer && answer.trim() !== '' ? 
      answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim() : 
      false;
    
    const answerData = {
      questionIndex: currentCardIndex,
      question: cards[currentCardIndex].card_question,
      correctAnswer: correctAnswer,
      userAnswer: answer || 'No answer',
      isCorrect: isCorrect,
    };
    
    const nextAnswers = [...userAnswers, answerData];
    setUserAnswers(nextAnswers);
    
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setCurrentAnswer('');
      setShowAnswer(false);
    } else {
      setQuizCompleted(true);
      saveQuizRecord(nextAnswers);
    }
  };

  const getScorePercentage = (answersOverride?: any[]) => {
    const src = Array.isArray(answersOverride) ? answersOverride : userAnswers;
    const correctAnswers = src.filter(answer => answer.isCorrect).length;
    const denom = cards.length || 1;
    return Math.round((correctAnswers / denom) * 100);
  };

  /**
   * Saves quiz record to AsyncStorage for history tracking
   */
  const saveQuizRecord = async (answersOverride?: any[], opts?: { timeTaken?: number }) => {
    try {
      const src = Array.isArray(answersOverride) ? answersOverride : userAnswers;
      
      // Handle different quiz modes
      let correctAnswers, totalQuestions;
      
      if (quizMode === 'pair') {
        // For pair quiz, use the pair-specific data
        const pairData = src[0]; // Pair quiz stores single result object
        correctAnswers = pairData?.correctPairs || 0;
        totalQuestions = pairData?.totalPairs || cards.length;
      } else {
        // For other modes, calculate from individual answers
        correctAnswers = src.filter(answer => answer.isCorrect).length;
        totalQuestions = cards.length;
      }
      
      // Debug logging to track score calculation
      console.log('[saveQuizRecord] Debug Info:', {
        quizMode: quizMode,
        totalAnswers: src.length,
        correctAnswers: correctAnswers,
        totalQuestions: totalQuestions,
        answers: src.map(a => ({ 
          questionIndex: a.questionIndex, 
          isCorrect: a.isCorrect, 
          userAnswer: a.userAnswer,
          correctAnswer: a.correctAnswer,
          correctPairs: a.correctPairs,
          totalPairs: a.totalPairs
        }))
      });
      
      const record = {
        id: Date.now().toString(),
        setName: setname,
        setId: setid,
        subject: setData?.set_subject || 'General',
        mode: quizMode,
        score: correctAnswers, // Save actual correct answers count, not percentage
        correctAnswers: correctAnswers,
        totalQuestions: totalQuestions,
        completedAt: new Date().toISOString(),
        timeTaken: opts?.timeTaken ?? (testTimer > 0 ? (testTimer * 60 - testTimeLeft) : null),
        settings: {
          questionTimer,
          testTimer,
          musicEnabled
        }
      };

      const success = await addQuizRecord(record);
      if (success) {
        console.log('[saveQuizRecord] Quiz record saved successfully');
      } else {
        console.error('[saveQuizRecord] Failed to save quiz record');
      }
    } catch (error) {
      console.error('[saveQuizRecord] Error:', error.message, error.stack);
    }
  };

  // Settings Modal
  const renderSettingsModal = () => (
    <Modal
      visible={showSettings}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowSettings(false)}
    >
             <View style={styles.modalOverlay} onTouchEnd={() => setShowSettings(false)}>
         <View 
           style={[styles.settingsModal, {
             position: 'absolute',
             top: 90, // Position below header
             right: 20,
             width: 280,
           }]}
           onTouchEnd={(e) => e.stopPropagation()}
         >
          <Text style={styles.settingsTitle}>Quiz Settings</Text>
          
          {/* Music Toggle */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Enable Sound Effects</Text>
            <TouchableOpacity 
              style={[styles.toggle, musicEnabled && styles.toggleActive]}
              onPress={() => setMusicEnabled(!musicEnabled)}
            >
              <View style={[styles.toggleThumb, musicEnabled && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>

          {/* Timer Mode Switch */}
          <View style={styles.timerSection}>
            <Text style={styles.timerSectionTitle}>Timer</Text>
            <View style={styles.timerModeSwitch}>
              <TouchableOpacity 
                style={[styles.timerModeButton, timerMode === 'question' && styles.timerModeActive]}
                onPress={() => setTimerMode('question')}
              >
                <Text style={[styles.timerModeText, timerMode === 'question' && styles.timerModeTextActive]}>
                  Question
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.timerModeButton, timerMode === 'test' && styles.timerModeActive]}
                onPress={() => setTimerMode('test')}
              >
                <Text style={[styles.timerModeText, timerMode === 'test' && styles.timerModeTextActive]}>
                  Test
                </Text>
              </TouchableOpacity>
            </View>

            {/* Question Timer Presets */}
            {timerMode === 'question' && (
              <View style={styles.timerPresets}>
                <Text style={styles.presetLabel}>Select seconds per question:</Text>
                <View style={styles.presetButtons}>
                  {[5, 10, 15, 20, 25, 30].map((seconds) => (
                    <TouchableOpacity
                      key={seconds}
                      style={[
                        styles.presetButton,
                        questionTimer === seconds && styles.presetButtonActive
                      ]}
                      onPress={() => setQuestionTimer(questionTimer === seconds ? 0 : seconds)}
                    >
                      <Text style={[
                        styles.presetButtonText,
                        questionTimer === seconds && styles.presetButtonTextActive
                      ]}>
                        {seconds}s
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {questionTimer > 0 && (
                  <TouchableOpacity
                    style={styles.disableButton}
                    onPress={() => setQuestionTimer(0)}
                  >
                    <Text style={styles.disableButtonText}>Disable Timer</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Test Timer Clock */}
            {timerMode === 'test' && (
              <View style={styles.timerPresets}>
                <Text style={styles.presetLabel}>Test duration (minutes):</Text>
                <View style={styles.clockContainer}>
                  <Text style={styles.clockDisplay}>
                    {testTimer === 0 ? 'No limit' : `${testTimer}:00 mins.`}
                  </Text>
                  <View style={styles.clockControls}>
                    <TouchableOpacity 
                      style={styles.clockButton}
                      onPress={() => setTestTimer(Math.max(0, testTimer - 1))}
                    >
                      <Text style={styles.clockButtonText}>-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.clockButton}
                      onPress={() => setTestTimer(Math.min(60, testTimer + 1))}
                    >
                      <Text style={styles.clockButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {testTimer > 0 && (
                  <TouchableOpacity
                    style={styles.disableButton}
                    onPress={() => setTestTimer(0)}
                  >
                    <Text style={styles.disableButtonText}>Remove Time Limit</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Close Button */}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowSettings(false)}
          >
            <Text style={styles.closeButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const getScoreMessage = () => {
    const percentage = getScorePercentage();
    if (percentage >= 90) return 'Excellent! 🎉';
    if (percentage >= 80) return 'Great job! 👍';
    if (percentage >= 70) return 'Good work! 😊';
    if (percentage >= 60) return 'Not bad! 💪';
    return 'Keep practicing! 📚';
  };

  // Loading Screen
  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.gradient}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Quiz...</Text>
        </View>
      </View>
    );
  }

  // Quiz Mode Selection Screen
  if (!quizStarted) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4A5568" />
        <LinearGradient
          colors={['#4A5568', '#2D3748']}
          style={styles.gradient}
        />
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quiz Mode</Text>
          <TouchableOpacity 
            style={styles.settingsBtn}
            onPress={() => setShowSettings(true)}
          >
            <Image 
              source={require('../../assets/icons/settings.png')}
              style={styles.settingsIcon}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.setInfoCard}>
          <Text style={styles.setTitle}>{setname}</Text>
          <Text style={styles.setSubtitle}>Test your basic knowledge about solar system</Text>
        </View>

        <View style={styles.modeContainer}>
          <TouchableOpacity 
            style={styles.modeOption}
            onPress={() => startQuiz('multiple-choice')}
            activeOpacity={0.8}
          >
            <Text style={styles.modeText}>Multiple Choices</Text>
            <View style={styles.modeIconContainer}>
              <Image 
                source={require('../../assets/icons/multiple.png')} 
                style={styles.modeIconImage}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.modeOption}
            onPress={() => startQuiz('pair')}
            activeOpacity={0.8}
          >
            <Text style={styles.modeText}>Pair the cards</Text>
            <View style={styles.modeIconContainer}>
              <Image 
                source={require('../../assets/icons/pair.png')} 
                style={styles.modeIconImage}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.modeOption}
            onPress={() => startQuiz('type-answer')}
            activeOpacity={0.8}
          >
            <Text style={styles.modeText}>Type the answer</Text>
            <View style={styles.modeIconContainer}>
              <Image 
                source={require('../../assets/icons/type.png')} 
                style={styles.modeIconImage}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.modeOption}
            onPress={() => router.push({ 
              pathname: '/set/[setid]', 
              params: { setid: setid as string } 
            })}
            activeOpacity={0.8}
          >
            <Text style={styles.modeText}>Review Set</Text>
            <View style={styles.modeIconContainer}>
              <Image 
                source={require('../../assets/icons/settings.png')} 
                style={styles.modeIconImage}
              />
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Settings Modal - Only show in quiz mode selection screen */}
        {renderSettingsModal()}
      </View>
    );
  }

  // Main Quiz Interface
  if (quizStarted && !quizCompleted && cards.length > 0) {
    const currentCard = cards[currentCardIndex];
    
    if (quizMode === 'multiple-choice') {
    return (
      <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#4A5568" />
        <LinearGradient
            colors={['#4A5568', '#2D3748']}
          style={styles.gradient}
        />

          {/* Progress Bar with Settings */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>{currentCardIndex + 1}/{cards.length}</Text>
              {testTimerRunning && (
                <Text style={styles.testTimerText}>
                  Test: {Math.floor(testTimeLeft / 60)}:{(testTimeLeft % 60).toString().padStart(2, '0')}
                </Text>
              )}

            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${((currentCardIndex + 1) / cards.length) * 100}%` }]} />
            </View>
          </View>

          {/* Timer Circle */}
          <View style={styles.timerContainer}>
            <View style={styles.timerCircle}>
              <Text style={styles.timerText}>{timeLeft}</Text>
          </View>
        </View>

          {/* Question Card */}
        <View style={styles.questionContainer}>
          <View style={styles.questionCard}>
              <Text style={styles.questionNumber}>Question {currentCardIndex + 1}</Text>
              <Text style={styles.questionSubtitle}>{setname}</Text>
            <Text style={styles.questionText}>{currentCard.card_question}</Text>
          </View>
        </View>

                     {/* Multiple Choice Options */}
                       <ScrollView 
              style={styles.choicesContainer}
              contentContainerStyle={styles.choicesContent}
              showsVerticalScrollIndicator={false}
            >
              {multipleChoices.map((choice, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.choiceOption,
                    selectedChoice === choice && styles.selectedChoice
                  ]}
                  onPress={() => setSelectedChoice(choice)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.choiceText,
                    selectedChoice === choice && styles.selectedChoiceText
                  ]}>
                    {choice}
                  </Text>
                  <View style={[
                    styles.choiceCircle,
                    selectedChoice === choice && styles.selectedChoiceCircle
                  ]}>
                    {selectedChoice === choice ? (
                      <Text style={styles.selectedCheckMark}>✓</Text>
                    ) : (
                      <View style={styles.emptyCircle} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

                     {/* Proceed Button */}
           <View style={styles.proceedContainer}>
             <TouchableOpacity
               style={[styles.proceedButton, !selectedChoice && styles.proceedButtonDisabled]}
               onPress={() => selectedChoice && submitMultipleChoiceAnswer(selectedChoice)}
               disabled={!selectedChoice}
               activeOpacity={0.8}
             >
               <Text style={styles.proceedButtonText}>
                 {selectedChoice ? `Submit Answer: ${selectedChoice.substring(0, 20)}${selectedChoice.length > 20 ? '...' : ''}` : 'Select an answer to continue'}
               </Text>
             </TouchableOpacity>
           </View>
          {renderSettingsModal()}
        </View>
      );
    }

         // Type Answer Mode
     if (quizMode === 'type-answer') {
       return (
         <KeyboardAvoidingView 
           style={styles.container}
           behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
           keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
         >
           <StatusBar barStyle="light-content" backgroundColor="#4A5568" />
           <LinearGradient
             colors={['#4A5568', '#2D3748']}
             style={styles.gradient}
           />

           <ScrollView 
             style={styles.typeAnswerScrollView}
             contentContainerStyle={styles.typeAnswerScrollContent}
             showsVerticalScrollIndicator={false}
             keyboardShouldPersistTaps="handled"
           >
             {/* Progress Bar */}
             <View style={styles.progressContainer}>
               <Text style={styles.progressText}>{currentCardIndex + 1}/{cards.length}</Text>
               <View style={styles.progressBarContainer}>
                 <View style={[styles.progressBar, { width: `${((currentCardIndex + 1) / cards.length) * 100}%` }]} />
               </View>
             </View>

             {/* Timer Circle */}
             <View style={styles.timerContainer}>
               <View style={styles.timerCircle}>
                 <Text style={styles.timerText}>{timeLeft}</Text>
               </View>
             </View>

             {/* Question Card */}
             <View style={styles.questionContainer}>
               <View style={styles.questionCard}>
                 <Text style={styles.questionNumber}>Question {currentCardIndex + 1}</Text>
                 <Text style={styles.questionSubtitle}>{setname}</Text>
                 <Text style={styles.questionText}>{currentCard.card_question}</Text>
               </View>
             </View>

             {/* Type Answer Input */}
             <View style={styles.typeAnswerContainer}>
               <Text style={styles.typePrompt}>Type your answer here</Text>
               <View style={styles.inputCard}>
                 <TextInput
                   style={styles.answerInput}
                   placeholder="Enter your answer..."
                   placeholderTextColor="#999"
                   value={currentAnswer}
                   onChangeText={setCurrentAnswer}
                   multiline={false}
                   autoFocus
                   autoCapitalize="none"
                   autoCorrect={false}
                 />
               </View>
             </View>

             {/* Submit Button */}
             <View style={styles.proceedContainer}>
               <TouchableOpacity
                 style={[styles.submitButton, !currentAnswer.trim() && styles.proceedButtonDisabled]}
                 onPress={() => submitAnswer(currentAnswer)}
                 disabled={!currentAnswer.trim()}
               >
                 <Text style={styles.proceedButtonText}>Submit Answer</Text>
               </TouchableOpacity>
             </View>
           </ScrollView>
           {renderSettingsModal()}
         </KeyboardAvoidingView>
       );
     }

    // Pair Quiz Mode
    if (quizMode === 'pair') {
      return (
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#4A5568" />
          <LinearGradient
            colors={['#4A5568', '#2D3748']}
            style={styles.gradient}
          />

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {pairedItems.length}/{cards.length} pairs matched
            </Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${(pairedItems.length / cards.length) * 100}%` }]} />
            </View>
          </View>

          {/* Timer Circle */}
          <View style={styles.timerContainer}>
            <View style={styles.timerCircle}>
              <Text style={styles.timerText}>{timeLeft}</Text>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              Tap to connect questions with their matching answers
            </Text>
          </View>

          {/* Pair Quiz Interface */}
          <ScrollView style={styles.pairContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.pairColumns}>
              {/* Questions Column */}
              <View style={styles.questionsColumn}>
                <Text style={styles.columnTitle}>Questions</Text>
                {pairQuestions.map((question) => {
                  const isSelected = selectedQuestion?.id === question.id;
                  const isIncorrect = incorrectPairs.some(p => p.questionId === question.id);
                  
                  return (
                    <TouchableOpacity
                      key={question.id}
                      style={[
                        styles.pairItem,
                        styles.questionItem,
                        isSelected && styles.selectedPairItem,
                        isIncorrect && styles.incorrectPairItem,
                      ]}
                      onPress={() => handlePairSelection(question, 'question')}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.pairItemText,
                        isSelected && styles.selectedPairText,
                        isIncorrect && styles.incorrectPairText,
                      ]}>
                        {question.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Answers Column */}
              <View style={styles.answersColumn}>
                <Text style={styles.columnTitle}>Answers</Text>
                {pairAnswers.map((answer) => {
                  const isSelected = selectedAnswer?.id === answer.id;
                  const isIncorrect = incorrectPairs.some(p => p.answerId === answer.id);
                  
                  return (
                    <TouchableOpacity
                      key={answer.id}
                      style={[
                        styles.pairItem,
                        styles.answerItem,
                        isSelected && styles.selectedPairItem,
                        isIncorrect && styles.incorrectPairItem,
                      ]}
                      onPress={() => handlePairSelection(answer, 'answer')}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.pairItemText,
                        isSelected && styles.selectedPairText,
                        isIncorrect && styles.incorrectPairText,
                      ]}>
                        {answer.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Matched Pairs Counter */}
          <View style={styles.matchedCounter}>
            <Text style={styles.matchedText}>
              ✓ {pairedItems.length} pairs matched correctly
            </Text>
          </View>
        </View>
      );
    }

    // Review Mode (existing logic)
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4A5568" />
        <LinearGradient
          colors={['#4A5568', '#2D3748']}
          style={styles.gradient}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.reviewText}>Review mode coming soon!</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Quiz Results Screen
  if (quizCompleted) {
    if (quizMode === 'pair') {
      const pairResult = userAnswers[0];
      const score = Math.round((pairResult.correctPairs / pairResult.totalPairs) * 100);
      
      return (
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#4A5568" />
          <LinearGradient
            colors={['#4A5568', '#2D3748']}
            style={styles.gradient}
          />
          
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Pair Quiz Complete! 🔗</Text>
            <Text style={styles.setName}>{setname}</Text>
            
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>{pairResult.correctPairs}/{pairResult.totalPairs}</Text>
              <Text style={styles.scorePercentage}>{score}%</Text>
              <Text style={styles.scoreMessage}>
                {score === 100 ? 'Perfect Match! 🎉' : 
                 score >= 80 ? 'Great Pairing! 👍' : 
                 score >= 60 ? 'Good Work! 💪' : 'Keep Practicing! 📚'}
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Back to Sets</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    const score = getScorePercentage();
    const correctAnswers = userAnswers.filter(answer => answer.isCorrect).length;
    
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4A5568" />
        <LinearGradient
          colors={['#4A5568', '#2D3748']}
          style={styles.gradient}
        />
        
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Quiz Complete! 🎯</Text>
          <Text style={styles.setName}>{setname}</Text>
          
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>{correctAnswers}/{cards.length}</Text>
            <Text style={styles.scorePercentage}>{score}%</Text>
            <Text style={styles.scoreMessage}>{getScoreMessage()}</Text>
          </View>

          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Back to Sets</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
};

export default QuizScreen;

// @ts-ignore - Suppressing style type compatibility warnings
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
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  settingsIcon: {
    width: 24,
    height: 24,
    tintColor: '#FFFFFF',
  },
  setInfoCard: {
    backgroundColor: '#1E2A78',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  setTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  setSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.8,
  },
  modeContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    paddingHorizontal: 25,
    paddingVertical: 18,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedMode: {
    backgroundColor: '#4CAF50',
  },
  comingSoonMode: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  modeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  comingSoonText: {
    color: '#999',
  },
  modeIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeIconImage: {
    width: 20,
    height: 20,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 15,
  },
  progressText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'left',
    marginBottom: 8,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF4757',
    borderRadius: 2,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  questionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  questionCard: {
    backgroundColor: '#1E2A78',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  questionNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 5,
  },
  questionSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 15,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
  },

  choicesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  choicesContent: {
    paddingBottom: 20,
  },
  choiceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    transform: [{ scale: 1 }],
  },
  choiceCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedChoiceCircle: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  emptyCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: 'transparent',
  },

  selectedChoice: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
    transform: [{ scale: 1.02 }],
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  choiceText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    lineHeight: 22,
    marginRight: 15,
  },
  selectedChoiceText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  selectedCheckMark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  proceedContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  proceedButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  proceedButtonDisabled: {
    backgroundColor: '#999',
    opacity: 0.6,
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  typeAnswerScrollView: {
    flex: 1,
  },
  typeAnswerScrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  typeAnswerContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  typePrompt: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
    opacity: 0.9,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  answerInput: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    padding: 15,
    fontWeight: '500',
    minHeight: 50,
  },
  submitButton: {
    backgroundColor: '#B91C1C',
    borderRadius: 15,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  reviewText: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  setName: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 40,
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  scorePercentage: {
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  scoreMessage: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 15,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Pair Quiz Styles
  instructionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  instructionsText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  pairContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  pairColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  questionsColumn: {
    flex: 1,
    marginRight: 8,
  },
  answersColumn: {
    flex: 1,
    marginLeft: 8,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
  },
  pairItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    minHeight: 80,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionItem: {
    backgroundColor: 'rgba(30, 42, 120, 0.9)',
  },
  answerItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  selectedPairItem: {
    backgroundColor: '#4CAF50',
    transform: [{ scale: 1.05 }],
  },
  incorrectPairItem: {
    backgroundColor: '#FF4757',
    transform: [{ scale: 1.05 }],
  },
  pairItemText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  selectedPairText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  incorrectPairText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  matchedCounter: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 10,
  },
  matchedText: {
    fontSize: 16,
    color: '#4CAF50',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  
  // Settings Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  settingsModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    maxHeight: height * 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'left',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    marginRight: 12,
    fontWeight: '500',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#4CAF50',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  timerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  timerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A5568',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  timerValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#4A5568',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },


  testTimerText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    opacity: 0.9,
  },
  
  // Timer Settings Styles
  timerSection: {
    marginVertical: 10,
  },
  timerSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  timerModeSwitch: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  timerModeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  timerModeActive: {
    backgroundColor: '#4A5568',
  },
  timerModeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  timerModeTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timerPresets: {
    marginTop: 15,
  },
  presetLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  presetButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    minWidth: 50,
    alignItems: 'center',
  },
  presetButtonActive: {
    backgroundColor: '#4A5568',
    borderColor: '#4A5568',
  },
  presetButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  presetButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  clockContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  clockDisplay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  clockControls: {
    flexDirection: 'row',
    gap: 15,
  },
  clockButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4A5568',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clockButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  disableButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    alignSelf: 'center',
  },
  disableButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
