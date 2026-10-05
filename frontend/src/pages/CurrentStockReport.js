import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Search, FileText, ShoppingBag, Pencil, Trash2, Check, X } from 'lucide-react';
import { reportService } from '../services/reportService';
import { getTodayDateStr } from '../utils/dateUtils';

export const CurrentStockReport = () => {
  const [asOnDate, setAsOnDate] = useState(getTodayDateStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockData, setStockData] = useState({});
  const [selectedProduct, setSelectedProduct] = useState('');
  const [editingRow, setEditingRow] = useState(null); // { engine_number, fields }

  const saveToLocalStorage = (updatedEntries) => {
    localStorage.setItem('royalbikes_direct_stocks', JSON.stringify(updatedEntries));
    window.dispatchEvent(new Event('directStockUpdated'));
  };

  const getRawEntries = () => {
    try {
      const stored = localStorage.getItem('royalbikes_direct_stocks');
      return stored ? JSON.parse(stored) : [];
    } catch (e) { return []; }
  };

  const handleDeleteRow = (engine_number) => {
    if (!window.confirm('Are you sure you want to delete this stock entry?')) return;
    const updated = getRawEntries().filter(e =>
      (e.engineNumber || e.engine_number || '') !== engine_number
    );
    saveToLocalStorage(updated);
    loadStockReport();
  };

  const handleSaveEdit = () => {
    const updated = getRawEntries().map(e => {
      if ((e.engineNumber || e.engine_number || '') === editingRow.engine_number) {
        return { ...e, product: editingRow.model, color: editingRow.color, engineNumber: editingRow.engine_number, engine_number: editingRow.engine_number, chassisNumber: editingRow.chassis_number, chassis_number: editingRow.chassis_number };
      }
      return e;
    });
    saveToLocalStorage(updated);
    setEditingRow(null);
    loadStockReport();
  };

  // Collect all unique product names across all brands
  const allProducts = [...new Set(
    Object.values(stockData).flat().map(i => i.model).filter(Boolean)
  )].sort();

  const groupStockEntries = (entries) => {
    const grouped = {};
    entries.forEach((item) => {
      const model = (item.product || item.model || '').trim();
      const vendor = (item.vendor || '').trim();
      const color = (item.color || '').trim();
      const engine_no = (item.engineNumber || item.engine_number || '').trim();
      const chassis_no = (item.chassisNumber || item.chassis_number || '').trim();

      const raw_brand = (item.brand || '').trim().toUpperCase();
      const model_upper = model.toUpperCase();
      const vendor_upper = vendor.toUpperCase();

      let brand = 'OTHER';
      if (raw_brand && ['HONDA', 'HERO', 'ROYAL ENFIELD', 'YAMAHA', 'TVS', 'SUZUKI', 'BAJAJ'].includes(raw_brand)) {
        brand = raw_brand;
      } else if (model_upper.includes('HONDA') || vendor_upper.includes('HONDA') || model_upper.includes('DIO') || model_upper.includes('ACTIVA')) {
        brand = 'HONDA';
      } else if (model_upper.includes('HERO') || vendor_upper.includes('HERO') || model_upper.includes('SPLENDOR') || model_upper.includes('HF DELUXE')) {
        brand = 'HERO';
      } else if (
        ['ROYAL ENFIELD', 'CLASSIC', 'HUNTER', 'METEOR', 'BULLET', 'HIMALAYAN', 'INTERCEPTOR', 'CONTINENTAL', 'GUERRILLA', 'SHOTGUN'].some((k) => model_upper.includes(k)) ||
        vendor_upper.includes('ENFIELD')
      ) {
        brand = 'ROYAL ENFIELD';
      } else if (model_upper.includes('YAMAHA') || vendor_upper.includes('YAMAHA')) {
        brand = 'YAMAHA';
      } else if (model_upper.includes('TVS') || vendor_upper.includes('TVS')) {
        brand = 'TVS';
      } else if (model_upper.includes('SUZUKI') || vendor_upper.includes('SUZUKI')) {
        brand = 'SUZUKI';
      } else if (model_upper.includes('BAJAJ') || vendor_upper.includes('BAJAJ')) {
        brand = 'BAJAJ';
      } else if (raw_brand) {
        brand = raw_brand;
      } else {
        brand = vendor_upper && vendor_upper !== 'ALL' ? vendor_upper : 'OTHER';
      }

      if (!grouped[brand]) grouped[brand] = [];
      grouped[brand].push({
        model,
        color,
        engine_number: engine_no,
        chassis_number: chassis_no,
        vendor,
        date: item.date
      });
    });

    const ordered = {};
    ['HONDA', 'HERO', 'ROYAL ENFIELD'].forEach((b) => {
      if (grouped[b]) ordered[b] = grouped[b];
    });
    Object.keys(grouped).forEach((b) => {
      if (!ordered[b]) ordered[b] = grouped[b];
    });
    return ordered;
  };

  const loadStockReport = useCallback(async () => {
    try {
      const res = await reportService.getCurrentStockReport({ as_on_date: asOnDate, search: searchQuery });
      if (res && res.success && res.data && Object.keys(res.data).length > 0) {
        setStockData(res.data);
        return;
      }
    } catch (err) {
      console.warn('API fetch returned error, fallback to local storage:', err);
    }

    // Fallback/Merge with stored Direct Stock entries
    try {
      const stored = localStorage.getItem('royalbikes_direct_stocks');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStockData(groupStockEntries(parsed));
          return;
        }
      }
    } catch (e) {}
  }, [asOnDate, searchQuery]);

  useEffect(() => {
    loadStockReport();

    // Re-fetch automatically whenever direct stock is updated in another tab or page
    const handleUpdate = () => loadStockReport();
    window.addEventListener('directStockUpdated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    return () => {
      window.removeEventListener('directStockUpdated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, [loadStockReport]);

  return (
    <div>
      {/* Title Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem' }}>
        <div className="page-title-icon">
          <FileText size={22} />
        </div>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Current Stock Report
        </h2>
      </div>

      {/* Top Filter & Search Control Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        {/* As On Date Field */}
        <div style={{ width: '240px' }}>
          <fieldset className="outlined-fieldset" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <legend className="outlined-legend">As On Date</legend>
            <input
              type="text"
              value={asOnDate}
              onChange={(e) => setAsOnDate(e.target.value)}
              className="outlined-input"
            />
            <Calendar size={18} color="#64748b" />
          </fieldset>
        </div>

        {/* PDF Export Button */}
        <button
          type="button"
          onClick={() => window.print()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.65rem 1.25rem',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '9999px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            fontWeight: 600,
            fontSize: '0.85rem',
            color: '#475569'
          }}
        >
          <div style={{ backgroundColor: '#ef4444', color: '#ffffff', fontSize: '0.65rem', fontWeight: 800, padding: '1px 4px', borderRadius: '3px' }}>
            PDF
          </div>
        </button>

        {/* Product Dropdown Filter */}
        <div style={{ minWidth: '220px' }}>
          <fieldset className="outlined-fieldset">
            <legend className="outlined-legend">Product / Model</legend>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="outlined-select"
              style={{ cursor: 'pointer' }}
            >
              <option value="">All Products</option>
              {allProducts.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </fieldset>
        </div>

        {/* Search Input Box */}
        <div style={{ flex: 1, maxWidth: '360px', minWidth: '220px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '0.6rem 0.85rem'
          }}>
            <Search size={18} color="#64748b" />
            <input
              type="text"
              placeholder="Type here to search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem', color: '#0f172a' }}
            />
          </div>
        </div>
      </div>

      {/* Brand Stock Tables */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {Object.keys(stockData).length === 0 ? (
          <div className="table-card" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
            <FileText size={36} color="#cbd5e1" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#64748b' }}>No vehicles in Current Stock</div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Enter new vehicles in <strong>Direct-Stock</strong> to view live inventory here.</div>
          </div>
        ) : (
          Object.entries(stockData).map(([brand, items]) => {
          const filteredItems = items.filter((item) => {
            const matchesSearch = !searchQuery ||
              item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.engine_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.chassis_number.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesProduct = !selectedProduct || item.model === selectedProduct;
            return matchesSearch && matchesProduct;
          });

          if (filteredItems.length === 0) return null;

          const totalStock = filteredItems.length;

          return (
            <div key={brand}>
              {/* Brand Title + Total Stock Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#6366f1', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {brand}
                </h3>
                <span style={{
                  backgroundColor: '#e0e7ff',
                  color: '#3730a3',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.65rem',
                  borderRadius: '999px',
                  border: '1px solid #c7d2fe'
                }}>
                  Total Stock: {totalStock}
                </span>
              </div>

              {/* Table */}
              <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#ffffff' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#000099', color: '#ffffff' }}>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.9rem', width: '5%' }}>#</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.9rem', width: '25%' }}>Model</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.9rem', width: '13%' }}>Color</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.9rem', width: '22%' }}>Engine Number</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.9rem', width: '25%' }}>Chassis Number</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, fontSize: '0.9rem', width: '10%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((row, idx) => {
                      const isEditing = editingRow && editingRow.engine_number === row.engine_number;
                      return (
                        <tr key={idx} style={{ borderBottom: idx === filteredItems.length - 1 ? 'none' : '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                          <td style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600 }}>{idx + 1}</td>
                          <td style={{ padding: '0.5rem 1rem', fontWeight: 700, color: '#1e293b', fontSize: '0.88rem' }}>
                            {isEditing ? <input value={editingRow.model} onChange={e => setEditingRow(p => ({ ...p, model: e.target.value }))} style={{ width: '100%', padding: '0.3rem 0.5rem', borderRadius: '5px', border: '1px solid #6366f1', fontSize: '0.85rem' }} /> : row.model}
                          </td>
                          <td style={{ padding: '0.5rem 1rem', fontWeight: 600, color: '#475569', fontSize: '0.88rem' }}>
                            {isEditing ? <input value={editingRow.color} onChange={e => setEditingRow(p => ({ ...p, color: e.target.value }))} style={{ width: '100%', padding: '0.3rem 0.5rem', borderRadius: '5px', border: '1px solid #6366f1', fontSize: '0.85rem' }} /> : row.color}
                          </td>
                          <td style={{ padding: '0.5rem 1rem', fontWeight: 600, color: '#334155', fontSize: '0.88rem', fontFamily: 'monospace' }}>
                            {isEditing ? <input value={editingRow.engine_number} onChange={e => setEditingRow(p => ({ ...p, engine_number: e.target.value }))} style={{ width: '100%', padding: '0.3rem 0.5rem', borderRadius: '5px', border: '1px solid #6366f1', fontSize: '0.85rem', fontFamily: 'monospace' }} /> : row.engine_number}
                          </td>
                          <td style={{ padding: '0.5rem 1rem', fontWeight: 600, color: '#334155', fontSize: '0.88rem', fontFamily: 'monospace' }}>
                            {isEditing ? <input value={editingRow.chassis_number} onChange={e => setEditingRow(p => ({ ...p, chassis_number: e.target.value }))} style={{ width: '100%', padding: '0.3rem 0.5rem', borderRadius: '5px', border: '1px solid #6366f1', fontSize: '0.85rem', fontFamily: 'monospace' }} /> : row.chassis_number}
                          </td>
                          <td style={{ padding: '0.5rem 1rem', textAlign: 'center' }}>
                            {isEditing ? (
                              <div style={{ display: 'inline-flex', gap: '0.3rem' }}>
                                <button type="button" onClick={handleSaveEdit} style={{ background: '#6366f1', border: 'none', borderRadius: '5px', padding: '4px 8px', cursor: 'pointer', color: '#fff' }} title="Save"><Check size={14} /></button>
                                <button type="button" onClick={() => setEditingRow(null)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '5px', padding: '4px 8px', cursor: 'pointer', color: '#64748b' }} title="Cancel"><X size={14} /></button>
                              </div>
                            ) : (
                              <div style={{ display: 'inline-flex', gap: '0.3rem' }}>
                                <button type="button" onClick={() => setEditingRow({ ...row })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', padding: '4px' }} title="Edit"><Pencil size={15} /></button>
                                <button type="button" onClick={() => handleDeleteRow(row.engine_number)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }} title="Delete"><Trash2 size={15} /></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Brand Total Footer Row */}
                  <tfoot>
                    <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                      <td colSpan={5} style={{ padding: '0.6rem 1rem', fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>
                        Total {brand} Stock
                      </td>
                      <td style={{ padding: '0.6rem 1rem', fontWeight: 800, color: '#3730a3', fontSize: '0.9rem' }}>
                        {totalStock} unit{totalStock !== 1 ? 's' : ''}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          );
        }))}
      </div>

      {/* Page Bottom Footer Banner */}
      <div className="page-footer-banner" style={{ marginTop: '2.5rem' }}>
        <div className="badge-gst-software">
          <ShoppingBag size={16} />
          <span>GST Billing Software</span>
        </div>
        <div className="footer-copyright-text">
          Copyright ©2026 All rights reserved
        </div>
      </div>
    </div>
  );
};
