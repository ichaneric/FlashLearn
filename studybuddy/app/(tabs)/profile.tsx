  // File: profile.tsx
  // Description: Modern profile screen with comprehensive user information, statistics, and professional UI/UX.

  import React, { useState, useEffect } from 'react';
  import { 
    StyleSheet, 
    Text, 
    View, 
    Image, 
    TouchableOpacity, 
    Alert, 
    RefreshControl, 
    ScrollView, 
    StatusBar,
    Dimensions,
    Linking,
    Modal,
    Animated
  } from 'react-native';
  import { router, useFocusEffect } from 'expo-router';
  import axios from 'axios';
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import { LinearGradient } from 'expo-linear-gradient';
  import { useAuth } from '../../contexts/AuthContext';
  import { createApiUrl, API_ENDPOINTS, getApiConfig } from '../../config/api';
import { getUserStats, UserStats } from '../../services/userService';
import { loadQuizRecords } from '../../utils/quizStorage';

  const { width } = Dimensions.get('window');

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
    // Also support the avatar_ naming convention from signup
    'avatar_1.jpg': require('../../assets/images/1.jpg'),
    'avatar_2.jpg': require('../../assets/images/2.jpg'),
    'avatar_3.jpg': require('../../assets/images/3.jpg'),
    'avatar_4.jpg': require('../../assets/images/4.jpg'),
    'avatar_5.jpg': require('../../assets/images/5.jpg'),
    'avatar_6.jpg': require('../../assets/images/6.jpg'),
    'avatar_7.jpg': require('../../assets/images/7.jpg'),
    'avatar_8.jpg': require('../../assets/images/8.jpg'),
    'avatar_9.jpg': require('../../assets/images/9.jpg'),
    'avatar_10.jpg': require('../../assets/images/10.jpg'),
    'avatar_11.jpg': require('../../assets/images/1.jpg'), // Fallback to 1.jpg for 11-15
    'avatar_12.jpg': require('../../assets/images/2.jpg'),
    'avatar_13.jpg': require('../../assets/images/3.jpg'),
    'avatar_14.jpg': require('../../assets/images/4.jpg'),
    'avatar_15.jpg': require('../../assets/images/5.jpg'),
  };

  // Import icons from assets
  const ICONS = {
    help: require('../../assets/icons/help.png'),
    about: require('../../assets/icons/about.png'),
    privacy: require('../../assets/icons/privacy.png'),
    terms: require('../../assets/icons/termsandconditions.png'),
    email: require('../../assets/icons/email.png'),
    settings: require('../../assets/icons/settings.png'),
    logout: require('../../assets/icons/delete.png'),
    edit: require('../../assets/icons/settings.png'),
    quiz: require('../../assets/icons/type.png'),
    sets: require('../../assets/icons/sets.png'),
  };

  const Profile = () => {
    const [user, setUser] = useState({ 
      full_name: '', 
      username: '', 
      email: '', 
      educational_level: '', 
      sets_count: 0, 
      profile: '1.jpg',
      profileImageUrl: null as string | null,
      profileUrl: null as string | null,
      user_id: '',
      isAdmin: false
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<UserStats>({
      quizzesTakenToday: 0,
      setsCreatedToday: 0
    });
    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0));
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [logoutFadeAnim] = useState(new Animated.Value(0));
    const [totalQuizzesTaken, setTotalQuizzesTaken] = useState(0);

    const { logout } = useAuth();

    /**
     * Counts total quizzes taken from AsyncStorage with user-scoped storage
     */
    const countTotalQuizzes = async () => {
      try {
        const records = await loadQuizRecords();
        setTotalQuizzesTaken(records.length);
      } catch (error) {
        console.error('[countTotalQuizzes] Error:', error);
        setTotalQuizzesTaken(0);
      }
    };

    /**
     * Shows the profile options modal with animation
     */
    const showOptionsModalWithAnimation = () => {
      setShowOptionsModal(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    };

    /**
     * Hides the profile options modal with animation
     */
    const hideOptionsModalWithAnimation = () => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowOptionsModal(false);
      });
    };

    /**
     * Shows the logout confirmation modal with animation
     */
    const showLogoutModalWithAnimation = () => {
      setShowLogoutModal(true);
      Animated.timing(logoutFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    };

    /**
     * Hides the logout confirmation modal with animation
     */
    const hideLogoutModalWithAnimation = () => {
      Animated.timing(logoutFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowLogoutModal(false);
      });
    };

    /**
     * Fetches user data from the backend API
     */
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          router.replace('/auth/login');
          return;
        }

        const response = await axios.get(createApiUrl(API_ENDPOINTS.USER_DATA), getApiConfig(token));

        console.log('[Profile] API Response:', response.data);

        const { 
          id,
          full_name, 
          username, 
          email, 
          educationalLevel, 
          sets_count, 
          profile, 
          profileImageUrl,
          profileUrl,
          isAdmin 
        } = response.data;

        setUser({ 
          full_name: full_name || 'No Name', 
          username: username || 'No Username', 
          email: email || 'No Email', 
          educational_level: educationalLevel || 'Not Set', 
          sets_count: sets_count || 0, 
          profile: profile || '1.jpg',
          profileImageUrl: profileImageUrl || null,
          profileUrl: profileUrl || null,
          user_id: id || '',
          isAdmin: isAdmin || false
        });

        // Fetch additional stats after user data is set
        if (id) {
          await fetchUserStats(token, id);
        }

        // Count total quizzes from AsyncStorage
        await countTotalQuizzes();
      } catch (error) {
        console.error('[fetchUserData] Error:', error);
        Alert.alert('Error', 'Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    /**
     * Fetches user statistics and analytics
     * @param token - Authentication token
     * @param userId - User ID for stats fetching
     */
    const fetchUserStats = async (token: string, userId: string) => {
      try {
        const userStats = await getUserStats(userId, token);
        setStats(userStats);
      } catch (error) {
        console.error('[fetchUserStats] Error:', error);
        // Silently handle stats errors and set defaults
        setStats({
          quizzesTakenToday: 0,
          setsCreatedToday: user.sets_count || 0 // Use total sets count as fallback
        });
      }
    };

    useEffect(() => {
      fetchUserData();
    }, []);

    /**
     * Refresh user data when screen comes into focus (e.g., returning from edit profile)
     */
    useFocusEffect(
      React.useCallback(() => {
        // Use setTimeout to avoid scheduling updates during insertion
        const timeoutId = setTimeout(() => {
          refreshUserData();
        }, 0);
        
        return () => clearTimeout(timeoutId);
      }, [])
    );

    /**
     * Handles pull-to-refresh functionality
     */
    const onRefresh = () => {
      setRefreshing(true);
      fetchUserData();
    };

    /**
     * Determines the correct image source for profile display
     */
    const getProfileImageSource = () => {
      console.log('[Profile] Profile image data:', {
        profileUrl: user.profileUrl,
        profileImageUrl: user.profileImageUrl,
        profile: user.profile,
        availableKeys: Object.keys(PROFILE_IMAGE_MAP)
      });

      // Use profileUrl if available (full URL for uploaded images)
      if (user.profileUrl) {
        console.log('[Profile] Using profileUrl:', user.profileUrl);
        return { uri: user.profileUrl };
      }
      
      // Use profileImageUrl from API if available
      if (user.profileImageUrl) {
        console.log('[Profile] Processing profileImageUrl:', user.profileImageUrl);
        
        // Check if it's already a full URL (Supabase Storage URL)
        if (user.profileImageUrl.startsWith('http://') || user.profileImageUrl.startsWith('https://')) {
          console.log('[Profile] Using full URL profileImageUrl:', user.profileImageUrl);
          return { uri: user.profileImageUrl };
        }
        
        // Check if it's in our local asset mapping (avatar images)
        if (PROFILE_IMAGE_MAP[user.profileImageUrl]) {
          console.log('[Profile] Found in PROFILE_IMAGE_MAP, using local asset:', user.profileImageUrl);
          return PROFILE_IMAGE_MAP[user.profileImageUrl]; // Return local asset directly
        }
        
        // If it's just a filename, check if it's a custom uploaded image (not an avatar)
        if (user.profileImageUrl.includes('_') && !user.profileImageUrl.startsWith('avatar_')) {
          // This should be a Supabase Storage URL, but if it's just a filename, construct the URL
          const supabaseUrl = `https://ssppxsbrphszkvgajcwq.supabase.co/storage/v1/object/public/profile-images/${user.profileImageUrl}`;
          console.log('[Profile] Using Supabase URL for custom image:', supabaseUrl);
          return { uri: supabaseUrl };
        }
        
        // Fallback to default if profileImageUrl is invalid
        console.log('[Profile] Invalid profileImageUrl, using default. profileImageUrl was:', user.profileImageUrl);
        return PROFILE_IMAGE_MAP['1.jpg'];
      }
      
      // Fallback to old logic for backward compatibility
      if (!user.profile) {
        console.log('[Profile] No profile data, using default');
        return PROFILE_IMAGE_MAP['1.jpg'];
      }
      
      // Check if it's a default avatar (avatar_1.jpg to avatar_10.jpg or 1.jpg to 10.jpg)
      if (PROFILE_IMAGE_MAP[user.profile]) {
        console.log('[Profile] Using legacy default avatar from local assets:', user.profile);
        return PROFILE_IMAGE_MAP[user.profile]; // Return local asset directly
      }
      
      // Check if it's a custom uploaded image (contains underscore pattern for username_email_timestamp)
      if (user.profile.includes('_') && !user.profile.startsWith('avatar_')) {
        // This should be a Supabase Storage URL, but if it's just a filename, construct the URL
        const supabaseUrl = `https://ssppxsbrphszkvgajcwq.supabase.co/storage/v1/object/public/profile-images/${user.profile}`;
        console.log('[Profile] Using legacy Supabase URL for custom image:', supabaseUrl);
        return { uri: supabaseUrl };
      }
      
      // Final fallback
      console.log('[Profile] Final fallback to default avatar');
      return PROFILE_IMAGE_MAP['1.jpg'];
    };

    /**
     * Navigate to edit profile screen
     */
    const handleEditProfile = () => {
      hideOptionsModalWithAnimation();
      router.push('/user/editprofile');
    };

    /**
     * Refresh user data when returning to profile screen
     */
    const refreshUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const response = await axios.get(createApiUrl(API_ENDPOINTS.USER_DATA), getApiConfig(token));
          const { full_name, username, email, educationalLevel, profile, profileImageUrl, profileUrl, sets_count, isAdmin } = response.data;
          const profileImage = profile || '1.jpg';
          console.log('[Profile] Refreshed profile data:', { profile, profileImage, profileImageUrl, profileUrl });
          setUser({ 
            full_name, 
            username, 
            email, 
            educational_level: educationalLevel, 
            profile: profileImage, 
            profileImageUrl, 
            profileUrl,
            sets_count: sets_count || 0,
            user_id: response.data.id,
            isAdmin: isAdmin || false
          });
        }
      } catch (error) {
        console.error('[refreshUserData] Error:', error.message, error.stack);
      }
    };

    /**
     * Handle overflow menu with custom modal
     */
    const handleOverflowMenu = () => {
      showOptionsModalWithAnimation();
    };

    /**
     * Navigate to help and support
     */
    const handleHelp = () => {
      Alert.alert('Help & Support', 'Contact us at support@flashlearn.com');
    };

    /**
     * Navigate to about screen
     */
    const handleAbout = () => {
              Alert.alert('About FlashLearn', 'Version 1.0.0\n\nFlashLearn is your intelligent study companion.');
    };

    /**
     * Handles user logout with enhanced confirmation modal
     */
    const handleLogout = () => {
      hideOptionsModalWithAnimation();
      showLogoutModalWithAnimation();
    };

    /**
     * Confirms and executes logout
     */
    const confirmLogout = async () => {
      try {
        hideLogoutModalWithAnimation();
        await logout();
        // Navigate to landing page after logout
        router.replace('/');
      } catch (error) {
        console.error('[Profile] Logout error:', error);
        Alert.alert('Error', 'Failed to log out. Please try again.');
      }
    };

    /**
     * Renders a statistics card with proper icons
     */
    const renderStatCard = (title, value, iconSource, color) => (
      <View style={[styles.statCard, { borderLeftColor: color }]}>
        <Image source={iconSource} style={styles.statIcon} />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    );

    /**
     * Renders a menu item with enhanced styling and proper icons
     */
    const renderMenuItem = (title, subtitle, iconSource, onPress, showArrow = true, isDestructive = false) => (
      <TouchableOpacity 
        style={[styles.menuItem, isDestructive && styles.menuItemDestructive]} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.menuItemLeft}>
          <Image source={iconSource} style={[styles.menuIcon, isDestructive && styles.menuIconDestructive]} />
          <View style={styles.menuTextContainer}>
            <Text style={[styles.menuTitle, isDestructive && styles.menuTitleDestructive]}>{title}</Text>
            {subtitle && <Text style={[styles.menuSubtitle, isDestructive && styles.menuSubtitleDestructive]}>{subtitle}</Text>}
          </View>
        </View>
        {showArrow && <Text style={[styles.menuArrow, isDestructive && styles.menuArrowDestructive]}>›</Text>}
      </TouchableOpacity>
    );

    /**
     * Renders a modern option button for the profile options modal
     */
    const renderOptionButton = (title, iconSource, onPress, isDestructive = false) => (
      <TouchableOpacity 
        style={[styles.optionButton, isDestructive && styles.optionButtonDestructive]} 
        onPress={onPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={isDestructive ? ['#ff6b6b', '#ee5a52'] : ['#4facfe', '#00f2fe']}
          style={styles.optionButtonGradient}
        >
          <Image source={iconSource} style={styles.optionButtonIcon} />
          <Text style={styles.optionButtonText}>{title}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );

    /**
     * Renders a modern confirmation button for the logout modal
     */
    const renderConfirmationButton = (title, onPress, isDestructive = false) => (
      <TouchableOpacity 
        style={[styles.confirmationButton, isDestructive && styles.confirmationButtonDestructive]} 
        onPress={onPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={isDestructive ? ['#ff6b6b', '#ee5a52'] : ['#6c757d', '#495057']}
          style={styles.confirmationButtonGradient}
        >
          <Text style={styles.confirmationButtonText}>{title}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.loadingGradient}
          >
            <Text style={styles.loadingText}>Loading Profile...</Text>
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
        
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity style={styles.overflowButton} onPress={handleOverflowMenu}>
              <Text style={styles.overflowIcon}>⋮</Text>
            </TouchableOpacity>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileImageContainer}>
              <Image 
                source={getProfileImageSource()} 
                style={styles.profileImage}
                defaultSource={PROFILE_IMAGE_MAP['1.jpg']}
                onError={(error) => {
                  console.error('[Profile] Image loading error:', error.nativeEvent);
                  // Fallback to default avatar when image fails to load
                  console.log('[Profile] Falling back to default avatar due to loading error');
                }}
                onLoad={() => {
                  console.log('[Profile] Image loaded successfully');
                }}
              />
              {user.isAdmin && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminText}>ADMIN</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.fullName}>{user.full_name}</Text>
            <Text style={styles.username}>@{user.username}</Text>
            <Text style={styles.educationLevel}>{user.educational_level}</Text>
          </View>

          {/* Statistics Section */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Activity Overview</Text>
            <View style={styles.statsGrid}>
              {renderStatCard('Quizzes Taken', totalQuizzesTaken, ICONS.quiz, '#4facfe')}
              {renderStatCard('Total Sets Created', user.sets_count, ICONS.sets, '#00f2fe')}
            </View>
          </View>

          {/* Menu Section */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Account & Settings</Text>
            
            <View style={styles.menuContainer}>
              {renderMenuItem('Email', user.email, ICONS.email, () => {}, false)}
              {user.isAdmin && (
                <TouchableOpacity
                  style={styles.adminButton}
                  onPress={() => router.push('/admin/dashboard')}
                >
                  <LinearGradient
                    colors={['#ff6b6b', '#ee5a52']}
                    style={styles.adminButtonGradient}
                  >
                    <Text style={styles.adminButtonText}>🔧 Admin Dashboard</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              {renderMenuItem('Help & Support', 'Get help and contact us', ICONS.help, handleHelp)}
              {renderMenuItem('About FlashLearn', 'Version and information', ICONS.about, handleAbout)}
              {renderMenuItem('Privacy Policy & Terms', 'Read our privacy policy and terms', ICONS.privacy, () => {
                router.push('/flashlearn/legal');
              })}
            </View>
          </View>
        </ScrollView>

        {/* Profile Options Modal */}
        <Modal
          visible={showOptionsModal}
          transparent={true}
          animationType="none"
          onRequestClose={hideOptionsModalWithAnimation}
        >
          <Animated.View 
            style={[
              styles.modalOverlay,
              { opacity: fadeAnim }
            ]}
          >
            <TouchableOpacity 
              style={styles.modalBackground} 
              onPress={hideOptionsModalWithAnimation}
              activeOpacity={1}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Profile Options</Text>
                  <TouchableOpacity onPress={hideOptionsModalWithAnimation}>
                    <Text style={styles.modalCloseButton}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalButtons}>
                  <View style={styles.modalButtonRow}>
                    {renderOptionButton('Edit Profile', ICONS.edit, handleEditProfile)}
                    {renderOptionButton('Log Out', ICONS.logout, handleLogout, true)}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </Modal>

        {/* Logout Confirmation Modal */}
        <Modal
          visible={showLogoutModal}
          transparent={true}
          animationType="none"
          onRequestClose={hideLogoutModalWithAnimation}
        >
          <Animated.View 
            style={[
              styles.modalOverlay,
              { opacity: logoutFadeAnim }
            ]}
          >
            <TouchableOpacity 
              style={styles.modalBackground} 
              onPress={hideLogoutModalWithAnimation}
              activeOpacity={1}
            >
              <View style={styles.logoutModalContent}>
                <View style={styles.logoutModalHeader}>
                  <Image source={ICONS.logout} style={styles.logoutModalIcon} />
                  <Text style={styles.logoutModalTitle}>Confirm Logout</Text>
                </View>
                
                <Text style={styles.logoutModalMessage}>
                  Are you sure you want to log out? You&apos;ll need to sign in again to access your account.
                </Text>
                
                <View style={styles.logoutModalButtons}>
                  <View style={styles.buttonRow}>
                    {renderConfirmationButton('Cancel', hideLogoutModalWithAnimation)}
                    {renderConfirmationButton('Log Out', confirmLogout, true)}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </Modal>
      </View>
    );
  };

  export default Profile;

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
    },
    loadingGradient: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 18,
      color: '#ffffff',
      fontWeight: '600',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    overflowButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    overflowIcon: {
      fontSize: 24,
      color: '#ffffff',
      fontWeight: 'bold',
    },
    profileCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      marginHorizontal: 20,
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 10,
    },
    profileImageContainer: {
      position: 'relative',
      marginBottom: 16,
    },
    profileImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 4,
      borderColor: '#ffffff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    adminBadge: {
      position: 'absolute',
      top: -5,
      right: -5,
      backgroundColor: '#ff6b6b',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    adminText: {
      color: '#ffffff',
      fontSize: 10,
      fontWeight: 'bold',
    },
    fullName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#333333',
      marginBottom: 4,
    },
    username: {
      fontSize: 16,
      color: '#666666',
      marginBottom: 8,
    },
    educationLevel: {
      fontSize: 14,
      color: '#888888',
      marginBottom: 20,
      textTransform: 'capitalize',
    },
    editProfileButton: {
      borderRadius: 25,
      overflow: 'hidden',
      shadowColor: '#4facfe',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    editButtonGradient: {
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    editButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    statsSection: {
      marginTop: 24,
      paddingHorizontal: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 16,
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    statCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      flex: 1,
      padding: 20,
      borderRadius: 16,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderLeftWidth: 4,
    },
    statIcon: {
      width: 32,
      height: 32,
      marginBottom: 12,
      resizeMode: 'contain',
    },
    statValue: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#333333',
      marginBottom: 8,
    },
    statTitle: {
      fontSize: 14,
      color: '#666666',
      fontWeight: '500',
      textAlign: 'center',
    },
    menuSection: {
      marginTop: 24,
      paddingHorizontal: 20,
    },
    menuContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    menuItemDestructive: {
      backgroundColor: 'rgba(255, 107, 107, 0.05)',
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    menuIcon: {
      width: 24,
      height: 24,
      marginRight: 16,
      resizeMode: 'contain',
    },
    menuIconDestructive: {
      tintColor: '#ff6b6b',
    },
    menuTextContainer: {
      flex: 1,
    },
    menuTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333333',
    },
    menuTitleDestructive: {
      color: '#ff6b6b',
    },
    menuSubtitle: {
      fontSize: 14,
      color: '#666666',
      marginTop: 2,
    },
    menuSubtitleDestructive: {
      color: '#ff8a8a',
    },
    menuArrow: {
      fontSize: 18,
      color: '#cccccc',
      fontWeight: 'bold',
    },
    menuArrowDestructive: {
      color: '#ff6b6b',
    },
    logoutSection: {
      marginTop: 32,
      paddingHorizontal: 20,
    },
    logoutButton: {
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#ff6b6b',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    logoutButtonGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 24,
    },
    logoutIcon: {
      width: 20,
      height: 20,
      marginRight: 8,
      tintColor: '#ffffff',
    },
    logoutText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalBackground: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: '#ffffff',
      borderRadius: 20,
      width: '80%',
      maxWidth: 320,
      padding: 24,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 15,
      elevation: 15,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#333333',
    },
    modalCloseButton: {
      fontSize: 20,
      color: '#666666',
      width: 30,
      height: 30,
      textAlign: 'center',
      lineHeight: 30,
    },
    modalButtons: {
      width: '100%',
    },
    modalButtonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    optionButton: {
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: '#4facfe',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    optionButtonDestructive: {
      shadowColor: '#ff6b6b',
    },
    optionButtonGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 20,
    },
    optionButtonIcon: {
      width: 20,
      height: 20,
      marginRight: 10,
      tintColor: '#ffffff',
    },
    optionButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#ffffff',
    },
    cancelButton: {
      backgroundColor: '#f8f9fa',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#e9ecef',
      shadowColor: '#666666',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    cancelButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#666666',
      textAlign: 'center',
      paddingVertical: 14,
      paddingHorizontal: 20,
    },
    confirmationButton: {
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: '#666666',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    confirmationButtonDestructive: {
      shadowColor: '#ff6b6b',
    },
    confirmationButtonGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 20,
    },
    confirmationButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#ffffff',
    },
    logoutModalContent: {
      backgroundColor: '#ffffff',
      borderRadius: 20,
      width: '80%',
      maxWidth: 320,
      padding: 24,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 15,
      elevation: 15,
    },
    logoutModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    logoutModalIcon: {
      width: 30,
      height: 30,
      marginRight: 10,
      tintColor: '#ff6b6b',
    },
    logoutModalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#333333',
    },
    logoutModalMessage: {
      fontSize: 15,
      color: '#666666',
      textAlign: 'center',
      marginBottom: 24,
    },
    logoutModalButtons: {
      width: '100%',
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    adminButton: {
      marginBottom: 15,
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    adminButtonGradient: {
      paddingVertical: 15,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    adminButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });