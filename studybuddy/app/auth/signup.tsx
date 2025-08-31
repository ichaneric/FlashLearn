// File: signup.tsx
// Description: Handles user registration with profile image upload and avatar selection functionality.

import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, StatusBar, ScrollView, Image, Modal } from 'react-native';
import React, { useState } from 'react';
import axios from 'axios';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { createApiUrl, API_ENDPOINTS, getApiConfig, getFormDataConfig } from '../../config/api';
import { handleTextInputChange } from '../../utils/emojiPrevention';

const Signup = () => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [educationalLevel, setEducationalLevel] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('avatar_1.jpg');
  const [customImage, setCustomImage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showEducationalDropdown, setShowEducationalDropdown] = useState(false);
  const { login } = useAuth();

  const avatars = [
    'avatar_1.jpg', 'avatar_2.jpg', 'avatar_3.jpg', 'avatar_4.jpg', 'avatar_5.jpg',
    'avatar_6.jpg', 'avatar_7.jpg', 'avatar_8.jpg', 'avatar_9.jpg', 'avatar_10.jpg',
    'avatar_11.jpg', 'avatar_12.jpg', 'avatar_13.jpg', 'avatar_14.jpg', 'avatar_15.jpg'
  ];

  const educationalLevels = [
    { label: 'Elementary', value: 'elementary' },
    { label: 'Junior High School', value: 'junior_highschool' },
    { label: 'Senior High School', value: 'senior_highschool' },
    { label: 'College', value: 'college' },
    { label: 'Graduate School', value: 'graduate' },
  ];

  /**
   * Maps avatar names to their corresponding image sources
   * @param {string} avatarName - The name of the avatar file
   * @returns {any} The image source for the avatar
   */
  const getAvatarSource = (avatarName) => {
    const avatarMap = {
      'avatar_1.jpg': require('../../assets/avatars/avatar_1.jpg'),
      'avatar_2.jpg': require('../../assets/avatars/avatar_2.jpg'),
      'avatar_3.jpg': require('../../assets/avatars/avatar_3.jpg'),
      'avatar_4.jpg': require('../../assets/avatars/avatar_4.jpg'),
      'avatar_5.jpg': require('../../assets/avatars/avatar_5.jpg'),
      'avatar_6.jpg': require('../../assets/avatars/avatar_6.jpg'),
      'avatar_7.jpg': require('../../assets/avatars/avatar_7.jpg'),
      'avatar_8.jpg': require('../../assets/avatars/avatar_8.jpg'),
      'avatar_9.jpg': require('../../assets/avatars/avatar_9.jpg'),
      'avatar_10.jpg': require('../../assets/avatars/avatar_10.jpg'),
      'avatar_11.jpg': require('../../assets/avatars/avatar_11.jpg'),
      'avatar_12.jpg': require('../../assets/avatars/avatar_12.jpg'),
      'avatar_13.jpg': require('../../assets/avatars/avatar_13.jpg'),
      'avatar_14.jpg': require('../../assets/avatars/avatar_14.jpg'),
      'avatar_15.jpg': require('../../assets/avatars/avatar_15.jpg'),
    };
    return avatarMap[avatarName] || avatarMap['avatar_1.jpg'];
  };

  /**
   * Gets the display label for the selected educational level
   * @returns {string} The display label or placeholder text
   */
  const getEducationalLevelLabel = () => {
    const selected = educationalLevels.find(level => level.value === educationalLevel);
    return selected ? selected.label : 'Choose Educational Level';
  };

  /**
   * Opens image picker to select a custom profile image
   * Handles permissions and image selection
   */
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to select a custom image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCustomImage(result.assets[0].uri);
        setSelectedAvatar(null);
      }
      } catch (pickError) {
    console.error('[pickImage] Error:', pickError.message, pickError.stack);
    Alert.alert('Error', 'Failed to pick image. Please try again.');
  }
  };

  /**
   * Handles user registration with profile image upload
   * Supports both custom image upload (FormData) and avatar selection (JSON)
   */
  const handleSignup = async () => {
    if (!username || !email || !password || !confirmPassword || !fullName || !educationalLevel) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const apiUrl = createApiUrl(API_ENDPOINTS.SIGNUP);

      // Debug logging
      console.log('[SIGNUP] API URL:', apiUrl);
      console.log('[SIGNUP] Using custom image:', !!customImage);
      console.log('[SIGNUP] Selected avatar:', selectedAvatar);
      
      // Temporary debug alert
      Alert.alert('Debug Info', `API URL: ${apiUrl}\nUsing custom image: ${!!customImage}\nSelected avatar: ${selectedAvatar}`);

      let response;

      if (customImage) {
        // Use FormData for custom image upload
        
        const formData = new FormData();
        
        // Add text fields
        formData.append('username', username);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('full_name', fullName);
        formData.append('educational_level', educationalLevel);
        
        // Add image file
        try {
          // Convert URI to blob
          const imageResponse = await fetch(customImage);
          const blob = await imageResponse.blob();
          
          // Generate filename with naming convention: {username}_{timestamp}{extension}
          const timestamp = Date.now();
          const extension = customImage.split('.').pop() || 'jpg';
          const filename = `${username}_${timestamp}.${extension}`;
          
          // Create file object
          const file = new File([blob], filename, { type: blob.type });
          
          formData.append('profileImage', file);
        } catch (imageError) {
          Alert.alert('Error', 'Failed to process selected image. Please try again.');
          setLoading(false);
          return;
        }

        // Send FormData
        response = await axios.post(apiUrl, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 second timeout for file uploads
        });
      } else {
        // Use JSON for avatar selection
        
        const jsonData = {
          username,
          email,
          password,
          full_name: fullName,
          educational_level: educationalLevel,
          profile_image: selectedAvatar,
        };
        
        response = await axios.post(apiUrl, jsonData, getApiConfig());
      }

      if (response.data.success) {
        // Show success modal with better UX
        Alert.alert(
          '✅ Account Created Successfully!',
          'Your account has been created. You will be redirected to login in 2 seconds.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Show loading state
                setLoading(true);
                // Wait 2 seconds then redirect to login
                setTimeout(() => {
                  setLoading(false);
                  router.push('/auth/login');
                }, 2000);
              }
            }
          ]
        );
      } else if (response.data.token) {
        // Fallback for old API format
        // Use the authentication context to handle login after successful signup
        await login(
          response.data.token,
          response.data.username,
          response.data.user
        );
        // Small delay to ensure authentication state is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        // Navigate to appropriate dashboard based on user role
        if (response.data.user.isAdmin) {
          router.push('/admin/dashboard');
        } else {
          router.push('/(tabs)/home');
        }
      }
    } catch (error) {
      // Show user-friendly error messages without console logging
      let errorMessage = 'Failed to create account. Please try again.';
      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error: Cannot connect to server. Please check your connection.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout: Server is taking too long to respond.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9f9" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        
          <Text style={styles.formTitle}>Create Account</Text>

          {/* Profile Selection Section */}
          <View style={styles.profileSection}>
            <Text style={styles.sectionTitle}>Profile</Text>
            
            {/* Current Selection Display */}
            <View style={styles.currentSelectionContainer}>
              <View style={styles.currentSelectionImage}>
                {customImage ? (
                  <Image
                    source={{ uri: customImage }}
                    style={styles.currentImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Image
                    source={getAvatarSource(selectedAvatar)}
                    style={styles.currentImage}
                    resizeMode="cover"
                  />
                )}
                <TouchableOpacity style={styles.photosIcon} onPress={pickImage}>
                  <Image 
                    source={require('../../assets/icons/photos.png')} 
                    style={styles.photosIconImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Avatar Selection */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.avatarChoicesScroll} 
              contentContainerStyle={styles.avatarChoicesRow}
            >
              {avatars.slice(0, 10).map((avatar) => (
                <TouchableOpacity
                  key={avatar}
                  style={[
                    styles.avatarChoice, 
                    selectedAvatar === avatar && !customImage && styles.avatarChoiceSelected
                  ]}
                  onPress={() => {
                    setSelectedAvatar(avatar);
                    setCustomImage(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Image
                    source={getAvatarSource(avatar)}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Form Fields */}
          <View style={styles.formFields}>
            {/* Full Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <View style={styles.inputContainer}>
                <Image 
                  source={require('../../assets/icons/name.png')} 
                  style={styles.inputIcon}
                  resizeMode="contain"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  placeholderTextColor="#9ca3af"
                  value={fullName}
                  onChangeText={(text) => handleTextInputChange(
                    text, 
                    setFullName,
                    () => Alert.alert('Invalid Input', 'Emojis are not allowed in names.')
                  )}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Username Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <View style={styles.inputContainer}>
                <Image 
                  source={require('../../assets/icons/username.png')} 
                  style={styles.inputIcon}
                  resizeMode="contain"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter user name"
                  placeholderTextColor="#9ca3af"
                  value={username}
                  onChangeText={(text) => handleTextInputChange(
                    text, 
                    setUsername,
                    () => Alert.alert('Invalid Input', 'Emojis are not allowed in usernames.')
                  )}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputContainer}>
                <Image 
                  source={require('../../assets/icons/email.png')} 
                  style={styles.inputIcon}
                  resizeMode="contain"
                />
                <TextInput
                  style={styles.input}
                  keyboardType="email-address"
                  placeholder="Enter email"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={(text) => handleTextInputChange(
                    text, 
                    setEmail,
                    () => Alert.alert('Invalid Input', 'Emojis are not allowed in email addresses.')
                  )}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Educational Level Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Educational Level</Text>
              <TouchableOpacity 
                style={styles.dropdownContainer}
                onPress={() => setShowEducationalDropdown(true)}
                activeOpacity={0.7}
              >
                <Image 
                  source={require('../../assets/icons/education.png')} 
                  style={styles.inputIcon}
                  resizeMode="contain"
                />
                <Text style={[
                  styles.dropdownText,
                  !educationalLevel && styles.dropdownPlaceholder
                ]}>
                  {getEducationalLevelLabel()}
                </Text>
                <Image 
                  source={require('../../assets/icons/dropdown.png')} 
                  style={styles.dropdownArrow}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <Image 
                  source={require('../../assets/icons/password.png')} 
                  style={styles.inputIcon}
                  resizeMode="contain"
                />
                <TextInput
                  style={styles.input}
                  secureTextEntry={!showPassword}
                  placeholder="Enter password"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={(text) => handleTextInputChange(
                    text, 
                    setPassword,
                    () => Alert.alert('Invalid Input', 'Emojis are not allowed in passwords.')
                  )}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity 
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Image 
                    source={showPassword ? require('../../assets/icons/hide.png') : require('../../assets/icons/show.png')} 
                    style={styles.passwordToggleIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputContainer}>
                <Image 
                  source={require('../../assets/icons/password.png')} 
                  style={styles.inputIcon}
                  resizeMode="contain"
                />
                <TextInput
                  style={styles.input}
                  secureTextEntry={!showConfirmPassword}
                  placeholder="Confirm your password"
                  placeholderTextColor="#9ca3af"
                  value={confirmPassword}
                  onChangeText={(text) => handleTextInputChange(
                    text, 
                    setConfirmPassword,
                    () => Alert.alert('Invalid Input', 'Emojis are not allowed in passwords.')
                  )}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity 
                  style={styles.passwordToggle}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Image 
                    source={showConfirmPassword ? require('../../assets/icons/hide.png') : require('../../assets/icons/show.png')} 
                    style={styles.passwordToggleIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Create Account Button */}
            <TouchableOpacity 
              style={styles.createAccountButton}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.createAccountButtonText}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        
      </ScrollView>

      {/* Educational Level Dropdown Modal */}
      <Modal
        visible={showEducationalDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEducationalDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEducationalDropdown(false)}
        >
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select Educational Level</Text>
              <TouchableOpacity 
                onPress={() => setShowEducationalDropdown(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownOptions}>
              {educationalLevels.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.dropdownOption,
                    educationalLevel === level.value && styles.dropdownOptionSelected
                  ]}
                  onPress={() => {
                    setEducationalLevel(level.value);
                    setShowEducationalDropdown(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.dropdownOptionText,
                    educationalLevel === level.value && styles.dropdownOptionTextSelected
                  ]}>
                    {level.label}
                  </Text>
                  {educationalLevel === level.value && (
                    <Image 
                      source={require('../../assets/icons/check.png')} 
                      style={styles.checkIcon}
                      resizeMode="contain"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default Signup;

// @ts-ignore - Suppressing style type compatibility warnings
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 32,
  },
  profileSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  currentSelectionContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  currentSelectionImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#ef4444',
    overflow: 'hidden',
  },
  currentImage: {
    width: '100%',
    height: '100%',
  },
  photosIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    zIndex: 10,
    elevation: 5,
  },
  photosIconImage: {
    width: 18,
    height: 18,
    tintColor: '#ffffff',
  },
  avatarChoicesScroll: {
    marginHorizontal: -12,
  },
  avatarChoicesRow: {
    paddingHorizontal: 12,
    gap: 12,
  },
  avatarChoice: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  avatarChoiceSelected: {
    borderColor: '#ef4444',
    borderWidth: 3,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  formFields: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 48,
  },
  inputIcon: {
    width: 20,
    height: 20,
    tintColor: '#6b7280',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    fontWeight: '400',
    height: 48,
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 48,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  dropdownPlaceholder: {
    color: '#9ca3af',
  },
  dropdownArrow: {
    width: 16,
    height: 16,
    tintColor: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '85%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  dropdownOptions: {
    maxHeight: 300,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownOptionSelected: {
    backgroundColor: '#f0f9ff',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  dropdownOptionTextSelected: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  checkIcon: {
    width: 20,
    height: 20,
    tintColor: '#4f46e5',
  },
  passwordToggle: {
    padding: 4,
  },
  passwordToggleIcon: {
    width: 20,
    height: 20,
    tintColor: '#6b7280',
  },
  createAccountButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    height: 52,
  },
  createAccountButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
});