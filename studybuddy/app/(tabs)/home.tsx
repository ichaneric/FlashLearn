// File: home.tsx
// Description: Home screen with enhanced UI/UX featuring Mainstream greeting, search functionality with subject filters, and improved design

import { StyleSheet, Text, View, TouchableOpacity, Image, FlatList, StatusBar, TextInput, RefreshControl, Alert, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { router, useFocusEffect } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  saveSet, 
  unsaveSet, 
  saveBackpackToStorage, 
  loadBackpackFromStorage 
} from '../../services/setSaveService';
import { createApiUrl, API_ENDPOINTS, getApiConfig } from '../../config/api';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CATEGORY_LABELS = {
  'elementary': 'Elementary',
  'junior_highschool': 'Junior High',
  'senior_highschool': 'Senior Highschool',
  'college': 'College',
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars  
const COLOR_SWATCHES = [
  { name: 'yellow', hex: '#FFFF00', isDark: false },
  { name: 'pink', hex: '#FFC0CB', isDark: false },
  { name: 'white', hex: '#FFFFFF', isDark: false },
  { name: 'lightblue', hex: '#87CEFA', isDark: false },
  { name: 'lightgreen', hex: '#90EE90', isDark: false },
  { name: 'blue', hex: '#0000FF', isDark: true },
  { name: 'green', hex: '#008000', isDark: true },
  { name: 'purple', hex: '#800080', isDark: true },
  { name: 'red', hex: '#B22222', isDark: true },
  { name: 'brown', hex: '#8B4513', isDark: true },
];

// Subject options for filtering
const SUBJECT_OPTIONS = [
  { label: 'All Subjects', value: '' },
  { label: 'Science', value: 'science' },
  { label: 'Math', value: 'math' },
  { label: 'History', value: 'history' },
  { label: 'English', value: 'english' },
  { label: 'Geography', value: 'geography' },
  { label: 'Biology', value: 'biology' },
  { label: 'Chemistry', value: 'chemistry' },
  { label: 'Physics', value: 'physics' },
  { label: 'Literature', value: 'literature' },
  { label: 'Art', value: 'art' },
  { label: 'Music', value: 'music' },
  { label: 'Computer Science', value: 'computer_science' },
  { label: 'Economics', value: 'economics' },
  { label: 'Psychology', value: 'psychology' },
];

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

const Home = () => {
  const [userName, setUserName] = useState(''); // Used for greeting display
  const [sets, setSets] = useState([]);
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [filteredSets, setFilteredSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savedSets, setSavedSets] = useState([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  /**
   * Fetches user data and posted sets from the backend API
   * @param {boolean} preserveCategory - Whether to preserve current category filter on refresh
   */
  const fetchUserAndSets = async (preserveCategory = false) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        // Fetch user data
        const userResponse = await axios.get(createApiUrl(API_ENDPOINTS.USER_DATA), getApiConfig(token));
        const { full_name } = userResponse.data;
        setUserName(full_name || 'User');
        if (!preserveCategory) setSubject(''); // Only set category on first load, not on refresh

        // Fetch posted sets for all users
        const setResponse = await axios.get(createApiUrl(API_ENDPOINTS.SET_POSTED), getApiConfig(token));
        
        // Handle API response format - always expect array
        if (setResponse.data && setResponse.data.success !== false) {
          // New API format: { success: true, sets: [...] }
          const setsData = setResponse.data.sets || setResponse.data.data || setResponse.data;
          setSets(Array.isArray(setsData) ? setsData : []);
        } else {
          // Handle error response
          console.warn('[fetchUserAndSets] Sets API returned error:', setResponse.data?.error);
          setSets([]);
        }
      }
    } catch (err: any) {
      console.error('[fetchUserAndSets] Error:', err.message, err.stack);
      
      // Show user-friendly error message
      if (err.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again to continue.');
      } else if (err.response?.status === 404) {
        console.log('[fetchUserAndSets] No sets found - this is normal for new users');
        setSets([]);
      } else {
        Alert.alert('Connection Error', 'Unable to load sets. Please check your connection and try again.');
      }
      
      setUserName('User');
      setSets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Fetches all necessary data including saved sets
   */
  const fetchAllData = async (preserveCategory = false) => {
    await fetchUserAndSets(preserveCategory);
    await fetchSavedSets();
  };

  useEffect(() => {
    fetchAllData(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh data when screen comes into focus (e.g., after publishing a set)
  useFocusEffect(
    React.useCallback(() => {
      console.log('[Home] Screen focused, refreshing data...');
      // Use setTimeout to avoid scheduling updates during insertion
      const timeoutId = setTimeout(() => {
        fetchAllData(true); // Preserve category filter when refreshing
      }, 0);
      
      return () => clearTimeout(timeoutId);
    }, [])
  );

  useEffect(() => {
    let sorted = [...sets];
    // Sort by date_created descending
    sorted.sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime());
    let filtered = sorted;
    // Show all sets from the API (they should already be filtered to posted: true)
    // Additional safety check to ensure only posted sets are shown
    filtered = filtered.filter((s) => s.posted === true);
    if (subject) {
      filtered = filtered.filter((s) => 
        s.set_subject && s.set_subject.toLowerCase() === subject.toLowerCase()
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.set_name.toLowerCase().includes(q) ||
          (s.set_subject && s.set_subject.toLowerCase().includes(q)) ||
          getCreatorName(s).toLowerCase().includes(q)
      );
    }
    setFilteredSets(filtered);
  }, [sets, search, subject]);

  /**
   * Helper to get creator's full name from set object
   * @param {Object} item - The set object
   * @returns {string} The creator's name
   */
  const getCreatorName = (item) => {
    // If the set has a user object with full_name, use it
    if (item.user && item.user.full_name) return item.user.full_name;
    // If the set has a creator field, use it
    if (item.creator) return item.creator;
    // Fallback
    return 'Unknown';
  };

  /**
   * Determines the correct image source for profile display from the set's user data
   * @param {Object} user - The user object from the set
   * @returns {any} The image source for React Native Image component
   */
  const getProfileImageSource = (user) => {
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
   * Gets the learner count for a set
   * @param {Object} item - The set item object
   * @returns {number} The learner count
   */
  const getLearnerCount = (item) => {
    // Use the actual learner count from the API response
    return item.learnerCount || 0;
  };

  // Note: These functions are available for future features
  // const getProficiency = (setId) => {
  //   const proficiencies = [85, 92, 78, 95, 88, 73, 96, 82, 89, 91];
  //   return proficiencies[setId % proficiencies.length] || 0;
  // };

  // const getLastStudiedDate = (setId) => {
  //   const dates = ['Aug 3, 2025', 'Jul 31, 2025', 'Aug 1, 2025', 'Jul 30, 2025', 'Aug 2, 2025'];
  //   return dates[setId % dates.length];
  // };

  /**
   * Fetches saved sets from user-scoped AsyncStorage
   */
  const fetchSavedSets = async () => {
    try {
      const savedSets = await loadBackpackFromStorage();
      setSavedSets(savedSets);
    } catch (error) {
      console.error('[fetchSavedSets] Error:', error.message, error.stack);
      setSavedSets([]);
    }
  };

  /**
   * Saves a set to the backpack and updates learner count with user-scoped storage
   * @param {Object} setObj - The set object to save
   */
  const saveToBackpack = async (setObj) => {
    try {
      const savedSets = await loadBackpackFromStorage();
      
      // Check if already saved
      if (savedSets.some(s => s.set_id === setObj.set_id)) {
        Alert.alert('Already Saved', 'This set is already in your backpack!');
        return;
      }
      
      // Save locally first for immediate UI feedback
      const updatedSaved = [...savedSets, setObj];
      await saveBackpackToStorage(updatedSaved);
      setSavedSets(updatedSaved);
      
      try {
        // Call the API to save the set
        const result = await saveSet(setObj.set_id);
        
        if (result.success) {
          // Update the learner count in the sets array
          setSets(prevSets => prevSets.map(set => 
            set.set_id === setObj.set_id 
              ? { ...set, learnerCount: result.learnerCount || set.learnerCount }
              : set
          ));
          
          Alert.alert('Saved!', 'Set has been added to your backpack.');
        } else {
          throw new Error('API save failed');
        }
      } catch (apiError) {
        console.error('[saveToBackpack] API Error:', apiError.message);
        // Revert local changes if API fails
        await saveBackpackToStorage(savedSets);
        setSavedSets(savedSets);
        Alert.alert('Error', 'Failed to save set. Please try again.');
      }
    } catch (error) {
      console.error('[saveToBackpack] Error:', error.message, error.stack);
      Alert.alert('Error', 'Failed to save set to backpack.');
    }
  };

  /**
   * Removes a set from the backpack and updates learner count with user-scoped storage
   * @param {string} set_id - The ID of the set to remove
   */
  const removeFromBackpack = async (set_id) => {
    try {
      const savedSets = await loadBackpackFromStorage();
      
      // Remove locally first for immediate UI feedback
      const updatedSaved = savedSets.filter(s => s.set_id !== set_id);
      await saveBackpackToStorage(updatedSaved);
      setSavedSets(updatedSaved);
      
      try {
        // Call the API to unsave the set
        const result = await unsaveSet(set_id);
        
        if (result.success) {
          // Update the learner count in the sets array
          setSets(prevSets => prevSets.map(set => 
            set.set_id === set_id 
              ? { ...set, learnerCount: result.learnerCount || set.learnerCount }
              : set
          ));
          
          // No alert for removal - just silent removal for better UX
        } else {
          throw new Error('API unsave failed');
        }
      } catch (apiError) {
        console.error('[removeFromBackpack] API Error:', apiError.message);
        // Revert local changes if API fails
        await saveBackpackToStorage(savedSets);
        setSavedSets(savedSets);
        Alert.alert('Error', 'Failed to remove set. Please try again.');
      }
    } catch (error) {
      console.error('[removeFromBackpack] Error:', error.message, error.stack);
      Alert.alert('Error', 'Failed to remove set from backpack.');
    }
  };

  /**
   * Renders a modern set card matching the design from the reference image
   * @param {Object} item - The set object to render
   * @returns {JSX.Element} The rendered set card component
   */
  const renderSetBox = ({ item }) => {
    const categoryLabel = item.set_subject || 'General';
    const creatorName = getCreatorName(item);
    const learnerCount = getLearnerCount(item);
    const isSaved = savedSets.some(s => s.set_id === item.set_id);
    
    // Profile image is now properly loaded from API user.profile field

    return (
      <View style={styles.modernSetCard}>
        {/* Header with title, category, and bookmark */}
        <View style={styles.cardHeader}>
          <View style={styles.titleSection}>
            <Text style={styles.setTitle} numberOfLines={2}>
              {item.set_name}
            </Text>
            <Text style={styles.setCategory}>{categoryLabel}</Text>
          </View>
          <TouchableOpacity 
            style={styles.bookmarkButton}
            onPress={() => {
              if (isSaved) {
                removeFromBackpack(item.set_id);
              } else {
                saveToBackpack(item);
              }
            }}
            activeOpacity={0.7}
          >
            <Image 
              source={require('../../assets/icons/bookmark.png')} 
              style={[styles.bookmarkIcon, isSaved && styles.bookmarkIconSaved]} 
            />
          </TouchableOpacity>
        </View>

        {/* Divider line */}
        <View style={styles.divider} />

        {/* Stats section */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Image source={require('../../assets/icons/cards.png')} style={styles.statIcon} />
            <Text style={styles.statText}>{item.cards?.length || 0} cards</Text>
          </View>
          <View style={styles.statItem}>
            <Image source={require('../../assets/icons/learners.png')} style={styles.statIcon} />
            <Text style={styles.statText}>{learnerCount} learners</Text>
          </View>
          <View style={styles.statItem}>
            <Image source={require('../../assets/icons/clock.png')} style={styles.statIcon} />
            <Text style={styles.statText}>{formatDateCreated(item.date_created)}</Text>
          </View>
        </View>

        {/* Divider line */}
        <View style={styles.divider} />

        {/* Creator section */}
        <View style={styles.creatorSection}>
          <Image 
            source={getProfileImageSource(item.user)} 
            style={styles.creatorImage} 
          />
          <Text style={styles.creatorName}>{creatorName}</Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actionButtonsContainer}>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.viewButton}
              onPress={() => router.push({ 
                pathname: '/set/[setid]', 
                params: { setid: item.set_id } 
              })}
            >
              <Text style={styles.viewButtonText}>View Set</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quizButton}
              onPress={() => router.push({ 
                pathname: '/quiz/[setid]' as any, 
                params: { setid: item.set_id, setname: item.set_name } 
              })}
            >
              <Image source={require('../../assets/icons/study.png')} style={styles.buttonIcon} />
              <Text style={styles.quizButtonText}>Quiz</Text>
            </TouchableOpacity>
          </View>


        </View>
      </View>
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData(true);
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
          <Text style={styles.loadingText}>Loading sets...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Mainstream</Text>
            <Text style={styles.subtitle}>
              {userName ? `Hello ${userName}! Ready to learn something new?` : 'Ready to learn something new?'}
            </Text>
          </View>
        </View>
      </View>

      {/* Integrated Search and Filter Section */}
      <View style={styles.searchFilterSection}>
        {/* Search Bar with Filter */}
        <View style={styles.searchContainer}>
          <Image 
            source={require('../../assets/icons/search.png')} 
            style={styles.searchIcon}
            resizeMode="contain"
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilterDropdown(!showFilterDropdown)}
            activeOpacity={0.7}
          >
            <Image 
              source={require('../../assets/icons/filter.png')} 
              style={[styles.filterIcon, showFilterDropdown && styles.filterIconActive]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Filter Dropdown */}
        {showFilterDropdown && (
          <View style={styles.filterDropdown}>
            <ScrollView 
              style={styles.dropdownScrollView}
              showsVerticalScrollIndicator={false}
            >
              {SUBJECT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.dropdownItem,
                    subject === option.value && styles.dropdownItemActive
                  ]}
                  onPress={() => {
                    setSubject(option.value);
                    setShowFilterDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownText,
                    subject === option.value && styles.dropdownTextActive
                  ]}>
                    {option.label}
                  </Text>
                  {subject === option.value && (
                    <Text style={styles.checkMark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <FlatList
          data={filteredSets}
          renderItem={renderSetBox}
          keyExtractor={(item) => item.set_id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.setList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFFFFF"
              colors={['#FFFFFF']}
            />
          }
        />
      </View>
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
    paddingTop: 35,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginTop: 5,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },

  searchFilterSection: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    tintColor: '#6b7280',
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  filterIcon: {
    width: 20,
    height: 20,
    tintColor: '#6b7280',
  },
  filterIconActive: {
    tintColor: '#4f46e5',
  },
  currentFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  currentFilterLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginRight: 8,
  },
  currentFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  currentFilterText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    marginRight: 8,
  },
  clearFilterButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearFilterText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
    lineHeight: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  setList: {
    paddingBottom: 20,
  },

  // Modern Set Card Styles (Matching Reference Image)
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
    marginRight: 15,
  },
  setTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    lineHeight: 22,
  },
  setCategory: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  bookmarkButton: {
    padding: 8,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  bookmarkIcon: {
    width: 20,
    height: 20,
    tintColor: '#666',
  },
  bookmarkIconSaved: {
    tintColor: '#4CAF50',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
    tintColor: '#666',
  },
  statText: {
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
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    marginRight: 12,
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#4facfe',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  quizButton: {
    flex: 1,
    backgroundColor: '#43e97b',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  quizButtonText: {
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

  
  // Dropdown Styles
  filterDropdown: {
    position: 'absolute',
    top: 60,
    right: 20,
    left: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  dropdownScrollView: {
    maxHeight: 280,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  dropdownItemActive: {
    backgroundColor: '#f0f4ff',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  dropdownTextActive: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  checkMark: {
    fontSize: 18,
    color: '#4f46e5',
    fontWeight: 'bold',
  },
});

export default Home;