import React, { useEffect } from 'react';
import { Text, TextInput, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation';
import { useFonts } from 'expo-font';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold } from '@expo-google-fonts/poppins';

// Fallback using defaultProps
if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps.style = Text.defaultProps.style || {};
Text.defaultProps.style.fontFamily = 'Poppins-Regular';

if (TextInput.defaultProps == null) TextInput.defaultProps = {};
TextInput.defaultProps.style = TextInput.defaultProps.style || {};
TextInput.defaultProps.style.fontFamily = 'Poppins-Regular';

// Global CSS injection for web fallback
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    html, body, #root {
      font-family: 'Poppins-Regular', sans-serif;
    }
  `;
  document.head.appendChild(style);

  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').catch((error) => {
        console.log('SW Registration failed: ', error);
      });
    });
  }
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
