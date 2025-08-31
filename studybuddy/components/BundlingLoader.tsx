// File: BundlingLoader.tsx
// Description: Loading component for when the app is bundling

import React, { useEffect, useState } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, Image } from 'react-native';

const { width, height } = Dimensions.get('window');

interface BundlingLoaderProps {
  message?: string;
}

/**
 * Loading component displayed during app bundling
 * Shows animated logo and loading indicators
 */
const BundlingLoader: React.FC<BundlingLoaderProps> = ({ 
      message = "Bundling FlashLearn..." 
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [rotateAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image
        source={require('../assets/images/landing_background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Animated Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: Animated.multiply(scaleAnim, pulseAnim) },
            ],
          },
        ]}
      >
        <Animated.Image
          source={require('../assets/images/flashlearnlogo.png')}
          style={[
            styles.logo,
            {
              transform: [{ rotate: spin }],
            },
          ]}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Loading Text */}
      <Animated.Text
        style={[
          styles.loadingText,
          {
            opacity: fadeAnim,
            transform: [{ 
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }) 
            }],
          },
        ]}
      >
        {message}
      </Animated.Text>

      {/* Progress Bar */}
      <Animated.View
        style={[
          styles.progressContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: pulseAnim.interpolate({
                  inputRange: [1, 1.1],
                  outputRange: ['60%', '80%'],
                }),
              },
            ]}
          />
        </View>
      </Animated.View>

      {/* Loading Dots */}
      <Animated.View
        style={[
          styles.loadingDots,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Animated.View 
          style={[
            styles.dot, 
            { 
              backgroundColor: '#ffffff',
              transform: [{ scale: pulseAnim }],
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.dot, 
            { 
              backgroundColor: '#ffffff',
              transform: [{ scale: pulseAnim }],
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.dot, 
            { 
              backgroundColor: '#ffffff',
              transform: [{ scale: pulseAnim }],
            }
          ]} 
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#667eea',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
  },
  loadingText: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 30,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  progressContainer: {
    width: width * 0.7,
    marginBottom: 30,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  loadingDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6,
    opacity: 0.8,
  },
});

export default BundlingLoader;
