import React, { useState, useEffect, useCallback } from 'react';
import { customerService } from '../services/customerService';

export const CustomerSearchSelect = ({ 
  selectedCustomerName, 
  onSelectCustomer, 
  customerList: propCustomerList, 
  setCustomerList: propSetCustomerList 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalList, setInternalList] = useState(() => customerService.getStoredCustomers());

  const activeCustomerList = propCustomerList && propCustomerList.length > 0 ? propCustomerList : internalList;

  const loadCustomers = useCallback(async () => {
    const list = await customerService.getAllCustomers();
    setInternalList(list);
    if (propSetCustomerList) propSetCustomerList(list);
  }, [propSetCustomerList]);

  useEffect(() => {
    loadCustomers();
    window.addEventListener('customerUpdated', loadCustomers);
    window.addEventListener('storage', loadCustomers);
    return () => {
      window.removeEventListener('customerUpdated', loadCustomers);
      window.removeEventListener('storage', loadCustomers);
    };
  }, [loadCustomers]);

  const filtered = activeCustomerList.filter((c) =>
    !selectedCustomerName || c.name.toLowerCase().includes(selectedCustomerName.toLowerCase())
  );

  // Check if the current value is an exact match — no need to show dropdown
  const isExactMatch = activeCustomerList.some(
    (c) => c.name.toLowerCase() === (selectedCustomerName || '').toLowerCase()
  );

  return (
    <div style={{ position: 'relative' }}>
      <fieldset className="outlined-fieldset">
        <legend className="outlined-legend">Customer Name</legend>
        <input
          type="text"
          value={selectedCustomerName}
          placeholder="Type customer name..."
          className="outlined-input"
          autoComplete="off"
          onChange={(e) => {
            onSelectCustomer({ name: e.target.value });
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        />
      </fieldset>

      {isOpen && !isExactMatch && filtered.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 50,
          backgroundColor: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
          marginTop: '4px',
          maxHeight: '220px',
          overflowY: 'auto'
        }}>
          {filtered.map((cust) => (
            <div
              key={cust.id || cust.name}
              onMouseDown={() => {
                onSelectCustomer(cust);
                setIsOpen(false);
              }}
              style={{ padding: '0.65rem 1rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
            >
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a' }}>{cust.name}</div>
              {(cust.city || cust.mob) && (
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>
                  {cust.city && `City: ${cust.city}`}{cust.mob && `  Mob: ${cust.mob}`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
