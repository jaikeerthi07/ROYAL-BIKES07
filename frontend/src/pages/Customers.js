import React, { useState } from 'react';
import { UserPlus, Search, Phone, Mail, MapPin, Trash2 } from 'lucide-react';
import { customerService } from '../services/customerService';
import { useFetch } from '../hooks/useFetch';
import { API_ENDPOINTS } from '../constants/apiEndpoints';
import { Modal } from '../components/Modal';
import { Loader } from '../components/Loader';
import { CUSTOMER_STATUS } from '../constants/appConstants';
import { formatDate } from '../utils/formatters';

export const Customers = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    account_code: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    status: 'active'
  });

  const queryParams = {};
  if (search) queryParams.search = search;
  if (status) queryParams.status = status;

  const { data: customers, loading, refetch } = useFetch(
    `${API_ENDPOINTS.CUSTOMERS.BASE}?${new URLSearchParams(queryParams).toString()}`
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await customerService.createCustomer(formData);
      if (res.success) {
        setIsAddModalOpen(false);
        setFormData({ name: '', account_code: '', email: '', phone: '', address: '', notes: '', status: 'active' });
        refetch();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this customer record?')) {
      try {
        await customerService.deleteCustomer(id);
        refetch();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Customer CRM</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage client profiles, contact history, and sales prospects.</p>
        </div>

        <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
          <UserPlus size={18} /> Add New Customer
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="form-input"
          style={{ width: '180px' }}
        >
          <option value="">All Statuses</option>
          {CUSTOMER_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Customer List */}
      {loading ? (
        <Loader message="Loading customer CRM records..." />
      ) : (
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Acct Code</th>
                  <th>Client Name</th>
                  <th>Contact Info</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Added Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers?.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No customer records found.
                    </td>
                  </tr>
                ) : (
                  customers?.map((customer) => (
                    <tr key={customer.id}>
                      <td><strong>{customer.account_code || '-'}</strong></td>
                      <td><strong>{customer.name}</strong></td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {customer.phone}</span>
                          {customer.email && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-subtle)' }}><Mail size={12} /> {customer.email}</span>}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{customer.address || 'N/A'}</td>
                      <td>
                        <span className={`badge ${customer.status === 'active' ? 'badge-green' : customer.status === 'lead' ? 'badge-gold' : 'badge-red'}`}>
                          {customer.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-subtle)' }}>{formatDate(customer.created_at)}</td>
                      <td>
                        <button onClick={() => handleDelete(customer.id)} className="btn btn-danger" style={{ padding: '0.35rem 0.5rem' }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register Customer Record">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Account Code</label>
              <input
                type="text"
                value={formData.account_code}
                onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                className="form-input"
                placeholder="e.g. 2917"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="form-input"
            >
              {CUSTOMER_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Notes / Vehicle Inquiry</label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="form-input"
            ></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Save Client</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
