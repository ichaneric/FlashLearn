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
        <Animated.View
          style={[
            styles.logoCircle,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <Image
            source={require('../assets/images/flashlearnlogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </Animated.View>

      {/* App Name */}
      <Animated.Text
        style={[
          styles.appName,
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
        Flash Learn
      </Animated.Text>

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
    backgroundColor: '#3D14C4',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
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
    width: 80,
    height: 80,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 40,
    textAlign: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    width: 200,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    marginVertical: 2,
    opacity: 0.8,
  },
});

export default BundlingLoader;
