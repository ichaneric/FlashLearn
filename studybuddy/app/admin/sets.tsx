// File: studybuddy/app/admin/sets.tsx
// Description: Admin sets management with popularity tracking and admin delete functionality

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createApiUrl, API_ENDPOINTS, getApiConfig } from '../../config/api';
import axios from 'axios';
import { router } from 'expo-router';

interface Set {
  set_id: string;
  set_name: string;
  set_subject: string;
  description: string;
  date_created: string;
  posted: boolean;
  status: string;
  cards_count: number;
  learners_count: number;
  creator: {
    username: string;
    full_name: string;
  };
}

const AdminSets = () => {
  const [sets, setSets] = useState<Set[]>([]);
  const [filteredSets, setFilteredSets] = useState<Set[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'learners' | 'date' | 'name'>('learners');

  /**
   * Fetches all sets with their statistics
   */
  const fetchSets = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(
        createApiUrl(API_ENDPOINTS.ADMIN_SETS),
        getApiConfig(token)
      );
      setSets(response.data);
      setFilteredSets(response.data);
    } catch (error) {
      console.error('[fetchSets] Error:', error);
      Alert.alert('Error', 'Failed to load sets data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSets();
  }, []);

  useEffect(() => {
    // Filter and sort sets
    let filtered = sets;
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      filtered = sets.filter(set =>
        set.set_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        set.set_subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        set.creator.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'learners':
          return b.learners_count - a.learners_count;
        case 'date':
          return new Date(b.date_created).getTime() - new Date(a.date_created).getTime();
        case 'name':
          return a.set_name.localeCompare(b.set_name);
        default:
          return 0;
      }
    });
    
    setFilteredSets(filtered);
  }, [searchQuery, sets, sortBy]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSets();
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

  /**
   * Handles set deletion by admin
   */
  const handleDeleteSet = async (set: Set) => {
    Alert.alert(
      'Delete Set',
      `Are you sure you want to delete "${set.set_name}"?\n\nThis will permanently remove the set and all its flashcards.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.put(
                createApiUrl(API_ENDPOINTS.ADMIN_DELETE_SET),
                { set_id: set.set_id },
                getApiConfig(token)
              );
              
              // Remove from local state
              setSets(prev => prev.filter(s => s.set_id !== set.set_id));
              Alert.alert('Success', 'Set deleted successfully');
            } catch (error) {
              console.error('[handleDeleteSet] Error:', error);
              Alert.alert('Error', 'Failed to delete set');
            }
          },
        },
      ]
    );
  };

  /**
   * Handles set detail view
   */
  const handleSetPress = (set: Set) => {
    Alert.alert(
      'Set Details',
      `Title: ${set.set_name}\nSubject: ${set.set_subject}\nDescription: ${set.description || 'No description'}\nCreator: ${set.creator.full_name} (@${set.creator.username})\nCards: ${set.cards_count}\nLearners: ${set.learners_count}\nStatus: ${set.posted ? 'Published' : 'Draft'}\nCreated: ${formatDate(set.date_created)}`,
      [
        { text: 'Close', style: 'cancel' },
        {
          text: 'View Set',
          onPress: () => {
            // Navigate to admin set viewer
            router.push(`/set/adminsetviewer?setid=${set.set_id}`);
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteSet(set),
        },
      ]
    );
  };

  /**
   * Renders a set item
   */
  const renderSetItem = ({ item }: { item: Set }) => (
    <TouchableOpacity
      style={styles.setCard}
      onPress={() => handleSetPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.setHeader}>
        <View style={styles.setInfo}>
          <Text style={styles.setName} numberOfLines={2}>{item.set_name}</Text>
          <Text style={styles.setSubject}>{item.set_subject}</Text>
          <Text style={styles.setCreator}>by @{item.creator.username}</Text>
        </View>
        <View style={styles.setStatus}>
          {item.posted ? (
            <View style={styles.publishedBadge}>
              <Text style={styles.publishedText}>PUBLISHED</Text>
            </View>
          ) : (
            <View style={styles.draftBadge}>
              <Text style={styles.draftText}>DRAFT</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.setStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.cards_count}</Text>
          <Text style={styles.statLabel}>Cards</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.learners_count}</Text>
          <Text style={styles.statLabel}>Learners</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatDate(item.date_created)}</Text>
          <Text style={styles.statLabel}>Created</Text>
        </View>
      </View>

      {item.description && (
        <View style={styles.setDescription}>
          <Text style={styles.descriptionText} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  /**
   * Renders sort options
   */
  const renderSortOptions = () => (
    <View style={styles.sortContainer}>
      <Text style={styles.sortLabel}>Sort by:</Text>
      <View style={styles.sortButtons}>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'learners' && styles.sortButtonActive]}
          onPress={() => setSortBy('learners')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'learners' && styles.sortButtonTextActive]}>
            Learners
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'date' && styles.sortButtonActive]}
          onPress={() => setSortBy('date')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'date' && styles.sortButtonTextActive]}>
            Date
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
          onPress={() => setSortBy('name')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'name' && styles.sortButtonTextActive]}>
            Name
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  /**
   * Renders empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📚</Text>
      <Text style={styles.emptyTitle}>No Sets Found</Text>
      <Text style={styles.emptyDescription}>
        {searchQuery ? 'Try adjusting your search terms' : 'No sets created yet'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.loadingGradient}
        >
          <Text style={styles.loadingText}>Loading Sets...</Text>
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
        <Text style={styles.headerTitle}>Set Management</Text>
        <Text style={styles.headerSubtitle}>
          {filteredSets.length} of {sets.length} sets
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search sets..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Sort Options */}
      {renderSortOptions()}

      {/* Sets List */}
      <FlatList
        data={filteredSets}
        renderItem={renderSetItem}
        keyExtractor={(item) => item.set_id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

export default AdminSets;

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
    paddingBottom: 15,
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  sortLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginRight: 10,
  },
  sortButtons: {
    flexDirection: 'row',
  },
  sortButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  sortButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sortButtonTextActive: {
    color: '#667eea',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  setCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  setInfo: {
    flex: 1,
    marginRight: 10,
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
    marginBottom: 2,
  },
  setCreator: {
    fontSize: 12,
    color: '#999',
  },
  setStatus: {
    alignItems: 'flex-end',
  },
  publishedBadge: {
    backgroundColor: '#43e97b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  publishedText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  draftBadge: {
    backgroundColor: '#ffa726',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  draftText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  setStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
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
  setDescription: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  descriptionText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});
