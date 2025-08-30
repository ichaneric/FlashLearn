// File: editprofile.tsx
// Description: Modern edit profile screen with enhanced UI/UX, camera icon for profile updates, and comprehensive avatar selection

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image, Alert, ScrollView, StatusBar, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { createApiUrl, API_ENDPOINTS, getApiConfig } from '../../config/api';
import { handleTextInputChange } from '../../utils/emojiPrevention';

const { width } = Dimensions.get('window');

const PROFILE_IMAGES = [
  '1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg',
  '6.jpg', '7.jpg', '8.jpg', '9.jpg', '10.jpg'
];

// Static mapping for profile images to avoid dynamic require issues
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

const EDUCATION_LEVELS = [
  { label: 'Elementary', value: 'elementary' },
  { label: 'Junior Highschool', value: 'junior_highschool' },
  { label: 'Senior Highschool', value: 'senior_highschool' },
  { label: 'College', value: 'college' },
];

const EditProfile = () => {
  const [user, setUser] = useState({ full_name: '', username: '', email: '', educational_level: '', profile: '1.jpg', profileImageUrl: null, profileUrl: null });
  const [editedUser, setEditedUser] = useState({ full_name: '', email: '', educational_level: '', profile: '1.jpg', password: '' });
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState('1.jpg');
  const [showPassword, setShowPassword] = useState(false);
  const [customImageUri, setCustomImageUri] = useState<string | null>(null);

  /**
   * Determines the correct image source for profile display
   */
  const getProfileImageSource = (profileName: string) => {
    console.log('[EditProfile] Profile image data:', {
      profileUrl: user.profileUrl,
      profileImageUrl: user.profileImageUrl,
      profile: user.profile,
      profileName,
      availableKeys: Object.keys(PROFILE_IMAGE_MAP)
    });

    // Use profileUrl if available (full URL for uploaded images)
    if (user.profileUrl) {
      console.log('[EditProfile] Using profileUrl:', user.profileUrl);
      return { uri: user.profileUrl };
    }
    
    // Use profileImageUrl from API if available
    if (user.profileImageUrl) {
      // Check if it's already a full URL
      if (user.profileImageUrl.startsWith('http://') || user.profileImageUrl.startsWith('https://')) {
        console.log('[EditProfile] Using full URL profileImageUrl:', user.profileImageUrl);
        return { uri: user.profileImageUrl };
      }
      
      // If it's a default avatar filename (1.jpg, 2.jpg, avatar_1.jpg, etc.), use the local asset
      if (PROFILE_IMAGE_MAP[user.profileImageUrl]) {
        console.log('[EditProfile] Using default avatar from local assets:', user.profileImageUrl);
        return PROFILE_IMAGE_MAP[user.profileImageUrl]; // Return local asset directly
      }
      
      // If it's just a filename, check if it's a custom uploaded image (not an avatar)
      if (user.profileImageUrl.includes('_') && !user.profileImageUrl.startsWith('avatar_')) {
        const uploadUrl = `${createApiUrl(API_ENDPOINTS.UPLOADS)}/${user.profileImageUrl}`;
        console.log('[EditProfile] Using upload URL:', uploadUrl);
        return { uri: uploadUrl };
      }
      
      // Fallback to default if profileImageUrl is invalid
      console.log('[EditProfile] Invalid profileImageUrl, using default');
      return PROFILE_IMAGE_MAP['1.jpg']; // Return local asset directly
    }
    
    // Fallback to old logic for backward compatibility
    if (!profileName) {
      console.log('[EditProfile] No profileName, using default');
      return PROFILE_IMAGE_MAP['1.jpg']; // Return local asset directly
    }
    
    // Check if it's a default avatar (1.jpg, 2.jpg, avatar_1.jpg, etc.)
    if (PROFILE_IMAGE_MAP[profileName]) {
      console.log('[EditProfile] Using legacy default avatar from local assets:', profileName);
      return PROFILE_IMAGE_MAP[profileName]; // Return local asset directly
    }
    
    // Check if it's a custom uploaded image (contains underscore pattern for username_email_timestamp)
    if (profileName.includes('_') && !profileName.startsWith('avatar_')) {
      const uploadUrl = `${createApiUrl(API_ENDPOINTS.UPLOADS)}/${profileName}`;
      console.log('[EditProfile] Using legacy upload URL:', uploadUrl);
      return { uri: uploadUrl };
    }
    
    // Fallback to default
    console.log('[EditProfile] Fallback to default avatar');
    return PROFILE_IMAGE_MAP['1.jpg']; // Return local asset directly
  };

  /**
   * Handles gallery image picker for profile photo
   */
  const handleGalleryPress = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Media library permission is required to select a profile photo.');
        return;
      }

      // Launch image picker from gallery
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setCustomImageUri(imageUri);
        // Generate a unique filename for the custom image
        const timestamp = Date.now();
        const customImageName = `custom_${timestamp}.jpg`;
        setSelectedProfile(customImageName);
        setEditedUser({ ...editedUser, profile: customImageName });
        
        console.log('[EditProfile] Gallery image selected:', imageUri);
      }
    } catch (error) {
      console.error('[handleGalleryPress] Error:', error);
      Alert.alert('Error', 'Failed to open gallery. Please try again.');
    }
  };

  /**
   * Handles profile image selection from avatar grid
   */
  const handleProfileImageSelect = (imageName: string) => {
    console.log('[EditProfile] Avatar selected:', imageName);
    setSelectedProfile(imageName);
    setEditedUser({ ...editedUser, profile: imageName });
    setCustomImageUri(null); // Clear custom image when selecting default avatar
  };

  /**
   * Gets the current profile image source for display
   */
  const getCurrentProfileImageSource = () => {
    // If we have a custom image URI, use it
    if (customImageUri) {
      return { uri: customImageUri };
    }
    
    // Otherwise use the selected profile
    return getProfileImageSource(selectedProfile);
  };

  /**
   * Fetches user data from the backend API
   * Retrieves current user profile information and sets it in state
   */
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const response = await axios.get(createApiUrl(API_ENDPOINTS.USER_DATA), getApiConfig(token));
          console.log('[EditProfile] API Response:', response.data);
          const { full_name, username, email, educationalLevel, profile, profileImageUrl, profileUrl } = response.data;
          const profileImage = profile || '1.jpg';
          console.log('[EditProfile] Profile data:', { profile, profileImage, profileImageUrl, profileUrl });
          setUser({ full_name, username, email, educational_level: educationalLevel, profile: profileImage, profileImageUrl, profileUrl });
          setEditedUser({ full_name, email, educational_level: educationalLevel, profile: profileImage, password: '' });
          setSelectedProfile(profileImage);
        }
      } catch (error) {
        console.error('[fetchUserData] Error:', error.message, error.stack);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  /**
   * Handles saving profile changes to the backend with image upload support
   * Uses FormData for multipart/form-data requests
   */
  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        return;
      }

             // Check if there are any changes
       const hasChanges = 
         editedUser.full_name !== user.full_name ||
         editedUser.educational_level !== user.educational_level ||
         selectedProfile !== user.profile ||
         (editedUser.password && editedUser.password.length > 0) ||
         customImageUri !== null;

      if (!hasChanges) {
        Alert.alert('No Changes', 'No fields have been modified.');
        return;
      }

      // Create FormData for multipart/form-data request
      const formData = new FormData();
      
             // Add text fields
       if (editedUser.full_name !== undefined) {
         formData.append('full_name', editedUser.full_name.trim() || user.full_name);
       }
       if (editedUser.educational_level !== undefined) {
         formData.append('educational_level', editedUser.educational_level || user.educational_level);
       }
       if (editedUser.password !== undefined && editedUser.password.length > 0) {
         formData.append('password', editedUser.password);
       }
       
       // Add profile selection (for avatar changes)
       if (selectedProfile) {
         formData.append('profile', selectedProfile);
       }

      // Add image file if selected
      if (customImageUri) {
        try {
          // For React Native, we need to create a file object that works with FormData
          const filename = customImageUri.split('/').pop() || 'image.jpg';
          
          // Get file info to check size
          const response = await fetch(customImageUri);
          const blob = await response.blob();
          
          // Check file size (25MB limit)
          const maxSize = 25 * 1024 * 1024; // 25MB in bytes
          if (blob.size > maxSize) {
            Alert.alert('File Too Large', 'Please select an image smaller than 25MB.');
            return;
          }
          
          const file = {
            uri: customImageUri,
            type: blob.type || 'image/jpeg',
            name: `profile_${Date.now()}.${blob.type.includes('png') ? 'png' : 'jpg'}`,
            size: blob.size,
          } as any;
          
          formData.append('profileImage', file);
          console.log('[EditProfile] Image added to FormData:', { 
            filename, 
            type: file.type, 
            uri: file.uri, 
            size: file.size 
          });
        } catch (imageError) {
          console.error('[EditProfile] Error processing image:', imageError);
          Alert.alert('Error', 'Failed to process selected image. Please try again.');
          return;
        }
      }

             console.log('[EditProfile] Sending FormData with fields:', {
         full_name: editedUser.full_name,
         educational_level: editedUser.educational_level,
         profile: selectedProfile,
         hasPassword: editedUser.password && editedUser.password.length > 0,
         hasImage: customImageUri !== null,
       });

      // Send FormData to new update-profile endpoint
      const response = await axios.put(
        createApiUrl(API_ENDPOINTS.UPDATE_PROFILE), 
        formData, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 second timeout for file uploads
        }
      );

      console.log('[EditProfile] Update response:', response.data);

             if (response.data.message) {
         Alert.alert('Success', response.data.message);
       } else {
         Alert.alert('Success', 'Profile updated successfully');
       }
       
       // Update local state with new profile data
       if (response.data.profileImageUrl) {
         setUser(prev => ({
           ...prev,
           profile: response.data.profile,
           profileImageUrl: response.data.profileImageUrl,
           profileUrl: response.data.profileUrl
         }));
         setSelectedProfile(response.data.profile);
       }
       
       // Navigate back to profile
       router.push('/(tabs)/profile');
    } catch (error: any) {
      console.error('[handleSave] Error:', error);
      
      let errorMessage = 'Failed to update profile';
      
      if (error.response) {
        // Server responded with error status
        const { status, data } = error.response;
        console.error('[handleSave] Server error:', { status, data });
        
        if (status === 400) {
          if (data.error && data.error.includes('25MB')) {
            errorMessage = 'File size must be less than 25MB. Please select a smaller image.';
          } else if (data.error && data.error.includes('JPG and PNG')) {
            errorMessage = 'Only JPG and PNG files are allowed.';
          } else {
            errorMessage = data.error || 'Invalid data provided';
          }
        } else if (status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (status === 409) {
          errorMessage = data.error || 'Email already exists';
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = data.error || `Server error (${status})`;
        }
      } else if (error.request) {
        // Network error
        console.error('[handleSave] Network error:', error.request);
        errorMessage = 'Network error. Please check your connection.';
      } else {
        // Other error
        console.error('[handleSave] Other error:', error.message);
        errorMessage = error.message || 'An unexpected error occurred';
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  // Cancel button handler
  const handleCancel = () => {
    router.push('/(tabs)/profile');
  };

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
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Profile Content */}
        <View style={styles.profileContent}>
          <Text style={styles.title}>Profile Information</Text>
          
                     {/* Profile Image Section */}
           <View style={styles.profileImageSection}>
             <View style={styles.profileImageContainer}>
               <Image 
                 source={getCurrentProfileImageSource()} 
                 style={styles.profileImage}
                 defaultSource={PROFILE_IMAGE_MAP['1.jpg']}
               />
                               <TouchableOpacity style={styles.cameraButton} onPress={handleGalleryPress}>
                 <LinearGradient
                   colors={['#4facfe', '#00f2fe']}
                   style={styles.cameraButtonGradient}
                 >
                                       <Ionicons name="images" size={20} color="#ffffff" />
                 </LinearGradient>
               </TouchableOpacity>
             </View>
                           <Text style={styles.profileImageLabel}>Tap gallery icon to select photo or choose avatar below</Text>
           </View>

           {/* Horizontal Avatar Selector */}
           <View style={styles.avatarSelectorSection}>
             <Text style={styles.avatarSelectorTitle}>Choose Avatar</Text>
             <ScrollView 
               horizontal 
               showsHorizontalScrollIndicator={false}
               contentContainerStyle={styles.avatarScrollContainer}
             >
               {PROFILE_IMAGES.map((img) => (
                 <TouchableOpacity 
                   key={img} 
                   style={styles.avatarOption}
                   onPress={() => handleProfileImageSelect(img)}
                 >
                   <Image
                     source={PROFILE_IMAGE_MAP[img]}
                     style={[
                       styles.avatarImage,
                       selectedProfile === img && styles.selectedAvatarImage
                     ]}
                   />
                   {selectedProfile === img && (
                     <View style={styles.selectedAvatarCheck}>
                       <Ionicons name="checkmark-circle" size={20} color="#4facfe" />
                     </View>
                   )}
                 </TouchableOpacity>
               ))}
             </ScrollView>
           </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
                         {/* Full Name Input */}
             <View style={styles.inputContainer}>
               <Ionicons name="person" size={20} color="#666666" style={styles.inputIcon} />
               <TextInput
                 style={styles.input}
                 value={editedUser.full_name}
                 onChangeText={(text) => handleTextInputChange(
                   text, 
                   (cleanedText) => setEditedUser({ ...editedUser, full_name: cleanedText }),
                   () => Alert.alert('Invalid Input', 'Emojis are not allowed in names.')
                 )}
                 placeholder="Full Name"
                 placeholderTextColor="#999999"
                 autoCapitalize="words"
               />
             </View>

             

            {/* Educational Level Dropdown */}
            <View style={styles.inputContainer}>
              <Ionicons name="school" size={20} color="#666666" style={styles.inputIcon} />
              <View style={styles.dropdownContainer}>
                <Picker
                  selectedValue={editedUser.educational_level}
                  onValueChange={(value) => setEditedUser({ ...editedUser, educational_level: value })}
                  style={styles.picker}
                >
                  {EDUCATION_LEVELS.map((level) => (
                    <Picker.Item key={level.value} label={level.label} value={level.value} />
                  ))}
                </Picker>
              </View>
            </View>

                         {/* Password Section */}
             <Text style={styles.sectionTitle}>Security</Text>
             <View style={styles.inputContainer}>
               <Ionicons name="lock-closed" size={20} color="#666666" style={styles.inputIcon} />
               <TextInput
                 style={styles.input}
                 value={editedUser.password}
                 onChangeText={(text) => handleTextInputChange(
                   text, 
                   (cleanedText) => setEditedUser({ ...editedUser, password: cleanedText }),
                   () => Alert.alert('Invalid Input', 'Emojis are not allowed in passwords.')
                 )}
                 placeholder="New Password (leave blank to keep current)"
                 placeholderTextColor="#999999"
                 secureTextEntry={!showPassword}
                 autoCapitalize="none"
                 autoCorrect={false}
               />
               <TouchableOpacity 
                 style={styles.passwordToggle}
                 onPress={() => setShowPassword(!showPassword)}
               >
                 <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#666666" />
               </TouchableOpacity>
             </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonSection}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <LinearGradient
                colors={['#4facfe', '#00f2fe']}
                style={styles.saveButtonGradient}
              >
                <Ionicons name="checkmark" size={20} color="#ffffff" />
                <Text style={styles.saveText}>Save Changes</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  profileContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 24,
  },
  profileImageSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#4facfe',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cameraButtonGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageLabel: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  avatarSelectorSection: {
    marginBottom: 24,
  },
  avatarSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  avatarScrollContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  avatarSelectorModal: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 15,
  },
  avatarSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  avatarOption: {
    position: 'relative',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedAvatarImage: {
    borderColor: '#4facfe',
  },
  selectedAvatarCheck: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e1e5e9',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333333',
  },
  passwordToggle: {
    padding: 8,
  },
  dropdownContainer: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
  },
  picker: {
    flex: 1,
  },
  buttonSection: {
    gap: 12,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#4facfe',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  saveText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#666666',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  cancelText: {
    color: '#666666',
    fontWeight: '600',
    fontSize: 16,
  },
});