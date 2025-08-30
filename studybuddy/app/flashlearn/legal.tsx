// File: legal.tsx
// Description: Legal screen displaying privacy policy and terms of service

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

const LegalScreen = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy & Terms</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Privacy Policy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Policy</Text>
          <Text style={styles.policyText}>
            At FlashLearn, we are committed to protecting your privacy and ensuring the security of your personal information. This privacy policy explains how we collect, use, and safeguard your data.
          </Text>
          
          <Text style={styles.subsectionTitle}>Data Collection</Text>
          <Text style={styles.policyText}>
            We collect the following information to provide you with the best learning experience:
          </Text>
          <Text style={styles.bulletPoint}>• Account information (name, email, username)</Text>
          <Text style={styles.bulletPoint}>• Study progress and quiz results</Text>
          <Text style={styles.bulletPoint}>• Flashcard sets you create and study</Text>
          <Text style={styles.bulletPoint}>• Usage analytics to improve the app</Text>
          
          <Text style={styles.subsectionTitle}>Data Usage</Text>
          <Text style={styles.policyText}>
            Your data is used exclusively for:
          </Text>
          <Text style={styles.bulletPoint}>• Providing personalized learning experiences</Text>
          <Text style={styles.bulletPoint}>• Tracking your study progress</Text>
          <Text style={styles.bulletPoint}>• Improving app functionality and features</Text>
          <Text style={styles.bulletPoint}>• Technical support and troubleshooting</Text>
          
          <Text style={styles.subsectionTitle}>Data Security</Text>
          <Text style={styles.policyText}>
            We implement industry-standard security measures to protect your data:
          </Text>
          <Text style={styles.bulletPoint}>• Secure authentication and authorization</Text>
          <Text style={styles.bulletPoint}>• Encrypted data transmission</Text>
          <Text style={styles.bulletPoint}>• Regular security audits and updates</Text>
          <Text style={styles.bulletPoint}>• Limited access to personal data</Text>
          
          <Text style={styles.subsectionTitle}>Data Access</Text>
          <Text style={styles.policyText}>
            <Text style={styles.importantText}>Important:</Text> Only the developer of this capstone project has access to your personal data. No third-party services or external parties can access your information without your explicit consent.
          </Text>
          
          <Text style={styles.subsectionTitle}>Data Retention</Text>
          <Text style={styles.policyText}>
            Your study data is saved to help you track your learning progress over time. You can request deletion of your account and associated data at any time by contacting support.
          </Text>
        </View>

        {/* Terms of Service Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Terms of Service</Text>
          <Text style={styles.policyText}>
            By using FlashLearn, you agree to the following terms and conditions:
          </Text>
          
          <Text style={styles.subsectionTitle}>Acceptable Use</Text>
          <Text style={styles.policyText}>
            You agree to use FlashLearn only for educational purposes and in accordance with these terms. You must not:
          </Text>
          <Text style={styles.bulletPoint}>• Create inappropriate or offensive content</Text>
          <Text style={styles.bulletPoint}>• Attempt to hack or compromise the app</Text>
          <Text style={styles.bulletPoint}>• Share your account credentials with others</Text>
          <Text style={styles.bulletPoint}>• Use the app for commercial purposes without permission</Text>
          
          <Text style={styles.subsectionTitle}>Content Ownership</Text>
          <Text style={styles.policyText}>
            You retain ownership of the flashcard sets you create. However, you grant FlashLearn a license to store and display your content for educational purposes.
          </Text>
          
          <Text style={styles.subsectionTitle}>Limitation of Liability</Text>
          <Text style={styles.policyText}>
            FlashLearn is provided "as is" without warranties. We are not liable for any damages arising from your use of the app, including but not limited to data loss or service interruptions.
          </Text>
          
          <Text style={styles.subsectionTitle}>Changes to Terms</Text>
          <Text style={styles.policyText}>
            We may update these terms from time to time. Continued use of the app after changes constitutes acceptance of the new terms.
          </Text>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.policyText}>
            If you have any questions about this privacy policy or terms of service, please contact us at:
          </Text>
          <Text style={styles.contactInfo}>support@flashlearn.com</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default LegalScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginTop: 20,
    marginBottom: 8,
  },
  policyText: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    marginLeft: 16,
    marginBottom: 4,
  },
  importantText: {
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  contactInfo: {
    fontSize: 16,
    color: '#4facfe',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
});
