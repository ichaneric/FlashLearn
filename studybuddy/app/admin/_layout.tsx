// File: studybuddy/app/admin/_layout.tsx
// Description: Admin layout with navigation and authentication checks

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, Dimensions, TouchableOpacity } from 'react-native';
import { Tabs } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function AdminLayout() {
  const { isAuthenticated, isLoading, isAdmin, logout } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for auth context to finish loading
    if (!isLoading) {
      setLoading(false);
    }
  }, [isLoading]);

  /**
   * Handles admin logout
   */
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              console.log('[AdminLayout] Admin logged out successfully');
            } catch (error) {
              console.error('[AdminLayout] Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Show loading while checking authentication
  if (loading || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.loadingGradient}
        >
          <Text style={styles.loadingText}>Verifying Admin Access...</Text>
        </LinearGradient>
      </View>
    );
  }

  // Check if user is authenticated and is admin
  if (!isAuthenticated) {
    return (
      <View style={styles.deniedContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.deniedGradient}
        >
          <Text style={styles.deniedText}>Access Denied</Text>
          <Text style={styles.deniedSubtext}>Please log in to access admin features</Text>
        </LinearGradient>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.deniedContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.deniedGradient}
        >
          <Text style={styles.deniedText}>Access Denied</Text>
          <Text style={styles.deniedSubtext}>You don't have admin privileges</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: styles.headerStyle,
        headerTintColor: '#FFFFFF',
        headerTitleStyle: styles.headerTitleStyle,
        headerRight: () => (
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        ),
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.tabBarGradient}
          />
        ),
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.7)',
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          headerTitle: 'Admin Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Text style={[styles.tabIcon, { color, fontSize: size }]}>📊</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          headerTitle: 'User Management',
          tabBarIcon: ({ color, size }) => (
            <Text style={[styles.tabIcon, { color, fontSize: size }]}>👥</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="sets"
        options={{
          title: 'Sets',
          headerTitle: 'Set Management',
          tabBarIcon: ({ color, size }) => (
            <Text style={[styles.tabIcon, { color, fontSize: size }]}>📚</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          headerTitle: 'Analytics',
          tabBarIcon: ({ color, size }) => (
            <Text style={[styles.tabIcon, { color, fontSize: size }]}>📈</Text>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  deniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deniedGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deniedText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  deniedSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerStyle: {
    backgroundColor: '#667eea',
    elevation: 0,
    shadowColor: 'transparent',
  },
  headerTitleStyle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoutButton: {
    marginRight: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  tabBar: {
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabBarGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  tabIcon: {
    marginBottom: 2,
  },
});
