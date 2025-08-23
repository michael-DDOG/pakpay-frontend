// services/biometricService.js
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });

class BiometricService {
  // Check if biometrics are available
  static async isBiometricAvailable() {
    try {
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      
      if (available) {
        let type = 'Biometric';
        if (biometryType === BiometryTypes.TouchID) {
          type = 'Touch ID';
        } else if (biometryType === BiometryTypes.FaceID) {
          type = 'Face ID';
        } else if (biometryType === BiometryTypes.Biometrics) {
          type = 'Fingerprint';
        }
        
        return {
          available: true,
          type
        };
      }
      
      return { available: false, type: null };
    } catch (error) {
      console.error('Biometric check error:', error);
      return { available: false, type: null };
    }
  }

  // Enable biometric authentication
  static async enableBiometric(userId, pin) {
    try {
      const { available } = await this.isBiometricAvailable();
      
      if (!available) {
        throw new Error('Biometric authentication not available on this device');
      }

      // Generate a unique key for this user
      const { publicKey } = await rnBiometrics.createKeys();
      
      // Store credentials securely
      await Keychain.setInternetCredentials(
        'pakpay.biometric',
        userId.toString(),
        pin,
        {
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          authenticatePrompt: 'Authenticate to save your credentials',
          authenticationPrompt: {
            title: 'Save Credentials',
            subtitle: 'Allow PakPay to save your login credentials',
            description: 'Your PIN will be stored securely and can only be accessed with your biometric',
            cancel: 'Cancel'
          }
        }
      );

      // Save biometric preference
      await AsyncStorage.setItem('biometric_enabled', 'true');
      await AsyncStorage.setItem('biometric_user_id', userId.toString());
      await AsyncStorage.setItem('biometric_public_key', publicKey);

      return {
        success: true,
        message: 'Biometric authentication enabled successfully'
      };
    } catch (error) {
      console.error('Enable biometric error:', error);
      throw error;
    }
  }

  // Authenticate with biometric
  static async authenticateWithBiometric() {
    try {
      const biometricEnabled = await AsyncStorage.getItem('biometric_enabled');
      
      if (biometricEnabled !== 'true') {
        throw new Error('Biometric authentication not enabled');
      }

      // Prompt for biometric
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: 'Authenticate to login',
        cancelButtonText: 'Use PIN',
        fallbackPromptMessage: 'Use your device passcode'
      });

      if (!success) {
        throw new Error('Biometric authentication failed');
      }

      // Retrieve stored credentials
      const userId = await AsyncStorage.getItem('biometric_user_id');
      const credentials = await Keychain.getInternetCredentials('pakpay.biometric');

      if (credentials && credentials.username === userId) {
        return {
          success: true,
          userId: credentials.username,
          pin: credentials.password
        };
      }

      throw new Error('Could not retrieve stored credentials');
    } catch (error) {
      console.error('Biometric auth error:', error);
      throw error;
    }
  }

  // Disable biometric authentication
  static async disableBiometric() {
    try {
      await rnBiometrics.deleteKeys();
      await Keychain.resetInternetCredentials('pakpay.biometric');
      await AsyncStorage.removeItem('biometric_enabled');
      await AsyncStorage.removeItem('biometric_user_id');
      await AsyncStorage.removeItem('biometric_public_key');

      return {
        success: true,
        message: 'Biometric authentication disabled'
      };
    } catch (error) {
      console.error('Disable biometric error:', error);
      throw error;
    }
  }

  // Verify biometric for sensitive operations
  static async verifyBiometric(promptMessage = 'Authenticate to continue') {
    try {
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage,
        cancelButtonText: 'Cancel',
        fallbackPromptMessage: 'Use your device passcode'
      });

      return success;
    } catch (error) {
      console.error('Verify biometric error:', error);
      return false;
    }
  }
}

export default BiometricService;
