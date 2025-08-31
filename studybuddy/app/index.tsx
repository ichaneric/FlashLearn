// File: index.tsx
// Description: Landing page for the FlashLearn educational app with authentication check

import { StyleSheet, Text, View, TouchableOpacity, Image, StatusBar } from 'react-native';
import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import BundlingLoader from '../components/BundlingLoader';

export default function Index() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  // Redirect to appropriate dashboard based on user role
  useEffect(() => {
    console.log('[Index] Auth state changed - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'isAdmin:', isAdmin);
    if (!isLoading && isAuthenticated) {
      if (isAdmin) {
        console.log('[Index] Admin user detected, redirecting to admin dashboard');
        console.log('[Index] Current route will be: /admin/dashboard');
        router.replace('/admin/dashboard');
      } else {
        console.log('[Index] Regular user detected, redirecting to home');
        console.log('[Index] Current route will be: /(tabs)/home');
        router.replace('/(tabs)/home');
      }
    } else if (!isLoading && !isAuthenticated) {
      console.log('[Index] User not authenticated, staying on landing page');
    }
  }, [isAuthenticated, isLoading, isAdmin]);

  // Show enhanced loading screen while checking authentication
  if (isLoading) {
    console.log('[Index] Showing enhanced loading screen');
    return <BundlingLoader message="Loading FlashLearn..." />;
  }

  console.log('[Index] Showing landing page - isAuthenticated:', isAuthenticated);
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6d28d9" />
      
      {/* Background Image */}
      <Image
        source={require('../assets/images/landing_background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Content */}
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.header}>
          {/* Main Card Container */}
          <View style={styles.mainCard}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/images/flashlearnlogo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>FlashLearn</Text>
            <Text style={styles.tagline}>Smart flashcards for better learning</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push('/auth/signup')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6d28d9',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 80,
  },
  header: {
    alignItems: 'center',
    width: '100%',
    flex: 1,
    justifyContent: 'center',
  },
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
    width: '100%',
    maxWidth: 350,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 50,
    height: 50,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 18,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
    fontWeight: '500',
  },
  actionContainer: {
    width: '100%',
    gap: 16,
    maxWidth: 350,
  },
  primaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    height: 60,
  },
  primaryButtonText: {
    color: '#6d28d9',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },
});
