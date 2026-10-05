import { fetchWithAuth } from './api';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

const DEFAULT_CUSTOMERS = [
  { id: 1, name: 'BALAJI PANNER SELVAM', account_code: '2917', city: 'CHENNAI', mob: '9941220484', phone: '9941220484', address: '12, Anna Nagar, Chennai - 600040' },
  { id: 2, name: 'G . RAMESH GANDHI', account_code: '2918', city: 'CHENNAI', mob: '9791734097', phone: '9791734097', address: '45, Gandhi Road, Chennai - 600011' },
  { id: 3, name: 'KEERTHANA', account_code: '2919', city: 'CHENNAI', mob: '9876543210', phone: '9876543210', address: '78, KK Nagar, Chennai - 600078' },
  { id: 4, name: 'SURESH KUMAR', account_code: '2920', city: 'CHENNAI', mob: '9840897744', phone: '9840897744', address: '34, Velachery Main Rd, Chennai - 600042' },
  { id: 5, name: 'VP GI BOOMIKA', account_code: '2921', city: 'CHENNAI', mob: '9876543210', phone: '9876543210', address: '56, T Nagar, Chennai - 600017' },
  { id: 6, name: 'ARASU GOVINDHU', account_code: '2922', city: 'CHENNAI', mob: '9840897744', phone: '9840897744', address: '89, Perambur, Chennai - 600011' },
  { id: 7, name: 'MOHAMMED SALIM K KADHAR GANI', account_code: '2923', city: 'CHENNAI', mob: '9025784525', phone: '9025784525', address: '23, Triplicane High Rd, Chennai - 600005' }
];

export const customerService = {
  getStoredCustomers() {
    try {
      const stored = localStorage.getItem('royalbikes_customers');
      if (stored) {
        const parsed = JSON.parse(stored);
        // If any customer missing account_code field, clear cache to force fresh fetch
        if (Array.isArray(parsed) && parsed.length > 0 && !('account_code' in parsed[0])) {
          localStorage.removeItem('royalbikes_customers');
          return DEFAULT_CUSTOMERS;
        }
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_CUSTOMERS;
  },

  async getAllCustomers(params = {}) {
    const local = this.getStoredCustomers();
    try {
      const query = new URLSearchParams(params).toString();
      const url = `${API_ENDPOINTS.CUSTOMERS.BASE}${query ? `?${query}` : ''}`;
      const res = await fetchWithAuth(url);
      if (res && res.success && Array.isArray(res.data)) {
        const serverCustomers = res.data.map((c) => ({
          id: c.id,
          name: (c.name || '').toUpperCase(),
          account_code: c.account_code || '',
          city: c.address ? (c.address.split(',')[0] || 'CHENNAI') : 'CHENNAI',
          mob: c.phone || '',
          phone: c.phone || '',
          email: c.email || '',
          address: c.address || '',
          ...c
        }));

        // Merge unique by name or phone
        const map = new Map();
        [...serverCustomers, ...local].forEach((item) => {
          const key = (item.name || '').trim().toUpperCase();
          if (key && !map.has(key)) {
            map.set(key, item);
          }
        });

        const merged = Array.from(map.values());
        // Merge: server account_code takes priority
        const mergedWithCode = merged.map(item => {
          const serverMatch = serverCustomers.find(s => (s.name||'').toUpperCase() === (item.name||'').toUpperCase());
          return serverMatch ? { ...item, account_code: serverMatch.account_code || item.account_code || '' } : item;
        });
        localStorage.setItem('royalbikes_customers', JSON.stringify(mergedWithCode));
        return mergedWithCode;
      }
    } catch (err) {
      console.warn('Using cached customers:', err);
    }
    return local;
  },

  async getCustomers(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = `${API_ENDPOINTS.CUSTOMERS.BASE}${query ? `?${query}` : ''}`;
    return await fetchWithAuth(url);
  },

  async getCustomerById(id) {
    return await fetchWithAuth(API_ENDPOINTS.CUSTOMERS.BY_ID(id));
  },

  async createCustomer(customerData) {
    const firstName = customerData.first_name || customerData.firstName || '';
    const lastName = customerData.last_name || customerData.lastName || '';
    const name = (customerData.name || `${firstName} ${lastName}`).trim().toUpperCase();
    const phone = (customerData.phone || customerData.phone_number || customerData.phoneNumber || customerData.mob || '').trim();
    const city = customerData.town_city || customerData.townCity || customerData.city || 'CHENNAI';
    const account_code = (customerData.account_code || '').trim();

    // Duplicate account code check
    if (account_code) {
      const existing = this.getStoredCustomers();
      const duplicate = existing.find(c => c.account_code && c.account_code.trim() === account_code && (c.name || '').toUpperCase() !== name);
      if (duplicate) {
        return { success: false, error: `Account code ${account_code} is already assigned to ${duplicate.name}` };
      }
    }

    const localEntry = {
      id: Date.now(),
      name,
      account_code,
      city,
      mob: phone,
      phone,
      email: customerData.email || '',
      address: customerData.address || `${customerData.flat_house_no || customerData.flatHouseNo || ''} ${customerData.street_area || customerData.streetArea || ''}, ${city}`.trim()
    };

    // Save locally first so instant feedback happens across tabs
    const current = this.getStoredCustomers();
    const updated = [localEntry, ...current.filter((c) => c.name !== name)];
    localStorage.setItem('royalbikes_customers', JSON.stringify(updated));
    window.dispatchEvent(new Event('customerUpdated'));
    window.dispatchEvent(new Event('storage'));

    try {
      const res = await fetchWithAuth(API_ENDPOINTS.CUSTOMERS.BASE, {
        method: 'POST',
        body: JSON.stringify({
          name,
          phone,
          email: customerData.email || undefined,
          address: localEntry.address,
          ...customerData
        })
      });
      return res && res.success ? res : { success: true, data: localEntry };
    } catch (err) {
      return { success: true, data: localEntry };
    }
  },

  async updateCustomer(id, customerData) {
    return await fetchWithAuth(API_ENDPOINTS.CUSTOMERS.BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(customerData)
    });
  },

  async deleteCustomer(id) {
    const current = this.getStoredCustomers();
    const updated = current.filter((c) => c.id !== id);
    localStorage.setItem('royalbikes_customers', JSON.stringify(updated));
    window.dispatchEvent(new Event('customerUpdated'));
    return await fetchWithAuth(API_ENDPOINTS.CUSTOMERS.BY_ID(id), {
      method: 'DELETE'
    });
  }
};

export default customerService;

