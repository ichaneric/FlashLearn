// File: login.tsx
// Description: Handles user authentication and login functionality with improved UI and error handling.

import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, StatusBar, ScrollView, Image } from 'react-native';
import React, { useState } from 'react';
import axios from 'axios';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { createApiUrl, API_ENDPOINTS, getApiConfig } from '../../config/api';
import { handleTextInputChange } from '../../utils/emojiPrevention';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  /**
   * Handles user login authentication
   * Validates credentials and stores user data on successful login
   */
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const apiUrl = createApiUrl(API_ENDPOINTS.LOGIN);
      
      const response = await axios.post(apiUrl, {
        email: email,
        password: password,
      }, getApiConfig());

      if (response.data.token) {
        // Use the authentication context to handle login
        await login(
          response.data.token,
          response.data.username,
          response.data.user
        );
        
        // Navigate to appropriate dashboard based on user role
        if (response.data.user.isAdmin) {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/(tabs)/home');
        }
      }
    } catch (error) {
      // Show user-friendly error messages without console logging
      let errorMessage = 'Invalid email or password. Please try again.';
      
      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error: Cannot connect to server. Please check your connection.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout: Server is taking too long to respond.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3D14C4" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Purple Header Section (~40% of screen) */}
        <View style={styles.headerSection}>
          <Text style={styles.helloText}>Hello,</Text>
          <Text style={styles.welcomeText}>Welcome back</Text>
          
          {/* Floating Shapes */}
          <View style={styles.shape1} />
          <View style={styles.shape2} />
        </View>
        
        {/* Light Gray Content Section (~60% of screen) */}
        
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Sign In</Text>
            
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

            {/* Sign In Button */}
            <TouchableOpacity 
              style={styles.signInButton}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.signInButtonText}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            {/* Footer Link */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/signup')}>
                <Text style={styles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          
        </View>
      </ScrollView>
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3D14C4',
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerSection: {
    backgroundColor: '#3D14C4',
    height: '40%',
    paddingTop: 60,
    paddingHorizontal: 24,
    justifyContent: 'center',
    position: 'relative',
  },
  helloText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  shape1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: '20%',
    left: -30,
  },
  shape2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: '15%',
    right: '10%',
  },
  contentSection: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 0,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
    marginTop: -20,
    height: '70%',
    borderTopEndRadius: 20,
    borderTopStartRadius: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 32,
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
  passwordToggle: {
    padding: 4,
  },
  passwordToggleIcon: {
    width: 20,
    height: 20,
    tintColor: '#6b7280',
  },
  signInButton: {
    backgroundColor: '#3D14C4',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    height: 55,
  },
  signInButtonText: {
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
    color: '#3D14C4',
  },
});
