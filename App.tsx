import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
} from 'react-native';

export default function App(): React.JSX.Element {
  return (
    <>
      <StatusBar backgroundColor="#FF6B00" barStyle="light-content" />

      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.logo}>🍲</Text>

            <Text style={styles.title}>
              VeetuRusi Franchise Admin
            </Text>

            <Text style={styles.subtitle}>
              Welcome to the Franchise Dashboard
            </Text>

            <View style={styles.buttonContainer}>
              <Text style={styles.buttonText}>Login</Text>
            </View>

            <Text style={styles.footerText}>Version 1.0</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7F0',
  },
  
  scrollContent: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
    paddingVertical: 20,
  },

  card: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },

  logo: {
    fontSize: 60,
    marginBottom: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B00',
    textAlign: 'center',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
  },

  buttonContainer: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },

  buttonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },

  footerText: {
    fontSize: 12,
    color: '#999999',
  },
});