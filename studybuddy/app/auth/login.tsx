// File: login.tsx
// Description: Handles user authentication and login functionality with improved UI and error handling.

import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, StatusBar, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import React, { useState } from 'react';
import axios from 'axios';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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
        <View style={styles.floatingCircle1} />
        <View style={styles.floatingCircle2} />
        <View style={styles.floatingDot1} />
        <View style={styles.floatingDot2} />
      </View>
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Enhanced Login Card */}
          <View style={styles.loginCard}>
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
              <Text style={styles.appName}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue your learning journey</Text>
            </View>

            {/* Enhanced Login Form */}
            <View style={styles.formContainer}>
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
                    placeholder="Enter your password"
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

              {/* Enhanced Login Button */}
              <TouchableOpacity 
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#6d28d9', '#7c3aed']}
                  style={styles.loginButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.loginButtonText}>
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Enhanced Signup Link */}
              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Don&apos;t have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/auth/signup')}>
                  <Text style={styles.signupLink}>Sign up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default Login;

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
    width: 120,
    height: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    top: '8%',
    right: -20,
    transform: [{ rotate: '15deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  floatingCard2: {
    position: 'absolute',
    width: 90,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    bottom: '18%',
    left: -15,
    transform: [{ rotate: '-12deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  floatingCircle1: {
    position: 'absolute',
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 30,
    top: '35%',
    right: '10%',
  },
  floatingCircle2: {
    position: 'absolute',
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    bottom: '30%',
    right: '20%',
  },
  floatingDot1: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    top: '25%',
    left: '15%',
  },
  floatingDot2: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    top: '60%',
    left: '10%',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  loginCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 44,
    height: 44,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    fontWeight: '500',
  },
  passwordToggle: {
    padding: 6,
    marginLeft: 8,
  },
  passwordToggleIcon: {
    width: 20,
    height: 20,
    tintColor: '#6b7280',
  },
  loginButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 28,
    shadowColor: '#6d28d9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  loginButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 36,
  },
  signupText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '400',
  },
  signupLink: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6d28d9',
  },
});
