// src/services/authService.js
import api from './api';

export const authService = {
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  sendOTP: async (phoneNumber) => {
    // Mock OTP sending - replace with actual SMS service
    console.log('Sending OTP to:', phoneNumber);
    return { success: true, message: 'OTP sent' };
  },

  verifyOTP: async (phoneNumber, otp) => {
    // Mock OTP verification - replace with actual verification
    console.log('Verifying OTP:', otp);
    return { success: true, verified: true };
  }
};
