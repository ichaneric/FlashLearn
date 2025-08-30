// File: editset.tsx
// Description: Edit Set screen for managing set details and flashcards

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { createApiUrl, API_ENDPOINTS, getApiConfig } from '../../config/api';

interface Flashcard {
  card_id: string;
  card_question: string;
  card_answer: string;
  color: string;
}

interface Set {
  set_id: string;
  set_name: string;
  set_subject: string;
  description: string;
  cards: Flashcard[];
  user: {
    full_name: string;
    username: string;
  };
}

const EditSet = () => {
  const { setid } = useLocalSearchParams<{ setid: string }>();
  const [set, setSet] = useState<Set | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [setName, setSetName] = useState('');
  const [setSubject, setSetSubject] = useState('');
  const [description, setDescription] = useState('');
  
  // Flashcard management
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showEditCardModal, setShowEditCardModal] = useState(false);
  
  // New card state
  const [newCardQuestion, setNewCardQuestion] = useState('');
  const [newCardAnswer, setNewCardAnswer] = useState('');
  
  // Edit card state
  const [editCardQuestion, setEditCardQuestion] = useState('');
  const [editCardAnswer, setEditCardAnswer] = useState('');

  /**
   * Fetches set data from the backend
   */
  const fetchSetData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        router.back();
        return;
      }

      const response = await axios.get(
        createApiUrl(`/api/set/${setid}`),
        getApiConfig(token)
      );

      if (response.data.success) {
        const setData = response.data.set;
        setSet(setData);
        setSetName(setData.set_name);
        setSetSubject(setData.set_subject || '');
        setDescription(setData.description || '');
        setCards(setData.cards || []);
      } else {
        Alert.alert('Error', 'Failed to load set data');
        router.back();
      }
    } catch (error) {
      console.error('[fetchSetData] Error:', error);
      Alert.alert('Error', 'Failed to load set data');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  /**
   * Saves set details to the backend
   */
  const handleSaveSet = async () => {
    if (!setName.trim()) {
      Alert.alert('Error', 'Set name is required');
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const response = await axios.patch(
        createApiUrl(API_ENDPOINTS.SET_UPDATE.replace('[id]', setid!)),
        {
          set_name: setName.trim(),
          set_subject: setSubject.trim(),
          description: description.trim(),
        },
        getApiConfig(token)
      );

      if (response.data.success) {
        Alert.alert('Success', 'Set updated successfully');
        fetchSetData(); // Refresh data
      } else {
        Alert.alert('Error', response.data.error || 'Failed to update set');
      }
    } catch (error: any) {
      console.error('[handleSaveSet] Error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update set');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Adds a new flashcard to the set
   */
  const handleAddCard = async () => {
    if (!newCardQuestion.trim() || !newCardAnswer.trim()) {
      Alert.alert('Error', 'Question and answer are required');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const response = await axios.post(
        createApiUrl(API_ENDPOINTS.SET_ADD_FLASHCARD.replace('[id]', setid!)),
        {
          card_question: newCardQuestion.trim(),
          card_answer: newCardAnswer.trim(),
        },
        getApiConfig(token)
      );

      if (response.data.success) {
        setCards([...cards, response.data.card]);
        setNewCardQuestion('');
        setNewCardAnswer('');
        setShowAddCardModal(false);
        Alert.alert('Success', 'Flashcard added successfully');
      } else {
        Alert.alert('Error', response.data.error || 'Failed to add flashcard');
      }
    } catch (error: any) {
      console.error('[handleAddCard] Error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to add flashcard');
    }
  };

  /**
   * Updates an existing flashcard
   */
  const handleUpdateCard = async () => {
    if (!editingCard) return;
    
    if (!editCardQuestion.trim() || !editCardAnswer.trim()) {
      Alert.alert('Error', 'Question and answer are required');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const response = await axios.patch(
        createApiUrl(API_ENDPOINTS.FLASHCARD_UPDATE.replace('[id]', editingCard.card_id)),
        {
          card_question: editCardQuestion.trim(),
          card_answer: editCardAnswer.trim(),
        },
        getApiConfig(token)
      );

      if (response.data.success) {
        setCards(cards.map(card => 
          card.card_id === editingCard.card_id ? response.data.card : card
        ));
        setShowEditCardModal(false);
        setEditingCard(null);
        Alert.alert('Success', 'Flashcard updated successfully');
      } else {
        Alert.alert('Error', response.data.error || 'Failed to update flashcard');
      }
    } catch (error: any) {
      console.error('[handleUpdateCard] Error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update flashcard');
    }
  };

  /**
   * Deletes a flashcard from the set
   */
  const handleDeleteCard = async (cardId: string) => {
    Alert.alert(
      'Delete Flashcard',
      'Are you sure you want to delete this flashcard?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) {
                Alert.alert('Error', 'Authentication required');
                return;
              }

              const response = await axios.delete(
                createApiUrl(API_ENDPOINTS.FLASHCARD_DELETE.replace('[id]', cardId)),
                getApiConfig(token)
              );

              if (response.data.success) {
                setCards(cards.filter(card => card.card_id !== cardId));
                Alert.alert('Success', 'Flashcard deleted successfully');
              } else {
                Alert.alert('Error', response.data.error || 'Failed to delete flashcard');
              }
            } catch (error: any) {
              console.error('[handleDeleteCard] Error:', error);
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete flashcard');
            }
          },
        },
      ]
    );
  };

  /**
   * Opens the edit card modal
   */
  const openEditCardModal = (card: Flashcard) => {
    setEditingCard(card);
    setEditCardQuestion(card.card_question);
    setEditCardAnswer(card.card_answer);
    setShowEditCardModal(true);
  };

  useEffect(() => {
    if (setid) {
      fetchSetData();
    }
  }, [setid]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading set data...</Text>
      </View>
    );
  }

  if (!set) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Set not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Set</Text>
        <TouchableOpacity onPress={handleSaveSet} style={styles.saveButton} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      {/* Set Details Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Set Details</Text>
        
        <Text style={styles.label}>Set Name *</Text>
        <TextInput
          style={styles.input}
          value={setName}
          onChangeText={setSetName}
          placeholder="Enter set name"
          maxLength={100}
        />

        <Text style={styles.label}>Subject</Text>
        <TextInput
          style={styles.input}
          value={setSubject}
          onChangeText={setSetSubject}
          placeholder="Enter subject (e.g., Math, Science)"
          maxLength={50}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter description (optional)"
          multiline
          numberOfLines={3}
          maxLength={500}
        />
      </View>

      {/* Flashcards Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Flashcards ({cards.length})</Text>
          <TouchableOpacity 
            onPress={() => setShowAddCardModal(true)} 
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>+ Add Card</Text>
          </TouchableOpacity>
        </View>

        {cards.length === 0 ? (
          <Text style={styles.emptyText}>No flashcards yet. Add your first one!</Text>
        ) : (
          <FlatList
            data={cards}
            keyExtractor={(item) => item.card_id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={[styles.cardItem, { borderLeftColor: item.color }]}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardQuestion}>{item.card_question}</Text>
                  <Text style={styles.cardAnswer}>{item.card_answer}</Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    onPress={() => openEditCardModal(item)}
                    style={styles.editButton}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleDeleteCard(item.card_id)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* Add Card Modal */}
      <Modal
        visible={showAddCardModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddCardModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Flashcard</Text>
            
            <Text style={styles.label}>Question *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newCardQuestion}
              onChangeText={setNewCardQuestion}
              placeholder="Enter question"
              multiline
              numberOfLines={2}
            />

            <Text style={styles.label}>Answer *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newCardAnswer}
              onChangeText={setNewCardAnswer}
              placeholder="Enter answer"
              multiline
              numberOfLines={2}
            />



            <View style={styles.modalActions}>
              <TouchableOpacity 
                onPress={() => setShowAddCardModal(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddCard} style={styles.confirmButton}>
                <Text style={styles.confirmButtonText}>Add Card</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Card Modal */}
      <Modal
        visible={showEditCardModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditCardModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Flashcard</Text>
            
            <Text style={styles.label}>Question *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editCardQuestion}
              onChangeText={setEditCardQuestion}
              placeholder="Enter question"
              multiline
              numberOfLines={2}
            />

            <Text style={styles.label}>Answer *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editCardAnswer}
              onChangeText={setEditCardAnswer}
              placeholder="Enter answer"
              multiline
              numberOfLines={2}
            />



            <View style={styles.modalActions}>
              <TouchableOpacity 
                onPress={() => setShowEditCardModal(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdateCard} style={styles.confirmButton}>
                <Text style={styles.confirmButtonText}>Update Card</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    fontStyle: 'italic',
    marginVertical: 20,
  },
  cardItem: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    marginBottom: 12,
  },
  cardQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  cardAnswer: {
    fontSize: 14,
    color: '#666',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#FF3B30',
    marginTop: 50,
  },
});

export default EditSet;
