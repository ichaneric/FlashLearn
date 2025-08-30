// File: drafts.tsx
// Description: Screen to display and manage user's draft flashcard sets

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createApiUrl, API_ENDPOINTS, getApiConfig } from '../../config/api';

interface DraftSet {
  set_id: string;
  set_name: string;
  set_subject: string;
  description?: string;
  date_created: string;
  number_of_cards: number;
  status: string;
  cards: Array<{
    card_id: string;
    card_question: string;
    card_answer: string;
    color: string;
  }>;
}

const DraftsScreen = () => {
  const [drafts, setDrafts] = useState<DraftSet[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDrafts();
  }, []);

  /**
   * Loads user's draft sets from the backend
   */
  const loadDrafts = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in again');
        router.push('/auth/login');
        return;
      }

      const response = await axios.get(
        createApiUrl(API_ENDPOINTS.SET_DRAFTS),
        getApiConfig(token)
      );

      setDrafts(response.data);
    } catch (error) {
      console.error('[loadDrafts] Error:', error);
      Alert.alert('Error', 'Failed to load drafts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Handles refresh action
   */
  const onRefresh = () => {
    setRefreshing(true);
    loadDrafts();
  };

  /**
   * Publishes a draft set
   */
  const handlePublishDraft = async (draft: DraftSet) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in again');
        return;
      }

      await axios.put(
        createApiUrl(`${API_ENDPOINTS.SET}/${draft.set_id}/publish`),
        {},
        getApiConfig(token)
      );

      Alert.alert('Success', 'Draft published successfully!');
      loadDrafts(); // Refresh the list
    } catch (error: any) {
      console.error('[handlePublishDraft] Error:', error);
      const backendMsg = error?.response?.data?.error;
      const errorMessage = backendMsg || error.message || 'Failed to publish draft';
      Alert.alert('Error', errorMessage);
    }
  };

  /**
   * Deletes a draft set
   */
  const handleDeleteDraft = async (draft: DraftSet) => {
    Alert.alert(
      'Delete Draft',
      `Are you sure you want to delete "${draft.set_name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) {
                Alert.alert('Authentication Error', 'Please log in again');
                return;
              }

              await axios.delete(
                createApiUrl(`${API_ENDPOINTS.SET}/${draft.set_id}`),
                getApiConfig(token)
              );

              Alert.alert('Success', 'Draft deleted successfully');
              loadDrafts(); // Refresh the list
            } catch (error: any) {
              console.error('[handleDeleteDraft] Error:', error);
              const backendMsg = error?.response?.data?.error;
              const errorMessage = backendMsg || error.message || 'Failed to delete draft';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  /**
   * Formats date for display
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  /**
   * Renders a single draft item
   */
  const renderDraftItem = ({ item }: { item: DraftSet }) => (
    <View style={styles.draftCard}>
      <View style={styles.draftHeader}>
        <View style={styles.draftInfo}>
          <Text style={styles.draftTitle} numberOfLines={2}>{item.set_name}</Text>
          <Text style={styles.draftSubject}>{item.set_subject}</Text>
          {item.description && (
            <Text style={styles.draftDescription} numberOfLines={1}>{item.description}</Text>
          )}
        </View>
        <View style={styles.draftStats}>
          <Text style={styles.cardCount}>{item.number_of_cards} cards</Text>
          <Text style={styles.dateCreated}>{formatDate(item.date_created)}</Text>
        </View>
      </View>

      <View style={styles.draftActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => router.push({ 
            pathname: '/set/editset', 
            params: { setid: item.set_id } 
          })}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.publishButton]}
          onPress={() => handlePublishDraft(item)}
        >
          <Text style={styles.publishButtonText}>Publish</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteDraft(item)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  /**
   * Renders empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Drafts Found</Text>
      <Text style={styles.emptyDescription}>
        You don't have any draft sets yet. Create a new set to get started!
      </Text>
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => router.push('/set/createset')}
      >
        <LinearGradient
          colors={['#4facfe', '#00f2fe']}
          style={styles.createButtonGradient}
        >
          <Text style={styles.createButtonText}>Create New Set</Text>
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
        <Text style={styles.headerTitle}>My Drafts</Text>
        <TouchableOpacity 
          style={styles.createNewButton}
          onPress={() => router.push('/set/createset')}
        >
          <Text style={styles.createNewButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Drafts List */}
      <FlatList
        data={drafts}
        renderItem={renderDraftItem}
        keyExtractor={(item) => item.set_id}
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

export default DraftsScreen;

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
  createNewButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createNewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  draftCard: {
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
  draftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  draftInfo: {
    flex: 1,
    marginRight: 15,
  },
  draftTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  draftSubject: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  draftDescription: {
    fontSize: 12,
    color: '#999',
  },
  draftStats: {
    alignItems: 'flex-end',
  },
  cardCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4facfe',
    marginBottom: 2,
  },
  dateCreated: {
    fontSize: 12,
    color: '#666',
  },
  draftActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#3b82f6',
  },
  publishButton: {
    backgroundColor: '#10b981',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
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
  createButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonGradient: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
