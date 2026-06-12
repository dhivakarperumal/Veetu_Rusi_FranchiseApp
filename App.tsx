import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  StatusBar,
} from 'react-native';

export default function App(): React.JSX.Element {
  return (
    <>
      <StatusBar backgroundColor="#FF6B00" barStyle="light-content" />

      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.logo}>🍲</Text>

          <Text style={styles.title}>
            VeetuRusi Franchise Admin
          </Text>

          <Text style={styles.subtitle}>
            Welcome to the Franchise Dashboard
          </Text>

          <View style={styles.buttonContainer}>
            <Text style={styles.button}>Login</Text>
          </View>

          <Text style={styles.footerText}>Version 1.0</Text>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7F0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
  },

  logo: {
    fontSize: 60,
    marginBottom: 10,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B00',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },

  buttonContainer: {
    backgroundColor: '#FF6B00',
    marginTop: 20,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },

  button: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  footerText: {
    fontSize: 12,
    color: '#999',
    marginTop: 15,
  },
});