import React, { useEffect, useState } from 'react';
import 'intl-pluralrules';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { I18nextProvider } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from './src/i18n/config';
import AuthContext from './src/context/AuthContext';
import api from './src/services/api';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import PhoneRegistrationScreen from './src/screens/PhoneRegistrationScreen';
import CNICVerificationScreen from './src/screens/CNICVerificationScreen';
import DashboardScreen from './src/screens/DashboardScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const user = await AsyncStorage.getItem('userData');
      
      if (token) {
        setUserToken(token);
        setUserData(JSON.parse(user));
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const authContext = {
    signIn: async (token, user) => {
      try {
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUserToken(token);
        setUserData(user);
      } catch (error) {
        console.error('Sign in error:', error);
      }
    },
    signOut: async () => {
      try {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');
        delete api.defaults.headers.common['Authorization'];
        setUserToken(null);
        setUserData(null);
      } catch (error) {
        console.error('Sign out error:', error);
      }
    },
    userData,
    userToken
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00A86B" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      <AuthContext.Provider value={authContext}>
        <PaperProvider>
          <SafeAreaProvider>
            <NavigationContainer>
              <Stack.Navigator
                screenOptions={{
                  headerShown: false,
                  animation: 'slide_from_right'
                }}
              >
                {userToken ? (
                  <>
                    <Stack.Screen name="Dashboard" component={DashboardScreen} />
                  </>
                ) : (
                  <>
                    <Stack.Screen name="Welcome" component={WelcomeScreen} />
                    <Stack.Screen name="PhoneRegistration" component={PhoneRegistrationScreen} />
                    <Stack.Screen name="CNICVerification" component={CNICVerificationScreen} />
                  </>
                )}
              </Stack.Navigator>
            </NavigationContainer>
          </SafeAreaProvider>
        </PaperProvider>
      </AuthContext.Provider>
    </I18nextProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666'
  }
});