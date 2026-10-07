const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://backend-six-taupe-26.vercel.app/api' : 'http://localhost:5000/api');

export const API_ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/health`,
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    ME: `${API_BASE_URL}/auth/me`
  },
  PRODUCTS: {
    BASE: `${API_BASE_URL}/products`,
    BY_ID: (id) => `${API_BASE_URL}/products/${id}`
  },
  CUSTOMERS: {
    BASE: `${API_BASE_URL}/customers`,
    BY_ID: (id) => `${API_BASE_URL}/customers/${id}`
  },
  USERS: {
    BASE: `${API_BASE_URL}/users`,
    BY_ID: (id) => `${API_BASE_URL}/users/${id}`
  },
  RECEIPTS: {
    BASE: `${API_BASE_URL}/receipts`,
    BY_ID: (id) => `${API_BASE_URL}/receipts/${id}`
  },
  VOUCHERS: {
    BASE: `${API_BASE_URL}/vouchers`,
    BY_ID: (id) => `${API_BASE_URL}/vouchers/${id}`
  },
  RTN_PAYMENTS: {
    BASE: `${API_BASE_URL}/rtn-payments`,
    BY_ID: (id) => `${API_BASE_URL}/rtn-payments/${id}`
  },
  DELIVERY_CHALLANS: {
    BASE: `${API_BASE_URL}/delivery-challans`,
    BY_ID: (id) => `${API_BASE_URL}/delivery-challans/${id}`
  },
  BOOKING_ORDERS: {
    BASE: `${API_BASE_URL}/booking-orders`,
    BY_ID: (id) => `${API_BASE_URL}/booking-orders/${id}`
  },
  DIRECT_STOCK: {
    BASE: `${API_BASE_URL}/direct-stock`,
    BY_ID: (id) => `${API_BASE_URL}/direct-stock/${id}`
  },
  REPORTS: {
    CURRENT_STOCK: `${API_BASE_URL}/reports/current-stock`,
    DAY_BOOK: `${API_BASE_URL}/reports/day-book`,
    ANALYTICS: `${API_BASE_URL}/reports/analytics`
  }
};

