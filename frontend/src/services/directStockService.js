import { fetchWithAuth } from './api';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

export const directStockService = {
  async getDirectStocks() {
    return await fetchWithAuth(API_ENDPOINTS.DIRECT_STOCK.BASE);
  },

  async createDirectStock(stockData) {
    return await fetchWithAuth(API_ENDPOINTS.DIRECT_STOCK.BASE, {
      method: 'POST',
      body: JSON.stringify(stockData)
    });
  },

  async deleteDirectStock(id) {
    return await fetchWithAuth(API_ENDPOINTS.DIRECT_STOCK.BY_ID(id), {
      method: 'DELETE'
    });
  }
};
