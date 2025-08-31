// File: index.tsx
// Description: Landing page for the FlashLearn educational app with authentication check

import { StyleSheet, Text, View, TouchableOpacity, Image, StatusBar } from 'react-native';
import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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
      
      {/* Enhanced Content */}
      <View style={styles.content}>
        {/* Enhanced Header Section */}
        <View style={styles.header}>
          {/* Enhanced Main Card Container */}
          <View style={styles.mainCard}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#f8fafc', '#e2e8f0']}
                style={styles.logoGradient}
              >
                <Image
                  source={require('../assets/images/flashlearnlogo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </LinearGradient>
            </View>
            <Text style={styles.appName}>FlashLearn</Text>
            <Text style={styles.tagline}>Smart flashcards for better learning</Text>
            <Text style={styles.subtitle}>Study smarter, not harder with our intelligent learning platform</Text>
            
            {/* Enhanced Feature Highlights inside card */}
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <LinearGradient
                    colors={['#6d28d9', '#7c3aed']}
                    style={styles.featureIconGradient}
                  >
                    <Image source={require('../assets/icons/education.png')} style={styles.featureIconImage} />
                  </LinearGradient>
                </View>
                <Text style={styles.featureText}>Smart Learning</Text>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={styles.featureIconGradient}
                  >
                    <Image source={require('../assets/icons/study.png')} style={styles.featureIconImage} />
                  </LinearGradient>
                </View>
                <Text style={styles.featureText}>Track Progress</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Enhanced Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ffffff', '#f8fafc']}
              style={styles.primaryButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </LinearGradient>
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
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  backgroundElements: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: -1, // Ensure elements are behind content
  },
  floatingCard1: {
    position: 'absolute',
    width: 120,
    height: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    top: '15%',
    right: '-20px',
    transform: [{ rotate: '15deg' }],
  },
  floatingCard2: {
    position: 'absolute',
    width: 100,
    height: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    bottom: '20%',
    left: '-15px',
    transform: [{ rotate: '-10deg' }],
  },
  floatingCard3: {
    position: 'absolute',
    width: 80,
    height: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    top: '40%',
    left: '80%',
    transform: [{ rotate: '20deg' }],
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
    marginBottom: 40,
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 240,
    fontWeight: '400',
    marginBottom: 32,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 8,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureIconImage: {
    width: 18,
    height: 18,
    tintColor: '#6d28d9',
  },
  featureText: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
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
  },
  primaryButtonText: {
    color: '#6d28d9',
    fontSize: 17,
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
  logoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureIconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCircle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: '20%',
    left: '10%',
  },
  floatingCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    bottom: '30%',
    right: '20%',
  },
  floatingDot1: {
    position: 'absolute',
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: '50%',
    left: '70%',
  },
  floatingDot2: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: '10%',
    right: '50%',
  },
});
