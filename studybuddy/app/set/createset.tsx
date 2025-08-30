// File: createset.tsx
// Description: Component for creating new flashcard sets with enhanced AI wizard, auto-draft save, quick add mode, and card preview

import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, Image, Modal, FlatList, Dimensions } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { aiFlashcardService, FlashcardData, GenerationRequest } from '../../services/aiFlashcardService';
import { createApiUrl, API_ENDPOINTS, getApiConfig } from '../../config/api';
import { handleTextInputChange } from '../../utils/emojiPrevention';

const { width } = Dimensions.get('window');

const Createset = () => {
  // Basic set data
  const [setTitle, setSetTitle] = useState('');
  const [category] = useState(''); // deprecated in UI (kept for backend fallback)
  const [subject, setSubject] = useState('');
  const [flashcards, setFlashcards] = useState([{ question: '', answer: '' }]);
  const [description, setDescription] = useState('');
  
  // Draft management
  const [setId, setSetId] = useState<string | null>(null);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  
  // UI state
  const [showAiModal, setShowAiModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const maxFlashcards = 30;

  // AI Wizard state with DeepSeek V3 integration
  const [aiStep, setAiStep] = useState(0); // 0..2 input steps, 3 = preview
  const [aiSubject, setAiSubject] = useState('');
  const [aiTopic, setAiTopic] = useState(''); // Single topic instead of multiple
  const [aiCount, setAiCount] = useState('5'); // 1-15
  const [aiPreview, setAiPreview] = useState<FlashcardData[]>([]);
  const [aiError, setAiError] = useState('');
  const [aiWarning, setAiWarning] = useState('');

  // Auto-save debounce timer
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Auto-save draft with debouncing (1.5s delay)
   */
  useEffect(() => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      saveDraft();
    }, 1500);

    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [setTitle, subject, description, flashcards]);

  /**
   * Saves draft to backend (creates new draft or updates existing)
   */
  const saveDraft = async () => {
    // Don't save if no content
    if (!setTitle.trim() && !subject.trim() && flashcards.length === 1 && !flashcards[0].question && !flashcards[0].answer) {
      return;
    }

    setIsDraftSaving(true);
    setDraftSaved(false);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('[saveDraft] No token found');
        return;
      }

      const cards = flashcards
        .filter(f => f.question.trim() || f.answer.trim())
        .map(f => ({
          card_question: f.question.trim(),
          card_answer: f.answer.trim(),
          color: 'yellow', // Default color
        }));

      if (setId) {
        // Update existing draft
        await axios.put(
          createApiUrl(`${API_ENDPOINTS.SET}/${setId}`),
          {
            set_name: setTitle.trim() || 'Untitled Set',
            set_subject: subject.trim() || 'General',
            description: description.slice(0, 30),
            cards,
          },
          getApiConfig(token)
        );
      } else {
        // Create new draft
        const response = await axios.post(
          createApiUrl(API_ENDPOINTS.SET_CREATE),
          {
            set_name: setTitle.trim() || 'Untitled Set',
            set_subject: subject.trim() || 'General',
            category: category || 'unspecified',
            description: description.slice(0, 30),
            cards,
          },
          getApiConfig(token)
        );
        
        if (response.data.set?.set_id) {
          setSetId(response.data.set.set_id);
        }
      }

      setDraftSaved(true);
      setLastSavedAt(new Date());
      
      // Hide saved indicator after 3 seconds
      setTimeout(() => setDraftSaved(false), 3000);

    } catch (error) {
      console.error('[saveDraft] Error:', error);
      // Don't show alert for auto-save errors to avoid interrupting user
    } finally {
      setIsDraftSaving(false);
    }
  };

  /**
   * Adds a new flashcard input
   */
  const handleAddFlashcard = () => {
    if (flashcards.length < maxFlashcards) {
      setFlashcards([...flashcards, { question: '', answer: '' }]);
    } else {
      Alert.alert('Limit Reached', 'Maximum 30 flashcards allowed.');
    }
  };

  /**
   * Removes a flashcard at the provided index
   */
  const handleRemoveFlashcard = (index: number) => {
    if (flashcards.length === 1) return; // keep at least one
    const updated = flashcards.filter((_, i) => i !== index);
    setFlashcards(updated);
  };

  /**
   * Duplicates a flashcard at the provided index
   */
  const handleDuplicateFlashcard = (index: number) => {
    if (flashcards.length >= maxFlashcards) return;
    const clone = { ...flashcards[index] };
    const updated = [
      ...flashcards.slice(0, index + 1),
      clone,
      ...flashcards.slice(index + 1),
    ];
    setFlashcards(updated);
  };

  /**
   * Updates a flashcard's question or answer
   */
  const handleFlashcardChange = (index: number, field: string, value: string) => {
    const newFlashcards = [...flashcards];
    newFlashcards[index][field] = value;
    setFlashcards(newFlashcards);
  };

  /**
   * Handles Enter key press on answer field to auto-add new card
   */
  const handleAnswerSubmit = (index: number) => {
    const currentCard = flashcards[index];
    if (currentCard.question.trim() && currentCard.answer.trim()) {
      // If this is the last card and both fields are filled, add a new one
      if (index === flashcards.length - 1 && flashcards.length < maxFlashcards) {
        handleAddFlashcard();
      }
    }
  };

  /**
   * Generates flashcards using the smart AI service
   */
  const generateFlashcards = async () => {
    // Validate wizard inputs
    if (!aiSubject.trim()) {
      setAiError('Please enter a subject.');
      return;
    }
    if (!aiTopic.trim()) {
      setAiError('Please enter a topic.');
      return;
    }

    const countNum = Math.max(1, Math.min(15, parseInt(aiCount || '5', 10)));
    
    setIsGenerating(true);
    setAiError('');
    setAiWarning('');

    try {
      const result = await aiFlashcardService.generateFlashcards({
        subject: aiSubject.trim(),
        topic: aiTopic.trim(),
        cardCount: countNum
      });

      if (result.success && result.cards) {
        setAiPreview(result.cards);
        setAiStep(3); // Go to preview
        if (result.warning) {
          setAiWarning(result.warning);
        }
      } else {
        setAiError(result.error || 'Failed to generate flashcards');
      }
    } catch (error) {
      console.error('[generateFlashcards] Error:', error);
      setAiError('Failed to generate flashcards. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Publishes the set (changes status from draft to published)
   */
  const handlePublishSet = async () => {
    // Validate all required fields
    if (!setTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter a set title');
      return;
    }
    if (!subject.trim()) {
      Alert.alert('Validation Error', 'Please enter a subject');
      return;
    }
    
    // Check if all flashcards have both question and answer
    const incompleteFlashcards = flashcards.filter(f => !f.question.trim() || !f.answer.trim());
    if (incompleteFlashcards.length > 0) {
      Alert.alert('Validation Error', 'Please fill in both question and answer for all flashcards');
      return;
    }

    if (!setId) {
      Alert.alert('Error', 'No draft found to publish. Please save your work first.');
      return;
    }
    
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in again');
        return;
      }
      
      // Publish the set
      await axios.put(
        createApiUrl(`${API_ENDPOINTS.SET}/${setId}/publish`),
        {},
        getApiConfig(token)
      );
      
      Alert.alert('Success', 'Set published successfully!');
      router.push('/(tabs)/home');
    } catch (error: any) {
      console.error('[handlePublishSet] Error:', error.message, error.stack);
      const backendMsg = error?.response?.data?.error;
      const errorMessage = backendMsg || error.message || 'Failed to publish set. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  /**
   * PreviewCard component for card preview modal
   */
  const PreviewCard = ({ item, index }: { item: any; index: number }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
      <View style={styles.previewCardContainer}>
        <TouchableOpacity 
          style={[styles.previewCard, isFlipped && styles.previewCardFlipped]}
          onPress={() => setIsFlipped(!isFlipped)}
          activeOpacity={0.9}
        >
          <View style={styles.previewCardContent}>
            <Text style={styles.previewCardNumber}>Card {index + 1}</Text>
            <Text style={styles.previewCardText}>
              {isFlipped ? item.answer : item.question}
            </Text>
            <Text style={styles.previewCardHint}>
              {isFlipped ? 'Tap to see question' : 'Tap to see answer'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Flashcard Set</Text>
          <Text style={styles.subtitle}>Build your knowledge with custom flashcards</Text>
          
          {/* Draft status indicator */}
          {(isDraftSaving || draftSaved) && (
            <View style={styles.draftStatusContainer}>
              <Text style={styles.draftStatusText}>
                {isDraftSaving ? 'Saving draft...' : 'Draft saved ✅'}
              </Text>
              {lastSavedAt && (
                <Text style={styles.draftStatusTime}>
                  {lastSavedAt.toLocaleTimeString()}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* AI Generation Section */}
        <View style={styles.aiSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.sectionTitle}>🤖 AI-Powered Creation</Text>
            <TouchableOpacity onPress={() => setShowAboutModal(true)}>
              <Image source={require('../../assets/icons/about.png')} style={{ width: 22, height: 22 }} />
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionDescription}>
            AI creates simple, focused flashcards with just subject and topic
          </Text>
          <TouchableOpacity 
            style={styles.aiButton}
            onPress={() => setShowAiModal(true)}
          >
            <LinearGradient
              colors={['#4facfe', '#00f2fe']}
              style={styles.aiButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.aiButtonText}>Generate with AI</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Manual Creation Section */}
        <View style={styles.manualSection}>
          <Text style={styles.sectionTitle}>Set Creation</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Set Title</Text>
            <TextInput
              style={styles.input}
              value={setTitle}
                              onChangeText={(text) => handleTextInputChange(
                  text, 
                  setSetTitle,
                  () => Alert.alert('Invalid Input', 'Emojis are not allowed in set titles.')
                )}
              placeholder="Enter set title"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Subject</Text>
            <TextInput
              style={styles.input}
              value={subject}
                              onChangeText={(text) => handleTextInputChange(
                  text, 
                  setSubject,
                  () => Alert.alert('Invalid Input', 'Emojis are not allowed in subjects.')
                )}
              placeholder="Enter subject"
              placeholderTextColor="#999"
            />
          </View>

          {/* Description (30 chars max) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (max 30 chars)</Text>
            <TextInput
              style={styles.input}
              value={description}
                              onChangeText={(text) => handleTextInputChange(
                  text, 
                  (cleanedText) => setDescription(cleanedText.slice(0, 30)),
                  () => Alert.alert('Invalid Input', 'Emojis are not allowed in descriptions.')
                )}
              placeholder="Short description"
              placeholderTextColor="#999"
              maxLength={30}
            />
            <Text style={{ color: '#666', marginTop: 6, fontSize: 12 }}>{description.length}/30</Text>
          </View>

          <View style={styles.flashcardsHeaderRow}>
            <Text style={styles.label}>Flashcards ({flashcards.length}/{maxFlashcards})</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity 
                style={[styles.smallPill, { backgroundColor: '#0ea5e9' }]}
                onPress={() => {
                  const remaining = Math.max(0, maxFlashcards - flashcards.length);
                  const toAdd = Math.min(5, remaining);
                  setFlashcards([
                    ...flashcards,
                    ...Array.from({ length: toAdd }).map(() => ({ question: '', answer: '' })),
                  ]);
                }}
              >
                <Text style={styles.smallPillText}>+ 5</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.smallPill, { backgroundColor: '#ef4444' }]}
                onPress={() => setFlashcards([{ question: '', answer: '' }])}
              >
                <Text style={styles.smallPillText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.smallPill, { backgroundColor: '#10b981' }]}
                onPress={() => setShowPreviewModal(true)}
              >
                <Text style={styles.smallPillText}>Preview</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Quick Add Mode - Inline Entry */}
          {flashcards.map((flashcard, index) => (
            <View key={index} style={styles.flashcardContainer}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.flashcardNumber}>Card {index + 1}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {flashcards.length > 1 && (
                    <TouchableOpacity style={[styles.cardActionPill, styles.delPill]} onPress={() => handleRemoveFlashcard(index)}>
                      <Text style={styles.cardActionText}>Delete</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.cardActionPill, styles.dupPill]} onPress={() => handleDuplicateFlashcard(index)}>
                    <Text style={styles.cardActionText}>Duplicate</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TextInput
                style={[styles.input, styles.qaInput]}
                placeholder="Enter a clear, single question (e.g., What is Photosynthesis?)"
                placeholderTextColor="#9aa0a6"
                value={flashcard.question}
                onChangeText={(text) => handleTextInputChange(
                  text, 
                  (cleanedText) => handleFlashcardChange(index, 'question', cleanedText),
                  () => Alert.alert('Invalid Input', 'Emojis are not allowed in questions.')
                )}
                multiline
              />
              <TextInput
                style={[styles.input, styles.qaInput]}
                placeholder="Provide a concise answer"
                placeholderTextColor="#9aa0a6"
                value={flashcard.answer}
                onChangeText={(text) => handleTextInputChange(
                  text, 
                  (cleanedText) => handleFlashcardChange(index, 'answer', cleanedText),
                  () => Alert.alert('Invalid Input', 'Emojis are not allowed in answers.')
                )}
                onSubmitEditing={() => handleAnswerSubmit(index)}
                returnKeyType="next"
                multiline
              />
            </View>
          ))}
          
          <TouchableOpacity style={styles.addButton} onPress={handleAddFlashcard}>
            <Text style={styles.addButtonText}>+ Add Flashcard</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.publishButton} onPress={handlePublishSet}>
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.publishButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.publishButtonText}>Publish Set</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.push('/(tabs)/home')}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddFlashcard} activeOpacity={0.9}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* AI Modal (Wizard) */}
      <Modal
        visible={showAiModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAiModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>AI Flashcard Generator</Text>
            <Text style={styles.modalDescription}>Simply enter the subject and topic, and AI will create simple, focused flashcards for you.</Text>

            {/* Error Display */}
            {aiError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ {aiError}</Text>
              </View>
            )}

            {/* Warning Display */}
            {aiWarning && (
              <View style={styles.warningContainer}>
                <Text style={styles.warningText}>💡 {aiWarning}</Text>
              </View>
            )}

            {aiStep === 0 && (
              <View>
                <Text style={styles.label}>Subject</Text>
                <TextInput 
                  style={styles.modalInput} 
                  value={aiSubject} 
                  onChangeText={(text) => handleTextInputChange(
                    text, 
                    (cleanedText) => {
                      setAiSubject(cleanedText);
                      setAiError(''); // Clear error when user types
                    },
                    () => Alert.alert('Invalid Input', 'Emojis are not allowed in subjects.')
                  )} 
                  placeholder="e.g., Science" 
                  placeholderTextColor="#999" 
                />
                <Text style={styles.hintText}>Examples: Science, Biology, History, Mathematics, Computer Science, Literature.</Text>
              </View>
            )}
            {aiStep === 1 && (
              <View>
                <Text style={styles.label}>Topic</Text>
                <TextInput 
                  style={styles.modalInput} 
                  value={aiTopic} 
                  onChangeText={(text) => handleTextInputChange(
                    text, 
                    (cleanedText) => {
                      setAiTopic(cleanedText);
                      setAiError('');
                    },
                    () => Alert.alert('Invalid Input', 'Emojis are not allowed in topics.')
                  )} 
                  placeholder="e.g., Solar System" 
                  placeholderTextColor="#999" 
                />
                <Text style={styles.hintText}>Single focused topic. Example: &quot;Solar System&quot;, &quot;Cell Division&quot;, &quot;World War II&quot;</Text>
              </View>
            )}
            {aiStep === 2 && (
              <View>
                <Text style={styles.label}>Number of Cards (1-15)</Text>
                <TextInput 
                  keyboardType="number-pad" 
                  style={styles.modalInput} 
                  value={aiCount} 
                  onChangeText={(text) => handleTextInputChange(
                    text, 
                    setAiCount,
                    () => Alert.alert('Invalid Input', 'Emojis are not allowed in numbers.')
                  )} 
                  placeholder="5" 
                  placeholderTextColor="#999" 
                />
                <Text style={styles.hintText}>AI will create simple, focused questions and extremely brief answers (1-3 words).</Text>
              </View>
            )}

            {/* Preview Step */}
            {aiStep === 3 && (
              <View>
                <Text style={styles.label}>Generated Flashcards Preview</Text>
                <View style={{ maxHeight: 280 }}>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {aiPreview.map((card, idx) => (
                      <View key={idx} style={styles.previewCard}>
                        <Text style={styles.previewQuestion}>Q{idx + 1}. {card.question}</Text>
                        <Text style={styles.previewAnswer}>A: {card.answer}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
                {aiWarning && (
                  <Text style={styles.previewWarning}>💡 {aiWarning}</Text>
                )}
              </View>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowAiModal(false);
                  setAiStep(0);
                  setAiSubject('');
                  setAiTopic('');
                  setAiCount('5');
                  setAiError('');
                  setAiWarning('');
                  setAiPreview([]);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalGenerateButton, isGenerating && styles.modalGenerateButtonDisabled]}
                onPress={() => {
                  if (aiStep < 2) {
                    setAiStep(aiStep + 1);
                  } else if (aiStep === 2) {
                    generateFlashcards();
                  } else if (aiStep === 3) {
                    // Accept preview -> push to form
                    setSubject(aiSubject);
                    setFlashcards(aiPreview);
                    setShowAiModal(false);
                    setAiStep(0);
                    setAiPreview([]);
                    setAiError('');
                    setAiWarning('');
                    Alert.alert('Generated', 'AI created flashcards! Review and edit them below, then publish your set.');
                  }
                }}
                disabled={isGenerating}
              >
                <Text style={styles.modalGenerateText}>
                  {isGenerating ? 'Generating...' : aiStep < 2 ? 'Next' : aiStep === 2 ? 'Generate' : 'Use These Cards'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Card Preview Modal */}
      <Modal
        visible={showPreviewModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPreviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.previewModalContent}>
            <View style={styles.previewModalHeader}>
              <Text style={styles.previewModalTitle}>Card Preview</Text>
              <TouchableOpacity onPress={() => setShowPreviewModal(false)}>
                <Text style={styles.previewModalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={flashcards.filter(f => f.question.trim() || f.answer.trim())}
              renderItem={({ item, index }) => <PreviewCard item={item} index={index} />}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.previewFlatList}
            />
            
            <Text style={styles.previewModalHint}>
              Tap cards to flip between question and answer
            </Text>
          </View>
        </View>
      </Modal>

      {/* About Modal */}
      <Modal
        visible={showAboutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>AI Flashcard Generation</Text>
            <Text style={styles.modalDescription}>
              Our AI will ask for:
              {'\n'}1) Subject - Academic area (e.g., Science)
              {'\n'}2) Topic - Single focused topic (e.g., Solar System)
              {'\n'}3) Number of cards (1-15)
              {'\n\n'}AI automatically creates:
              {'\n'}• Simple, focused questions
              {'\n'}• Extremely brief answers (1-3 words)
              {'\n'}• Perfect for quick memorization
              {'\n\n'}Example: For &quot;Solar System&quot; topic:
              {'\n'}&quot;How many planets?&quot; → &quot;8&quot;
              {'\n'}&quot;Nearest planet to Sun?&quot; → &quot;Mercury&quot;
              {'\n'}&quot;Red planet?&quot; → &quot;Mars&quot;
              {'\n\n'}After generating, review and edit cards before publishing your set.
            </Text>
            <TouchableOpacity style={styles.modalGenerateButton} onPress={() => setShowAboutModal(false)}>
              <Text style={styles.modalGenerateText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Createset;

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
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  aiSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  aiButton: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  aiButtonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  manualSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  flashcardsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    minHeight: 50,
  },
  pickerContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#333',
  },
  flashcardContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6E8EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  flashcardNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  smallPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  smallPillText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  cardActionPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  dupPill: {
    backgroundColor: '#3b82f6',
  },
  editPill: {
    backgroundColor: '#10b981',
  },
  delPill: {
    backgroundColor: '#ef4444',
  },
  cardActionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  qaInput: {
    minHeight: 52,
  },
  removeButton: {
    backgroundColor: '#F44336',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtons: {
    gap: 15,
  },
  createButton: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F44336',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalGenerateButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalGenerateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  modalGenerateText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  hintText: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 6,
  },
  // Difficulty pills
  diffPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8F9FA',
  },
  diffPillActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  diffPillText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  diffPillTextActive: {
    color: '#FFFFFF',
  },
  // Error and warning containers
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  warningContainer: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  warningText: {
    color: '#d97706',
    fontSize: 14,
    fontWeight: '600',
  },
  // Preview card styles
  previewCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  previewQuestion: {
    fontWeight: '700',
    color: '#111827',
    fontSize: 14,
    marginBottom: 6,
  },
  previewAnswer: {
    color: '#374151',
    fontSize: 13,
    lineHeight: 18,
  },
  previewWarning: {
    color: '#d97706',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  previewCardContainer: {
    width: width * 0.8, // Adjust width for horizontal scrolling
    marginHorizontal: 5,
  },
  previewCardFlipped: {
    transform: [{ rotateY: '180deg' }],
  },
  previewCardContent: {
    alignItems: 'center',
    padding: 10,
  },
  previewCardNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 5,
  },
  previewCardText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 5,
  },
  previewCardHint: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  previewFlatList: {
    flexGrow: 0, // Disable flexGrow to prevent list from growing
  },
  previewModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  previewModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  previewModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  previewModalClose: {
    fontSize: 24,
    color: '#666',
  },
  previewModalHint: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 10,
  },
  publishButton: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  publishButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  draftStatusContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
  },
  draftStatusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 5,
  },
  draftStatusTime: {
    color: '#FFFFFF',
    fontSize: 12,
  },
});