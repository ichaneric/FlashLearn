// File: signup.tsx
// Description: Handles user registration with profile image upload and avatar selection functionality.

import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, StatusBar, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import React, { useState } from 'react';
import axios from 'axios';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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
      <StatusBar barStyle="light-content" backgroundColor="#6d28d9" />
      
      {/* Enhanced Purple Gradient Background */}
      <LinearGradient
        colors={['#6d28d9', '#7c3aed', '#8b5cf6', '#a855f7']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Enhanced Floating Elements */}
      <View style={styles.backgroundElements}>
        <View style={styles.floatingCard1} />
        <View style={styles.floatingCard2} />
        <View style={styles.floatingCard3} />
        <View style={styles.floatingCircle1} />
        <View style={styles.floatingCircle2} />
        <View style={styles.floatingDot1} />
        <View style={styles.floatingDot2} />
      </View>
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Enhanced Signup Card */}
          <View style={styles.signupCard}>
            {/* Enhanced Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={['#f8fafc', '#e2e8f0']}
                  style={styles.logoGradient}
                >
                  <Image
                    source={require('../../assets/images/flashlearnlogo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </LinearGradient>
              </View>
              <Text style={styles.appName}>Create Account</Text>
              <Text style={styles.subtitle}>Join FlashLearn today and start your learning journey</Text>
            </View>

            {/* Enhanced Profile Selection Section */}
            <View style={styles.profileSection}>
              <Text style={styles.sectionTitle}>Choose Your Profile Picture</Text>
              
              {/* Enhanced Current Selection Display */}
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
                </View>
                <Text style={styles.currentSelectionText}>
                  {customImage ? 'Custom Image' : 'Selected Avatar'}
                </Text>
              </View>

              {/* Enhanced Custom Image Button */}
              <TouchableOpacity 
                style={styles.customImageButton}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.customImageButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.customImageButtonText}>📷 Use Your Own Photo</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Enhanced Avatar Selection */}
              <Text style={styles.avatarSectionTitle}>Or Choose from Avatars</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.avatarChoicesScroll} 
                contentContainerStyle={styles.avatarChoicesRow}
              >
                {avatars.map((avatar) => (
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

            {/* Enhanced Signup Form */}
            <View style={styles.formContainer}>
              {/* Enhanced Full Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.iconContainer}>
                    <Image 
                      source={require('../../assets/icons/name.png')} 
                      style={styles.inputIcon}
                      resizeMode="contain"
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
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

              {/* Enhanced Username Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.iconContainer}>
                    <Image 
                      source={require('../../assets/icons/username.png')} 
                      style={styles.inputIcon}
                      resizeMode="contain"
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Choose a username"
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

              {/* Enhanced Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.iconContainer}>
                    <Image 
                      source={require('../../assets/icons/email.png')} 
                      style={styles.inputIcon}
                      resizeMode="contain"
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    keyboardType="email-address"
                    placeholder="Enter your email"
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

              {/* Enhanced Educational Level Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Educational Level</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.iconContainer}>
                    <Image 
                      source={require('../../assets/icons/education.png')} 
                      style={styles.inputIcon}
                      resizeMode="contain"
                    />
                  </View>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.levelScroll}
                    contentContainerStyle={styles.levelContainer}
                  >
                    {educationalLevels.map((level) => (
                      <TouchableOpacity
                        key={level.value}
                        style={[
                          styles.levelOption,
                          educationalLevel === level.value && styles.levelOptionSelected
                        ]}
                        onPress={() => setEducationalLevel(level.value)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.levelOptionText,
                          educationalLevel === level.value && styles.levelOptionTextSelected
                        ]}>
                          {level.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Enhanced Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.iconContainer}>
                    <Image 
                      source={require('../../assets/icons/password.png')} 
                      style={styles.inputIcon}
                      resizeMode="contain"
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    secureTextEntry={!showPassword}
                    placeholder="Create a password"
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

              {/* Enhanced Confirm Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.iconContainer}>
                    <Image 
                      source={require('../../assets/icons/password.png')} 
                      style={styles.inputIcon}
                      resizeMode="contain"
                    />
                  </View>
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

              {/* Enhanced Signup Button */}
              <TouchableOpacity 
                style={styles.signupButton}
                onPress={handleSignup}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#6d28d9', '#7c3aed']}
                  style={styles.signupButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.signupButtonText}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Enhanced Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/auth/login')}>
                  <Text style={styles.loginLink}>Sign in</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default Signup;

// @ts-ignore - Suppressing style type compatibility warnings
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6d28d9',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  backgroundElements: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  floatingCard1: {
    position: 'absolute',
    width: 90,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    top: '8%',
    right: -10,
    transform: [{ rotate: '10deg' }],
  },
  floatingCard2: {
    position: 'absolute',
    width: 70,
    height: 95,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    bottom: '12%',
    left: -8,
    transform: [{ rotate: '-12deg' }],
  },
  floatingCard3: {
    position: 'absolute',
    width: 60,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    top: '30%',
    left: '85%',
    transform: [{ rotate: '15deg' }],
  },
  floatingCircle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: '20%',
    left: '10%',
    transform: [{ rotate: '45deg' }],
  },
  floatingCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    bottom: '30%',
    right: '20%',
    transform: [{ rotate: '-30deg' }],
  },
  floatingDot1: {
    position: 'absolute',
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: '50%',
    left: '40%',
    transform: [{ rotate: '45deg' }],
  },
  floatingDot2: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: '60%',
    right: '50%',
    transform: [{ rotate: '15deg' }],
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 60,
  },
  signupCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  profileSection: {
    marginBottom: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  currentSelectionContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  currentSelectionImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#ffffff',
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  currentImage: {
    width: '100%',
    height: '100%',
  },
  currentSelectionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  customImageButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  customImageButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customImageButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  avatarSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
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
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  avatarChoiceSelected: {
    borderColor: '#ffffff',
    borderWidth: 3,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 12, // Reduced height
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  inputIcon: {
    width: 20,
    height: 20,
    tintColor: '#6b7280',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  levelScroll: {
    flex: 1,
  },
  levelContainer: {
    gap: 8,
  },
  levelOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  levelOptionSelected: {
    backgroundColor: '#3D14C4',
    borderColor: '#3D14C4',
  },
  levelOptionText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  levelOptionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  passwordToggle: {
    padding: 4,
  },
  passwordToggleIcon: {
    width: 20,
    height: 20,
    tintColor: '#6b7280',
  },
  signupButton: {
    backgroundColor: '#6d28d9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#6d28d9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  signupButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  loginText: {
    fontSize: 14,
    color: '#6b7280',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6d28d9',
  },
});