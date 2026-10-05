import React, { useState, useEffect, useRef } from 'react';
import { FileText, Calendar, ChevronDown, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { directStockService } from '../services/directStockService';
import { getTodayDateStr } from '../utils/dateUtils';

const BRAND_MODELS = {
  'ROYAL ENFIELD': [
    'Royal Enfield Classic 350',
    'Royal Enfield Hunter 350',
    'Royal Enfield Meteor 350',
    'Royal Enfield Bullet 350',
    'Royal Enfield Himalayan 450',
    'Royal Enfield Guerrilla 450',
    'Royal Enfield Shotgun 650',
    'Royal Enfield Continental GT 650',
    'Royal Enfield Interceptor 650',
    'Royal Enfield Super Meteor 650'
  ],
  'HONDA': [
    'HONDA DIO 110 STD',
    'HONDA DIO 125 STD',
    'HONDA ACTIVA 6G STD',
    'HONDA ACTIVA 6G DLX',
    'HONDA ACTIVA 125',
    'HONDA SP 125 DISC',
    'HONDA SHINE 125 DISC',
    'HONDA SHINE 100',
    'HONDA UNICORN 160',
    'HONDA HORNET 2.0',
    'HONDA CB350 H\'NESS',
    'HONDA CB350RS'
  ],
  'HERO': [
    'HERO SPLENDOR PLUS',
    'HERO SPLENDOR PLUS XTEC',
    'HERO HF DELUXE',
    'HERO GLAMOUR 125',
    'HERO PASSION PLUS',
    'HERO SUPER SPLENDOR',
    'HERO XTREME 125R',
    'HERO XTREME 160R 4V',
    'HERO XPULSE 200 4V',
    'HERO DESTINI 125',
    'HERO PLEASURE PLUS'
  ]
};

const DEFAULT_BRANDS = ['ROYAL ENFIELD', 'HONDA', 'HERO'];

const getStoredBrands = () => {
  try {
    const b = localStorage.getItem('royalbikes_brands');
    if (b) return JSON.parse(b);
  } catch (e) {}
  return ['ROYAL ENFIELD', 'HONDA', 'HERO'];
};

export const DirectStock = () => {
  const [activeTab, setActiveTab] = useState('entry'); // 'entry' | 'view'
  const [selectedBrand, setSelectedBrand] = useState('ROYAL ENFIELD');
  const [customModel, setCustomModel] = useState('');
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [brandsList, setBrandsList] = useState(getStoredBrands);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [hoveredBrand, setHoveredBrand] = useState(null);

  const handleDeleteBrand = (brandToDelete) => {
    const updated = brandsList.filter(b => b !== brandToDelete);
    setBrandsList(updated);
    localStorage.setItem('royalbikes_brands', JSON.stringify(updated));
    if (selectedBrand === brandToDelete) handleBrandChange(updated[0] || 'ROYAL ENFIELD');
  };

  const getStoredVendors = () => {
    try {
      const v = localStorage.getItem('royalbikes_vendors');
      if (v) return JSON.parse(v);
    } catch (e) {}
    return [
      'ROYAL ENFIELD DISTRIBUTORS',
      'HARDEEP HONDA',
      'HERO MOTOCORP DEALERS',
      'SRI MOTORS',
      'MADRAS MOTORS',
      'RNS MOTORS'
    ];
  };

  const getStoredCustomProducts = () => {
    try {
      const p = localStorage.getItem('royalbikes_custom_products');
      if (p) return JSON.parse(p);
    } catch (e) {}
    return [];
  };

  const [vendorsList, setVendorsList] = useState(() => getStoredVendors().map(v => v.name || v));
  const [customProducts, setCustomProducts] = useState(getStoredCustomProducts);

  const getStoredStocks = () => {
    try {
      const stored = localStorage.getItem('royalbikes_direct_stocks');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  };

  const [stockEntries, setStockEntries] = useState(getStoredStocks);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    organization: 'ROYAL BIKES',
    brand: 'ROYAL ENFIELD',
    date: getTodayDateStr(),
    vendor: 'ROYAL ENFIELD DISTRIBUTORS',
    product: 'Royal Enfield Classic 350',
    quantity: 1,
    engineNumber: '',
    chassisNumber: '',
    color: '',
    notes: ''
  });

  // Filter Input States (Pending)
  const [inputOrgFilter, setInputOrgFilter] = useState('ALL');
  const [inputBrandFilter, setInputBrandFilter] = useState('ALL');
  const [inputFromDate, setInputFromDate] = useState('');
  const [inputToDate, setInputToDate] = useState('');

  // Applied Filter States (Used for table)
  const [appliedOrgFilter, setAppliedOrgFilter] = useState('ALL');
  const [appliedBrandFilter, setAppliedBrandFilter] = useState('ALL');
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Date Picker Refs
  const fromDateRef = useRef(null);
  const toDateRef = useRef(null);

  const openDatePicker = (ref) => {
    if (ref.current) {
      if (typeof ref.current.showPicker === 'function') {
        ref.current.showPicker();
      } else {
        ref.current.focus();
        ref.current.click();
      }
    }
  };

  const loadStockEntries = async () => {
    try {
      const res = await directStockService.getDirectStocks();
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        setStockEntries(res.data);
        localStorage.setItem('royalbikes_direct_stocks', JSON.stringify(res.data));
      }
    } catch (err) {
      console.warn('Error loading direct stock entries from server, using local storage:', err);
    }
  };

  useEffect(() => {
    loadStockEntries();
    const handleVendorSync = () => setVendorsList(getStoredVendors().map(v => v.name || v));
    const handleProductSync = () => setCustomProducts(getStoredCustomProducts());
    window.addEventListener('vendorUpdated', handleVendorSync);
    window.addEventListener('productUpdated', handleProductSync);
    return () => {
      window.removeEventListener('vendorUpdated', handleVendorSync);
      window.removeEventListener('productUpdated', handleProductSync);
    };
  }, []);

  const handleBrandChange = (newBrand) => {
    setSelectedBrand(newBrand);
    setIsCustomModel(false);
    setCustomModel('');
    const defaultProduct = BRAND_MODELS[newBrand] ? BRAND_MODELS[newBrand][0] : '';
    setFormData((prev) => ({
      ...prev,
      brand: newBrand,
      product: defaultProduct,
    }));
  };

  const handleProductChange = (val) => {
    if (val === '__CUSTOM__') {
      setIsCustomModel(true);
      setFormData((prev) => ({ ...prev, product: customModel }));
    } else {
      setIsCustomModel(false);
      setFormData((prev) => ({ ...prev, product: val }));
    }
  };

  const handleCustomModelChange = (val) => {
    setCustomModel(val);
    setFormData((prev) => ({ ...prev, product: val }));
  };

  const handleClear = () => {
    setIsCustomModel(false);
    setCustomModel('');
    setSelectedBrand('ROYAL ENFIELD');
    setFormData({
      organization: 'ROYAL BIKES',
      brand: 'ROYAL ENFIELD',
      date: getTodayDateStr(),
      vendor: 'ROYAL ENFIELD DISTRIBUTORS',
      product: 'Royal Enfield Classic 350',
      quantity: 1,
      engineNumber: '',
      chassisNumber: '',
      color: '',
      notes: ''
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const finalProduct = (formData.product || customModel || '').trim();
    if (!finalProduct || !formData.vendor || !formData.engineNumber || !formData.chassisNumber || !formData.color) {
      alert('Please fill out all required fields marked with *');
      return;
    }

    const parsedQty = parseInt(formData.quantity, 10);
    const validQuantity = !isNaN(parsedQty) && parsedQty > 0 ? parsedQty : 1;

    const payload = {
      ...formData,
      quantity: validQuantity,
      brand: formData.brand || selectedBrand || 'ROYAL ENFIELD',
      product: finalProduct,
      engineNumber: formData.engineNumber.trim(),
      chassisNumber: formData.chassisNumber.trim(),
      engine_number: formData.engineNumber.trim(),
      chassis_number: formData.chassisNumber.trim()
    };

    const newLocalEntry = {
      id: Date.now(),
      ...payload
    };

    // Save to local storage immediately so it is never lost on navigation
    const updatedEntries = [newLocalEntry, ...stockEntries];
    setStockEntries(updatedEntries);
    localStorage.setItem('royalbikes_direct_stocks', JSON.stringify(updatedEntries));
    window.dispatchEvent(new Event('directStockUpdated'));

    try {
      setLoading(true);
      const res = await directStockService.createDirectStock(payload);
      if (res && res.success) {
        loadStockEntries();
      }
    } catch (err) {
      console.warn('Saved locally:', err);
    } finally {
      setLoading(false);
      alert(`Direct Stock Entry for ${payload.brand} (${payload.product}) saved successfully! It is now active under the ${payload.brand} section in the Current Stock Report.`);
      handleClear();
      setActiveTab('view');
    }
  };

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    setAppliedOrgFilter(inputOrgFilter);
    setAppliedBrandFilter(inputBrandFilter);
    setAppliedFromDate(inputFromDate);
    setAppliedToDate(inputToDate);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setInputOrgFilter('ALL');
    setAppliedOrgFilter('ALL');
    setInputBrandFilter('ALL');
    setAppliedBrandFilter('ALL');
    setInputFromDate('');
    setAppliedFromDate('');
    setInputToDate('');
    setAppliedToDate('');
    setCurrentPage(1);
  };

  // Parse helper for dates in DD-MM-YYYY or YYYY-MM-DD format
  const parseEntryDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
      }
      return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    return new Date(dateStr);
  };

  // Filter calculation using APPLIED filters
  const filteredEntries = stockEntries.filter((entry) => {
    // 1. Organization filter
    if (appliedOrgFilter !== 'ALL' && entry.organization !== appliedOrgFilter) {
      return false;
    }

    // 2. Brand filter
    if (appliedBrandFilter !== 'ALL') {
      const entryBrand = (entry.brand || '').toUpperCase();
      const entryProduct = (entry.product || '').toUpperCase();
      let detectedBrand = entryBrand;
      if (!detectedBrand || detectedBrand === 'OTHER') {
        if (entryProduct.includes('HONDA') || entryProduct.includes('ACTIVA') || entryProduct.includes('DIO')) detectedBrand = 'HONDA';
        else if (entryProduct.includes('HERO') || entryProduct.includes('SPLENDOR')) detectedBrand = 'HERO';
        else detectedBrand = 'ROYAL ENFIELD';
      }
      if (detectedBrand !== appliedBrandFilter) {
        return false;
      }
    }

    // 3. FromDate filter
    if (appliedFromDate) {
      const entryDate = parseEntryDate(entry.date);
      const fromDateObj = parseEntryDate(appliedFromDate);
      if (entryDate && fromDateObj && entryDate < fromDateObj) {
        return false;
      }
    }

    // 4. ToDate filter
    if (appliedToDate) {
      const entryDate = parseEntryDate(entry.date);
      const toDateObj = parseEntryDate(appliedToDate);
      if (toDateObj) {
        toDateObj.setHours(23, 59, 59, 999);
      }
      if (entryDate && toDateObj && entryDate > toDateObj) {
        return false;
      }
    }

    return true;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage) || 1;
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getBrandBadgeStyle = (brandName) => {
    const b = (brandName || '').toUpperCase();
    if (b.includes('HONDA')) {
      return { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' };
    }
    if (b.includes('HERO')) {
      return { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' };
    }
    return { bg: '#e0e7ff', color: '#4338ca', border: '#c7d2fe' };
  };

  return (
    <div>
      {/* Title Header */}
      <div className="page-title-header">
        <div className="page-title-icon">
          <FileText size={22} />
        </div>
        <div className="page-title-text">Direct Stock</div>
      </div>

      {/* Tabs Switcher */}
      <div className="karoda-tabs-wrap">
        <button
          className={`karoda-tab ${activeTab === 'entry' ? 'active' : ''}`}
          onClick={() => setActiveTab('entry')}
        >
          Entry
        </button>
        <button
          className={`karoda-tab ${activeTab === 'view' ? 'active' : ''}`}
          onClick={() => setActiveTab('view')}
        >
          View
        </button>
      </div>

      {/* Tab 1: Entry Form */}
      {activeTab === 'entry' && (
        <form onSubmit={handleSave}>
          {/* Brand Quick-Selector Pills */}
          <div style={{ marginBottom: '1.25rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Choose Brand / Manufacturer *
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {brandsList.map((b) => {
                const isSelected = selectedBrand === b;
                const badge = getBrandBadgeStyle(b);
                const isDefault = DEFAULT_BRANDS.includes(b);
                return (
                  <div key={b} style={{ position: 'relative', display: 'inline-flex' }}
                    onMouseEnter={() => setHoveredBrand(b)}
                    onMouseLeave={() => setHoveredBrand(null)}
                  >
                    <button
                      type="button"
                      onClick={() => handleBrandChange(b)}
                      style={{
                        padding: hoveredBrand === b && !isDefault ? '0.55rem 1.8rem 0.55rem 1.4rem' : '0.55rem 1.4rem',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        border: isSelected ? `2px solid ${badge.color}` : '1px solid #cbd5e1',
                        backgroundColor: isSelected ? badge.bg : '#ffffff',
                        color: isSelected ? badge.color : '#64748b',
                        boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {b}
                    </button>
                    {hoveredBrand === b && !isDefault && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeleteBrand(b); }}
                        style={{
                          position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, lineHeight: 1, padding: '2px'
                        }}
                        title={`Remove ${b}`}
                      >✕</button>
                    )}
                  </div>
                );
              })}

              {/* Add Brand inline */}
              {showAddBrand ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Brand name..."
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const name = newBrandName.trim();
                        if (name && !brandsList.includes(name)) {
                          const updated = [...brandsList, name];
                          setBrandsList(updated);
                          localStorage.setItem('royalbikes_brands', JSON.stringify(updated));
                          handleBrandChange(name);
                        }
                        setNewBrandName('');
                        setShowAddBrand(false);
                      }
                      if (e.key === 'Escape') { setShowAddBrand(false); setNewBrandName(''); }
                    }}
                    style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1.5px solid #6366f1', fontSize: '0.85rem', fontWeight: 600, outline: 'none', width: '140px' }}
                  />
                  <button type="button" onClick={() => {
                    const name = newBrandName.trim();
                    if (name && !brandsList.includes(name)) {
                      const updated = [...brandsList, name];
                      setBrandsList(updated);
                      localStorage.setItem('royalbikes_brands', JSON.stringify(updated));
                      handleBrandChange(name);
                    }
                    setNewBrandName(''); setShowAddBrand(false);
                  }} style={{ padding: '0.45rem 0.9rem', borderRadius: '8px', background: '#6366f1', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>Save</button>
                  <button type="button" onClick={() => { setShowAddBrand(false); setNewBrandName(''); }} style={{ padding: '0.45rem 0.7rem', borderRadius: '8px', background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', cursor: 'pointer', fontSize: '0.85rem' }}>✕</button>
                </div>
              ) : (
                <button type="button" onClick={() => setShowAddBrand(true)}
                  style={{ padding: '0.45rem 1rem', borderRadius: '8px', border: '1.5px dashed #6366f1', color: '#6366f1', background: '#f5f3ff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                  + Add
                </button>
              )}
            </div>
          </div>

          <div className="form-grid">
            {/* Brand Dropdown - synced with pill */}
            <fieldset className="outlined-fieldset">
              <legend className="outlined-legend" style={{ color: '#6366f1' }}>Brand / Manufacturer *</legend>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <select
                  value={selectedBrand}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  className="outlined-select"
                >
                  {brandsList.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <ChevronDown size={16} color="#64748b" style={{ pointerEvents: 'none' }} />
              </div>
            </fieldset>

            {/* Select Vendor */}
            <fieldset className="outlined-fieldset">
              <legend className="outlined-legend">Select Vendor *</legend>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <select
                  required
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  className="outlined-select"
                >
                  <option value="">-- Select Vendor --</option>
                  {vendorsList.map((v, idx) => (
                    <option key={idx} value={v}>{v}</option>
                  ))}
                </select>
                <ChevronDown size={16} color="#64748b" style={{ pointerEvents: 'none' }} />
              </div>
            </fieldset>

            {/* Product / Model - shows brand models + custom option */}
            <fieldset className="outlined-fieldset">
              <legend className="outlined-legend" style={{ color: '#6366f1' }}>Product / Model ({selectedBrand}) *</legend>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <select
                  required
                  value={isCustomModel ? '__CUSTOM__' : formData.product}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="outlined-select"
                >
                  <option value="">-- Select {selectedBrand} Model --</option>
                  {(BRAND_MODELS[selectedBrand] || []).map((m, idx) => (
                    <option key={idx} value={m}>{m}</option>
                  ))}
                  {/* Custom products added via Navbar for this brand */}
                  {customProducts.filter(p => (p.brand || '').toUpperCase() === selectedBrand.toUpperCase()).map((p, idx) => (
                    <option key={`cp-${idx}`} value={p.name}>{p.name}</option>
                  ))}
                  <option value="__CUSTOM__">-- Add / Enter Custom Model --</option>
                </select>
                <ChevronDown size={16} color="#64748b" style={{ pointerEvents: 'none' }} />
              </div>
            </fieldset>

            {/* Custom Model Input */}
            {isCustomModel && (
              <fieldset className="outlined-fieldset">
                <legend className="outlined-legend" style={{ color: '#6366f1' }}>Enter Custom Model Name *</legend>
                <input
                  type="text"
                  required
                  placeholder={`e.g. ${selectedBrand} Special Edition`}
                  value={customModel}
                  onChange={(e) => handleCustomModelChange(e.target.value)}
                  className="outlined-input"
                />
              </fieldset>
            )}

            {/* Select Organization - ROYAL BIKES only */}
            <fieldset className="outlined-fieldset">
              <legend className="outlined-legend">Select Organization</legend>
              <input
                type="text"
                className="outlined-input"
                value="ROYAL BIKES"
                readOnly
                style={{ color: '#475569', fontWeight: 600 }}
              />
            </fieldset>

            {/* Date */}
            <fieldset className="outlined-fieldset">
              <legend className="outlined-legend">Date</legend>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <input
                  type="text"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="outlined-input"
                />
                <Calendar size={18} color="#64748b" />
              </div>
            </fieldset>

            {/* Quantity */}
            <fieldset className="outlined-fieldset">
              <legend className="outlined-legend">Quantity</legend>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="outlined-input"
                />
                <ChevronDown size={16} color="#64748b" />
              </div>
            </fieldset>

            {/* Engine Number, Chassis Number, Color */}
            <div className="form-grid-full form-grid-3">
              <fieldset className="outlined-fieldset">
                <legend className="outlined-legend" style={{ color: '#6366f1' }}>Engine Number *</legend>
                <input
                  type="text"
                  required
                  placeholder="e.g. ME4JD254..."
                  value={formData.engineNumber}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => ({ ...prev, engineNumber: val }));
                    if (val.trim().length >= 4) {
                      const stocks = getStoredStocks();
                      const match = stocks.find((s) =>
                        (s.engineNumber || s.engine_number || '').toLowerCase().includes(val.toLowerCase())
                      );
                      if (match) {
                        setFormData((prev) => ({
                          ...prev,
                          engineNumber: val,
                          chassisNumber: match.chassisNumber || match.chassis_number || prev.chassisNumber,
                          color: match.color || prev.color,
                        }));
                      }
                    }
                  }}
                  className="outlined-input"
                />
              </fieldset>

              <fieldset className="outlined-fieldset">
                <legend className="outlined-legend" style={{ color: '#6366f1' }}>Chassis Number *</legend>
                <input
                  type="text"
                  required
                  placeholder="e.g. MD625..."
                  value={formData.chassisNumber}
                  onChange={(e) => setFormData({ ...formData, chassisNumber: e.target.value })}
                  className="outlined-input"
                />
              </fieldset>

              <fieldset className="outlined-fieldset">
                <legend className="outlined-legend" style={{ color: '#6366f1' }}>Color *</legend>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stealth Black / Pearl Siren Blue"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="outlined-input"
                />
              </fieldset>
            </div>

            {/* Notes */}
            <fieldset className="outlined-fieldset form-grid-full">
              <legend className="outlined-legend" style={{ color: '#6366f1' }}>Notes</legend>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="outlined-textarea"
                placeholder="Additional vehicle notes or remarks (optional)"
              ></textarea>
            </fieldset>
          </div>

          {/* Action Buttons */}
          <div className="form-actions-row">
            <button type="submit" className="btn-save-pill" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={handleClear} className="btn-clear-link">
              Clear
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: View Records */}
      {activeTab === 'view' && (
        <div>
          {/* View Bar Filters: Organization, Brand, FromDate, ToDate & Submit */}
          <form onSubmit={handleApplyFilters} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            {/* Organization Filter */}
            <div style={{ flex: 1, minWidth: '180px' }}>
              <fieldset className="outlined-fieldset">
                <legend className="outlined-legend">Organization</legend>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <select
                    value={inputOrgFilter}
                    onChange={(e) => setInputOrgFilter(e.target.value)}
                    className="outlined-select"
                  >
                    <option value="ALL">ALL ORGS</option>
                    <option value="ROYAL BIKES">ROYAL BIKES</option>
                    <option value="ROYAL MOTORS">ROYAL MOTORS</option>
                  </select>
                  <ChevronDown size={16} color="#64748b" style={{ pointerEvents: 'none' }} />
                </div>
              </fieldset>
            </div>

            {/* Brand Filter */}
            <div style={{ flex: 1, minWidth: '180px' }}>
              <fieldset className="outlined-fieldset">
                <legend className="outlined-legend">Brand</legend>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <select
                    value={inputBrandFilter}
                    onChange={(e) => setInputBrandFilter(e.target.value)}
                    className="outlined-select"
                  >
                    <option value="ALL">ALL BRANDS</option>
                    <option value="ROYAL ENFIELD">ROYAL ENFIELD</option>
                    <option value="HONDA">HONDA</option>
                    <option value="HERO">HERO</option>
                  </select>
                  <ChevronDown size={16} color="#64748b" style={{ pointerEvents: 'none' }} />
                </div>
              </fieldset>
            </div>

            {/* Modern FromDate Filter */}
            <div style={{ flex: 1, minWidth: '160px' }}>
              <fieldset
                className="modern-date-fieldset"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                onClick={() => openDatePicker(fromDateRef)}
              >
                <legend className="outlined-legend">FromDate</legend>
                <input
                  type="text"
                  value={inputFromDate}
                  onChange={(e) => setInputFromDate(e.target.value)}
                  className="outlined-input"
                  style={{ cursor: 'pointer', fontWeight: 500, color: '#1e293b' }}
                  placeholder="DD-MM-YYYY"
                />
                <div className="calendar-icon-badge">
                  <Calendar size={15} />
                </div>
                <input
                  type="date"
                  ref={fromDateRef}
                  onChange={(e) => {
                    if (e.target.value) {
                      const [y, m, d] = e.target.value.split('-');
                      setInputFromDate(`${d}-${m}-${y}`);
                    }
                  }}
                  style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                />
              </fieldset>
            </div>

            {/* Modern ToDate Filter */}
            <div style={{ flex: 1, minWidth: '160px' }}>
              <fieldset
                className="modern-date-fieldset"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                onClick={() => openDatePicker(toDateRef)}
              >
                <legend className="outlined-legend">ToDate</legend>
                <input
                  type="text"
                  value={inputToDate}
                  onChange={(e) => setInputToDate(e.target.value)}
                  className="outlined-input"
                  style={{ cursor: 'pointer', fontWeight: 500, color: '#1e293b' }}
                  placeholder="DD-MM-YYYY"
                />
                <div className="calendar-icon-badge">
                  <Calendar size={15} />
                </div>
                <input
                  type="date"
                  ref={toDateRef}
                  onChange={(e) => {
                    if (e.target.value) {
                      const [y, m, d] = e.target.value.split('-');
                      setInputToDate(`${d}-${m}-${y}`);
                    }
                  }}
                  style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                />
              </fieldset>
            </div>

            {/* Submit Filter Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="submit"
                className="btn-save-pill"
                style={{ padding: '0.55rem 1.75rem', fontSize: '0.9rem' }}
              >
                Submit
              </button>

              {/* Reset/Clear Button */}
              {(appliedOrgFilter !== 'ALL' || appliedBrandFilter !== 'ALL' || appliedFromDate !== '' || appliedToDate !== '' || inputOrgFilter !== 'ALL' || inputBrandFilter !== 'ALL' || inputFromDate !== '' || inputToDate !== '') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="btn-clear-link"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <RotateCcw size={15} /> Clear
                </button>
              )}
            </div>
          </form>

          {/* Table Card */}
          <div className="table-card">
            <div className="table-responsive">
              <table className="karoda-table">
                <thead>
                  <tr>
                    <th>Organization</th>
                    <th>Brand</th>
                    <th>Date</th>
                    <th>Vendor</th>
                    <th>Product & Vehicle Details</th>
                    <th>Qty</th>
                    <th>Color</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEntries.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                        No direct stock records found for the selected date range and filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedEntries.map((entry) => {
                      const brandName = entry.brand || (
                        (entry.product || '').toUpperCase().includes('HONDA') ? 'HONDA' :
                        (entry.product || '').toUpperCase().includes('HERO') ? 'HERO' : 'ROYAL ENFIELD'
                      );
                      const badge = getBrandBadgeStyle(brandName);

                      return (
                        <tr key={entry.id}>
                          <td><strong>{entry.organization}</strong></td>
                          <td>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                              letterSpacing: '0.03em'
                            }}>
                              {brandName}
                            </span>
                          </td>
                          <td>{entry.date}</td>
                          <td>{entry.vendor}</td>
                          <td>
                            <div style={{ color: '#6366f1', fontWeight: 600, fontSize: '0.95rem' }}>{entry.product}</div>
                            <div style={{ marginTop: '0.35rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                backgroundColor: '#e0e7ff',
                                color: '#3730a3',
                                fontSize: '0.75rem',
                                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                                fontWeight: 500,
                                padding: '0.2rem 0.55rem',
                                borderRadius: '4px',
                                border: '1px solid #c7d2fe'
                              }}>
                                <strong style={{ fontWeight: 600, color: '#4338ca' }}>Engine No:</strong> {entry.engineNumber || 'N/A'}
                              </span>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                backgroundColor: '#f1f5f9',
                                color: '#334155',
                                fontSize: '0.75rem',
                                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                                fontWeight: 500,
                                padding: '0.2rem 0.55rem',
                                borderRadius: '4px',
                                border: '1px solid #cbd5e1'
                              }}>
                                <strong style={{ fontWeight: 600, color: '#475569' }}>Chassis No:</strong> {entry.chassisNumber || 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td><strong>{entry.quantity || 1}</strong></td>
                          <td>{entry.color}</td>
                          <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{entry.notes || '-'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <div className="table-pagination-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Items per page: <strong>10</strong></span>
              </div>

              <div>
                {filteredEntries.length > 0
                  ? `${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filteredEntries.length)} of ${filteredEntries.length}`
                  : '0 of 0'}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button
                  type="button"
                  className="page-nav-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={18} />
                </button>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, margin: '0 0.4rem' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  className="page-nav-btn"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
