// src/services/walletService.js
import api from './api';

export const walletService = {
  getBalance: async () => {
    try {
      const response = await api.get('/wallet/balance');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getTransactions: async (limit = 10, offset = 0) => {
    try {
      const response = await api.get('/wallet/transactions', {
        params: { limit, offset }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};
