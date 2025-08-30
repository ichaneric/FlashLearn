// File: card.tsx
// Description: Main card screen with enhanced UI/UX. Includes Backpack (saved sets) and My Sets sections
// with improved design matching the home screen layout.

import { StyleSheet, Text, View, TouchableOpacity, Alert, FlatList, StatusBar, ScrollView, RefreshControl, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { createApiUrl, API_ENDPOINTS, getApiConfig } from '../../config/api';
import { 
  unsaveSet, 
  saveBackpackToStorage, 
  loadBackpackFromStorage, 
  clearBackpackStorage,
  fetchBackpackSets as fetchBackpackFromAPI
} from '../../services/setSaveService';

// Static mapping for default profile images
const PROFILE_IMAGE_MAP = {
  '1.jpg': require('../../assets/images/1.jpg'),
  '2.jpg': require('../../assets/images/2.jpg'),
  '3.jpg': require('../../assets/images/3.jpg'),
  '4.jpg': require('../../assets/images/4.jpg'),
  '5.jpg': require('../../assets/images/5.jpg'),
  '6.jpg': require('../../assets/images/6.jpg'),
  '7.jpg': require('../../assets/images/7.jpg'),
  '8.jpg': require('../../assets/images/8.jpg'),
  '9.jpg': require('../../assets/images/9.jpg'),
  '10.jpg': require('../../assets/images/10.jpg'),
};

// (colors reserved for future use)



const Card = () => {
  const [sets, setSets] = useState([]); // Store sets array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [backpackSets, setBackpackSets] = useState([]); // Saved sets (Backpack)
  const [activeTab, setActiveTab] = useState<'saved' | 'mine'>('saved');
  const [refreshing, setRefreshing] = useState(false);
  
  // Cache for learner counts to prevent repeated API calls
  const [learnerCountCache, setLearnerCountCache] = useState({});

  /**
   * Handles pull to refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Clear cache on refresh to get fresh data
      setLearnerCountCache({});
      await fetchSetsAndBackpack();
    } catch (error) {
      console.error('[onRefresh] Error:', error.message, error.stack);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Manually cleans up orphaned sets from user-scoped backpack storage
   */
  const cleanupBackpack = async () => {
    try {
      const storedSets = await loadBackpackFromStorage();
      if (storedSets.length > 0) {
        const cleanedSets = storedSets.filter(set => set.set_id && set.set_name);
        
        if (cleanedSets.length !== storedSets.length) {
          await saveBackpackToStorage(cleanedSets);
          setBackpackSets(cleanedSets);
          console.log(`[cleanupBackpack] Removed ${storedSets.length - cleanedSets.length} orphaned sets`);
        }
      }
    } catch (error) {
      console.error('[cleanupBackpack] Error:', error.message, error.stack);
    }
  };

  /**
   * Fetches sets from backend API
   */
  const fetchSets = async () => {
    try {
      setLoading(true);
      setError('');
      const token = await AsyncStorage.getItem('token');

      const response = await axios.get(createApiUrl(API_ENDPOINTS.SET_ALL), getApiConfig(token));
      
      // Ensure response.data is an array
      const setsData = Array.isArray(response.data) ? response.data : 
                      Array.isArray(response.data?.sets) ? response.data.sets : 
                      Array.isArray(response.data?.data) ? response.data.data : [];
      
      if (!Array.isArray(setsData)) {
        console.warn('[fetchSets] Response data is not an array, resetting to empty array');
        setSets([]);
        return;
      }
      
      // First, set the sets without learner counts for immediate display
      const initialSets = setsData.map(set => ({
        ...set,
        learnerCount: 0 // Default to 0, will be updated if fetch succeeds
      }));
      setSets(initialSets);
      
      // Then fetch learner counts in the background with better error handling and caching
      const setsWithLearnerCount = await Promise.allSettled(
        setsData.map(async (set) => {
          // Check cache first
          if (learnerCountCache[set.set_id] !== undefined) {
            return {
              set_id: set.set_id,
              learnerCount: learnerCountCache[set.set_id]
            };
          }
          
          try {
            const learnerResponse = await axios.get(
              `${createApiUrl(API_ENDPOINTS.SET_SAVE)}?set_id=${set.set_id}`, 
              getApiConfig(token)
            );
            
            // Handle different response scenarios
            if (learnerResponse.status === 404) {
              // Set not found - this is normal for deleted sets
              return {
                set_id: set.set_id,
                learnerCount: 0
              };
            }
            
            const count = learnerResponse.data?.learnerCount || 0;
            
            // Update cache
            setLearnerCountCache(prev => ({
              ...prev,
              [set.set_id]: count
            }));
            
            return {
              set_id: set.set_id,
              learnerCount: count
            };
          } catch (learnerErr) {
            // Handle different error types
            if (learnerErr.response?.status === 404) {
              // Set not found - this is normal for deleted sets
              return {
                set_id: set.set_id,
                learnerCount: 0
              };
            }
            
            // Only log non-404 errors to reduce spam
            if (learnerErr.response?.status !== 404) {
              console.error(`[Card] Error fetching learner count for set ${set.set_id}:`, learnerErr.message);
            }
            
            return {
              set_id: set.set_id,
              learnerCount: 0
            };
          }
        })
      );
      
      // Update sets with successful learner count results
      const updatedSets = initialSets.map(set => {
        const learnerResult = setsWithLearnerCount.find(result => 
          result.status === 'fulfilled' && (result as PromiseFulfilledResult<any>).value.set_id === set.set_id
        );
        return {
          ...set,
          learnerCount: learnerResult && learnerResult.status === 'fulfilled' 
            ? (learnerResult as PromiseFulfilledResult<any>).value.learnerCount || 0 
            : 0
        };
      });
      
      setSets(updatedSets);
    } catch (error) {
      console.error('[fetchSets] Error:', error.message, error.stack);
      setError('No sets of flashcard made');
      setSets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSetsAndBackpack = async () => {
    await fetchSets();
    await fetchBackpackSets();
  };

  useEffect(() => {
    // intentionally not adding fetchSetsAndBackpack in deps to avoid re-creation loop
    fetchSetsAndBackpack();
    // Clean up orphaned sets on mount
    cleanupBackpack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Loads saved Backpack sets from API and user-scoped storage
   */
  const fetchBackpackSets = async () => {
    try {
      // First try to load from API to get fresh data
      try {
        const apiResult = await fetchBackpackFromAPI();
        if (apiResult.success && apiResult.backpackSets) {
          // Save to user-scoped storage
          await saveBackpackToStorage(apiResult.backpackSets);
          setBackpackSets(apiResult.backpackSets);
          return;
        }
      } catch (apiError) {
        console.warn('[fetchBackpackSets] API failed, falling back to local storage:', apiError.message);
      }

      // Fallback to local storage if API fails
      const storedSets = await loadBackpackFromStorage();
      if (storedSets.length > 0) {
        // Try to enrich with current data from posted sets
        try {
          const response = await axios.get(createApiUrl(API_ENDPOINTS.SET_POSTED));
          
          // Ensure allPostedSets is an array
          const allPostedSets = Array.isArray(response.data) ? response.data : 
                              Array.isArray(response.data?.sets) ? response.data.sets : 
                              Array.isArray(response.data?.data) ? response.data.data : [];
          
          if (Array.isArray(allPostedSets)) {
            // Merge stored sets with current data and filter out non-existent sets
            const enrichedSets = storedSets
              .map(storedSet => {
                const currentData = allPostedSets.find(posted => posted.set_id === storedSet.set_id);
                return currentData ? { ...storedSet, ...currentData } : null;
              })
              .filter(set => set !== null); // Remove sets that no longer exist
            
            // Update storage with cleaned data if different
            if (enrichedSets.length !== storedSets.length) {
              console.log(`[fetchBackpackSets] Cleaned up ${storedSets.length - enrichedSets.length} orphaned sets from backpack`);
              await saveBackpackToStorage(enrichedSets);
            }
            
            setBackpackSets(enrichedSets);
          } else {
            setBackpackSets(storedSets);
          }
        } catch (enrichError) {
          console.error('[fetchBackpackSets] Enrichment failed:', enrichError.message);
          setBackpackSets(storedSets);
        }
      } else {
        setBackpackSets([]);
      }
    } catch (error) {
      console.error('[fetchBackpackSets] Error:', error.message, error.stack);
      setBackpackSets([]);
    }
  };

  /**
   * Saves a set to Backpack (favorites) - currently unused but kept for potential features
   * @param {Object} setObj - The set object to save
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const saveToBackpack = async (setObj) => {
    try {
      const exists = backpackSets.some(s => s.set_id === setObj.set_id);
      if (exists) return;
      const updated = [setObj, ...backpackSets];
      setBackpackSets(updated);
      await saveBackpackToStorage(updated);
      Alert.alert('Saved', 'Set added to your Backpack.');
    } catch (error) {
      console.error('[saveToBackpack] Error:', error.message, error.stack);
      Alert.alert('Error', 'Failed to save to Backpack.');
    }
  };

  /**
   * Removes a set from Backpack and updates learner count
   * @param {string} set_id - The set ID to remove
   */
  const removeFromBackpack = async (set_id) => {
    try {
      // Remove locally first for immediate UI feedback
      const originalBackpackSets = [...backpackSets];
      const updated = backpackSets.filter(s => s.set_id !== set_id);
      setBackpackSets(updated);
      await saveBackpackToStorage(updated);
      
      try {
        // Call the API to unsave the set and get updated learner count
        const result = await unsaveSet(set_id);
        
        if (result.success) {
          // Update the learner count in My Sets if this set exists there
          setSets(prevSets => prevSets.map(set => 
            set.set_id === set_id 
              ? { ...set, learnerCount: result.learnerCount || set.learnerCount }
              : set
          ));
          
          // Update cache with new learner count
          setLearnerCountCache(prev => ({
            ...prev,
            [set_id]: result.learnerCount || 0
          }));
        } else {
          throw new Error('API unsave failed');
        }
      } catch (apiError) {
        console.error('[removeFromBackpack] API Error:', apiError.message);
        // Revert local changes if API fails
        setBackpackSets(originalBackpackSets);
        await saveBackpackToStorage(originalBackpackSets);
        Alert.alert('Error', 'Failed to remove set. Please try again.');
      }
    } catch (error) {
      console.error('[removeFromBackpack] Error:', error.message, error.stack);
      Alert.alert('Error', 'Failed to remove from Backpack.');
    }
  };

  // Delete a set (and its flashcards)
  const handleDelete = async (set_id) => {
    Alert.alert(
      'Delete Set',
      'Are you sure you want to delete this set? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const setToDelete = sets.find(s => s.set_id === set_id);
              if (setToDelete && setToDelete.cards && setToDelete.cards.length > 0) {
                for (const card of setToDelete.cards) {
                  await axios.delete(createApiUrl('/api/card/delete'), {
                    headers: { Authorization: `Bearer ${token}` },
                    data: { card_id: card.card_id, set_id },
                  });
                }
              }
              await axios.put(createApiUrl('/api/set/delete'), { set_id }, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setSets(prev => prev.filter(s => s.set_id !== set_id));
              setBackpackSets(prev => prev.filter(s => s.set_id !== set_id));
              Alert.alert('Success', 'Set deleted successfully.');
            } catch {
              Alert.alert('Error', 'Failed to delete set.');
            }
          }
        }
      ]
    );
  };

  /**
   * Toggles the posted status of a set and updates learner count
   * @param {Object} setObj - The set object to toggle
   */
  const handleTogglePost = async (setObj) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const updated = {
        set_id: setObj.set_id,
        set_name: setObj.set_name,
        set_subject: setObj.set_subject,
        category: setObj.category,
        posted: !setObj.posted,
      };
      
      await axios.put(createApiUrl('/api/set/edit'), updated, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Update the set status locally
      setSets(prev => prev.map(s => 
        s.set_id === setObj.set_id 
          ? { ...s, posted: !s.posted, learnerCount: s.learnerCount || 0 }
          : s
      ));
      
      // If unpublishing, remove from backpack since it's no longer public
      if (setObj.posted) {
        const updatedBackpack = backpackSets.filter(s => s.set_id !== setObj.set_id);
        setBackpackSets(updatedBackpack);
        await saveBackpackToStorage(updatedBackpack);
      }
      
      Alert.alert(
        'Success', 
        `Set ${!setObj.posted ? 'published' : 'made private'} successfully.`
      );
    } catch (error) {
      console.error('[handleTogglePost] Error:', error.message, error.stack);
      Alert.alert('Error', 'Failed to update set status.');
    }
  };

  /**
   * Navigates to set viewer
   * @param {Object} setObj - The set object to view
   */
  const handleViewSet = async (setObj) => {
    router.push({ pathname: '/set/[setid]', params: { setid: setObj.set_id } });
  };

  /**
   * Helper to get the creator/user object from set object
   * @param {Object} item - The set object
   * @returns {Object|null} The creator/user object
   */
  const getCreatorObject = (item) => {
    try {
      // Handle backpack API response structure (creator object)
      if (item.creator && typeof item.creator === 'object') {
        return item.creator;
      }
      
      // Handle legacy user object structure
      if (item.user && typeof item.user === 'object') {
        return item.user;
      }
      
      return null;
    } catch (error) {
      console.error('[getCreatorObject] Error:', error.message, error.stack);
      return null;
    }
  };

  /**
   * Helper to get creator's full name from set object
   * @param {Object} item - The set object
   * @returns {string} The creator's name
   */
  const getCreatorName = (item) => {
    try {
      // Handle backpack API response structure (creator object)
      if (item.creator && typeof item.creator === 'object') {
        return item.creator.full_name || item.creator.username || 'Unknown';
      }
      
      // Handle legacy user object structure
      if (item.user && item.user.full_name) {
        return item.user.full_name;
      }
      
      // Handle string creator field
      if (item.creator && typeof item.creator === 'string') {
        return item.creator;
      }
      
      return 'Unknown';
    } catch (error) {
      console.error('[getCreatorName] Error:', error.message, error.stack);
      return 'Unknown';
    }
  };

  /**
   * Mock proficiency data - currently unused but kept for future features
   * @param {string} setId - The set ID
   * @returns {number} The proficiency percentage
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getProficiency = (setId) => {
    const proficiencies = [85, 92, 78, 95, 88, 73, 96, 82, 89, 91];
    return proficiencies[setId % proficiencies.length] || 0;
  };

  /**
   * Mock learner count data by set ID - kept for fallback purposes
   * @param {string} setId - The set ID
   * @returns {number} The number of learners who saved this set
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getLearnerCountById = (setId) => {
    // Simulate learner count based on set ID for demo
    const learnerCounts = [42, 28, 156, 73, 91, 35, 124, 67, 88, 203];
    return learnerCounts[setId % learnerCounts.length] || 0;
  };

  /**
   * Formats the date created for display
   * @param {string} dateString - The date string from the API
   * @returns {string} Formatted date string
   */
  const formatDateCreated = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  /**
   * Determines the correct image source for profile display from the set's user/creator data
   * @param {Object} user - The user object from the set
   * @returns {any} The image source for React Native Image component
   */
  const getProfileImageSource = (user) => {
    try {
      // If no user object, return default
      if (!user) {
        return PROFILE_IMAGE_MAP['1.jpg'];
      }
      
      // Try both 'profile' and 'profile_image' fields (API inconsistency)
      const profileImage = user.profile || user.profile_image;
      
      // If no profile image, return default
      if (!profileImage) {
        return PROFILE_IMAGE_MAP['1.jpg'];
      }
      
      // Check if it's a custom uploaded image (contains underscore or email pattern)
      if (profileImage.includes('_') || profileImage.includes('@')) {
        return { uri: `${createApiUrl(API_ENDPOINTS.UPLOADS)}/${profileImage}` };
      }
      
      // Check if it's a default avatar (1-10.jpg)
      if (PROFILE_IMAGE_MAP[profileImage]) {
        return PROFILE_IMAGE_MAP[profileImage];
      }
      
      // Fallback to default
      return PROFILE_IMAGE_MAP['1.jpg'];
    } catch (error) {
      console.error('[getProfileImageSource] Error:', error.message, error.stack);
      return PROFILE_IMAGE_MAP['1.jpg'];
    }
  };

  /**
   * Gets the accurate learner count for a set from API data
   * @param {Object} item - The set item object
   * @returns {number} The actual learner count from API
   */
  const getLearnerCount = (item) => {
    // Use the actual learner count from the API response for posted sets
    // For personal sets, we'll fetch this data separately if needed
    return item.learnerCount || 0;
  };

  // Render a single set card using modern layout from home.tsx
  const renderSet = ({ item }) => {
    const categoryLabel = item.set_subject || 'General';
    const creatorName = getCreatorName(item);
    const learnerCount = getLearnerCount(item);
    const isInSavedTab = activeTab === 'saved';

    return (
      <View style={styles.modernSetCard}>
        {/* Header with title, category, and actions */}
        <View style={styles.cardHeader}>
          <View style={styles.titleSection}>
            <Text style={styles.setTitle} numberOfLines={2}>
              {item.set_name}
            </Text>
            <Text style={styles.setCategory}>{categoryLabel}</Text>
          </View>
          {isInSavedTab ? (
            <TouchableOpacity 
              style={styles.modernRemoveButton}
              onPress={() => removeFromBackpack(item.set_id)}
              activeOpacity={0.7}
            >
              <Image 
                source={require('../../assets/icons/delete.png')} 
                style={styles.modernRemoveIcon} 
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.modernStatusBadge}>
              <Text style={styles.modernStatusText}>{item.posted ? 'Published' : 'Private'}</Text>
            </View>
          )}
        </View>

        {/* Divider line */}
        <View style={styles.divider} />

        {/* Stats section */}
        <View style={styles.modernStatsSection}>
          <View style={styles.modernStatItem}>
            <Image source={require('../../assets/icons/cards.png')} style={styles.modernStatIcon} />
            <Text style={styles.modernStatText}>{item.cards?.length || 0} cards</Text>
          </View>
          <View style={styles.modernStatItem}>
            <Image source={require('../../assets/icons/learners.png')} style={styles.modernStatIcon} />
            <Text style={styles.modernStatText}>{learnerCount} learners</Text>
          </View>
          <View style={styles.modernStatItem}>
            <Image source={require('../../assets/icons/clock.png')} style={styles.modernStatIcon} />
            <Text style={styles.modernStatText}>{formatDateCreated(item.date_created)}</Text>
          </View>
        </View>

        {/* Divider line */}
        <View style={styles.divider} />

        {/* Creator section */}
        <View style={styles.creatorSection}>
          <Image 
            source={getProfileImageSource(getCreatorObject(item))} 
            style={styles.creatorImage} 
          />
          <Text style={styles.creatorName}>{creatorName}</Text>
        </View>

        {/* Action buttons row */}
        <View style={styles.actionButtonsContainer}>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.modernViewButton}
              onPress={() => handleViewSet(item)}
            >
              <Text style={styles.modernViewButtonText}>View Set</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modernQuizButton}
              onPress={() => router.push({ 
                pathname: '/quiz/[setid]' as any, 
                params: { setid: item.set_id, setname: item.set_name } 
              })}
            >
              <Image source={require('../../assets/icons/study.png')} style={styles.buttonIcon} />
              <Text style={styles.modernQuizButtonText}>Quiz</Text>
            </TouchableOpacity>
          </View>


        </View>

        {/* My Sets specific actions */}
        {!isInSavedTab && (
          <View style={styles.mySetActions}>
            {/* Publish/Unpublish Toggle */}
            <TouchableOpacity 
              style={[styles.publishToggleButton, { 
                backgroundColor: item.posted ? '#4CAF50' : '#FF9800' 
              }]}
              onPress={() => handleTogglePost(item)}
            >
              <Image 
                source={item.posted ? require('../../assets/icons/education.png') : require('../../assets/icons/privacy.png')} 
                style={styles.publishIcon} 
              />
              <Text style={styles.publishButtonText}>
                {item.posted ? 'Published' : 'Private'}
              </Text>
            </TouchableOpacity>

            {/* Icon-only action buttons */}
            <View style={styles.iconButtonsContainer}>
              {/* Edit button */}
              <TouchableOpacity 
                style={[styles.iconButton, styles.editIconButton]}
                onPress={() => router.push({ 
                  pathname: '/set/editset', 
                  params: { setid: item.set_id } 
                })}
              >
                <Image source={require('../../assets/icons/edit.png')} style={styles.iconButtonImage} />
              </TouchableOpacity>
              
              {/* Delete button */}
              <TouchableOpacity 
                style={[styles.iconButton, styles.deleteIconButton]}
                onPress={() => {
                  Alert.alert(
                    'Delete Set',
                    `Are you sure you want to delete "${item.set_name}"? This action cannot be undone.`,
                    [
                      {
                        text: 'Cancel',
                        style: 'cancel',
                      },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => handleDelete(item.set_id),
                      },
                    ]
                  );
                }}
              >
                <Image source={require('../../assets/icons/delete.png')} style={styles.iconButtonImage} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
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
          <Text style={styles.loadingText}>Loading your sets...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Backpack</Text>
        <Text style={styles.subtitle}>Manage your personal flashcard sets</Text>
      </View>

      {/* Create New Set Button */}
      <TouchableOpacity 
        style={styles.primaryCreateBtn}
        onPress={() => router.push('/set/createset')}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#4f46e5', '#6366f1']}
          style={styles.primaryCreateBtnGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.primaryCreateBtnText}>+ Create New Set</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Internal Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'saved' && styles.activeTab]} onPress={() => setActiveTab('saved')}>
          <Text style={[styles.tabText, activeTab === 'saved' && styles.activeTabText]}>Saved</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'mine' && styles.activeTab]} onPress={() => setActiveTab('mine')}>
          <Text style={[styles.tabText, activeTab === 'mine' && styles.activeTabText]}>My Sets</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content: Saved */}
      {activeTab === 'saved' && (
        <View style={styles.section}>
          {backpackSets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎒</Text>
              <Text style={styles.emptyText}>No saved sets</Text>
              <Text style={styles.emptySubtext}>Save sets to access them anytime</Text>
            </View>
          ) : (
            <FlatList
              data={backpackSets}
              renderItem={({ item }) => renderSet({ item })}
              keyExtractor={(item) => item.set_id || Math.random().toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.setsList}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => {
                    setRefreshing(true);
                    fetchBackpackSets().finally(() => setRefreshing(false));
                  }}
                  tintColor="#FFFFFF"
                  colors={['#FFFFFF']}
                />
              }
            />
          )}
        </View>
      )}

      {/* Tab Content: My Sets */}
      {activeTab === 'mine' && (
        <ScrollView 
          style={styles.section}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFFFFF"
              colors={['#FFFFFF']}
            />
          }
        >
          {error ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyText}>{error}</Text>
              <Text style={styles.emptySubtext}>Create your first set to get started!</Text>
            </View>
          ) : sets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyText}>No sets yet</Text>
              <Text style={styles.emptySubtext}>Create your first set to get started!</Text>
            </View>
          ) : (
            sets.map((item) => (
              <View key={item.set_id || Math.random().toString()}>
                {renderSet({ item })}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
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
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  primaryCreateBtn: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryCreateBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCreateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Internal tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 6,
    marginBottom: 10,
    gap: 8,
  },
  tab: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  tabText: {
    color: '#fff',
    fontWeight: '700',
  },
  activeTabText: {
    color: '#111827',
  },
  section: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  bpCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  bpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bpTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    paddingRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  published: { backgroundColor: '#22c55e26' },
  private: { backgroundColor: '#f59e0b26' },
  statusBadgeText: { fontSize: 12, fontWeight: '700', color: '#111827' },
  bpSubtitle: {
    color: '#6b7280',
    marginBottom: 8,
  },
  bpMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  bpMetaText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
  bpFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bpOwner: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
  bpChip: {
    backgroundColor: '#f3f4f6',
    color: '#111827',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
  },
  setsList: {
    paddingBottom: 30,
  },
  // Professional Set Card Styles
  professionalSetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 15,
    backgroundColor: '#F8F9FA',
  },
  titleSection: {
    flex: 1,
    marginRight: 15,
  },
  setTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  setSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  professionalStatusBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  recentBadge: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  recentText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  metaSection: {
    marginBottom: 20,
  },
  categoryContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
  },
  learnerContainer: {
    marginBottom: 16,
  },
  learnerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  learnerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  learnerIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  learnerText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  proficiencyContainer: {
    marginBottom: 16,
  },
  proficiencyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  proficiencyBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  proficiencyFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  proficiencyText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4facfe',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  additionalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  removeButton: {
    flex: 1,
    backgroundColor: '#FF5722',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backpackButton: {
    backgroundColor: '#2196F3',
  },
    savedButton: {
    backgroundColor: '#4CAF50',
  },
  viewButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  quizButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
 
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  
  // Modern Set Card Styles (Matching Home Screen)
  modernSetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  setCategory: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  modernRemoveButton: {
    padding: 8,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  modernRemoveIcon: {
    width: 20,
    height: 20,
    tintColor: '#ff4444',
  },
  modernStatusBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  modernStatusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  modernStatsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modernStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modernStatIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
    tintColor: '#666',
  },
  modernStatText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  creatorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  creatorImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  creatorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    marginRight: 12,
  },
  modernViewButton: {
    flex: 1,
    backgroundColor: '#4facfe',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modernViewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modernQuizButton: {
    flex: 1,
    backgroundColor: '#43e97b',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modernQuizButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  buttonIcon: {
    width: 16,
    height: 16,
    tintColor: '#FFFFFF',
  },

  mySetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  publishToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  publishIcon: {
    width: 16,
    height: 16,
    tintColor: '#FFFFFF',
    marginRight: 6,
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  iconButtonsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  editIconButton: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  deleteIconButton: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  iconButtonImage: {
    width: 18,
    height: 18,
    tintColor: '#666',
  },


});

export default Card;