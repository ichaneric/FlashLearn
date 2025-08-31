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
      <StatusBar barStyle="light-content" backgroundColor="#3D14C4" />
      
      {/* Background Image */}
      <Image
        source={require('../assets/images/landing_background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Content */}
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/flashlearnlogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
        </View>
        
        {/* Title */}
        <Text style={styles.appName}>Flash Learn</Text>
        
        {/* Subtitle */}
        <Text style={styles.tagline}>Smart flashcards for better learning</Text>
        
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
    backgroundColor: '#3D14C4',
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
  logoContainer: {
    marginBottom: 40,
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  logo: {
    width: 180,
    height: 180,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 60,
    fontWeight: '400',
  },
  actionContainer: {
    width: '100%',
    gap: 16,
    maxWidth: 300,
  },
  primaryButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#3D14C4',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  secondaryButtonText: {
    color: '#3D14C4',
    fontSize: 18,
    fontWeight: '600',
  },
});
