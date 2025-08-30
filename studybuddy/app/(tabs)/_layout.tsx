import { Tabs } from 'expo-router';
import { StyleSheet, View, Image, Platform } from 'react-native';

const ICON_BG = 'rgba(255, 255, 255, 0.2)'; // Semi-transparent white for modern look
const TAB_BG = 'rgba(102, 126, 234, 0.95)';  // Gradient blue background

const TabIcon = ({ source, focused }: { source: any; focused: boolean }) => (
  <View style={[styles.iconCircle, focused && styles.iconCircleFocused]}>
    <Image
      source={source}
      style={[
        styles.tabIcon,
        { tintColor: focused ? '#4facfe' : '#fff' }
      ]}
      resizeMode="contain"
    />
  </View>
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: true,
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          color: '#fff',
          marginTop: 3,
          marginBottom: 6,
          textAlign: 'center',
        },
        tabBarActiveTintColor: '#4facfe',
        tabBarInactiveTintColor: '#fff',
        tabBarStyle: {
          backgroundColor: TAB_BG,
          height: 82,
          borderTopWidth: 0,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 6,
          paddingBottom: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
          ...(Platform.OS === 'web' ? { paddingLeft: 60, paddingRight: 60 } : {}),
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={require('../../assets/images/home.png')} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="card"
        options={{
          title: 'Backpack',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={require('../../assets/images/card.png')} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="quiz"
        options={{
          title: 'Quiz',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={require('../../assets/images/bulb.png')} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={require('../../assets/images/profile.png')} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 25,
    height: 25,
    tintColor: '#fff',
  },
  iconCircle: {
    backgroundColor: ICON_BG,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  iconCircleFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: '#4facfe',
    shadowColor: '#4facfe',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});