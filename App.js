import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { I18nextProvider } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from './src/i18n/config';
import AuthContext from './src/context/AuthContext';
import api from './src/services/api';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'intl-pluralrules'; // Polyfill for i18next pluralization

// Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import PhoneRegistrationScreen from './src/screens/PhoneRegistrationScreen';
import CNICVerificationScreen from './src/screens/CNICVerificationScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import TransferScreen from './src/screens/TransferScreen';
import RemittanceScreen from './src/screens/RemittanceScreen';

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
    return null; // Add splash screen here
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
                    <Stack.Screen name="Transfer" component={TransferScreen} />
                    <Stack.Screen name="Remittance" component={RemittanceScreen} />
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
