import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Truck, 
  Home, 
  Calendar, 
  Search, 
  Printer, 
  X, 
  ChevronLeft, 
  ChevronRight,
  ShoppingBag,
  CheckCircle2,
  User,
  Trash2
} from 'lucide-react';
import { deliveryChallanService } from '../services/deliveryChallanService';
import { customerService } from '../services/customerService';
import { getTodayDateStr, getFutureDateStr, getCurrentYear } from '../utils/dateUtils';
import { DeliveryChallanPrint } from '../components/VoucherPrintLayout';

export const DeliveryChallan = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab based on current path
  const isViewRoute = location.pathname.endsWith('/view');
  const [activeTab, setActiveTab] = useState(isViewRoute ? 'view' : 'entry');

  useEffect(() => {
    setActiveTab(location.pathname.endsWith('/view') ? 'view' : 'entry');
  }, [location.pathname]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'view') {
      navigate('/delivery-challan/view');
    } else {
      navigate('/delivery-challan/entry');
    }
  };

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Customer suggestions
  const [customerList, setCustomerList] = useState(() => customerService.getStoredCustomers());
  const [showSuggest, setShowSuggest] = useState(false);
  const nameRef = useRef(null);

  // Delivery Challans Data
  const [challans, setChallans] = useState([]);

  // Form State for Entry Tab
  const [formData, setFormData] = useState({
    order_date: getTodayDateStr(),
    expected_shipment_date: getFutureDateStr(3),
    sales_type: 'GST',
    reference_no: '',
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    key_no: '',
    file_no: '',
    product_name: 'Royal Enfield Classic 350',
    quantity: 1,
    engine_number: '',
    chassis_number: '',
    color: '',
    delivery_terms: '',
    notes: ''
  });

  // Filter & Search State for View Tab
  const [filters, setFilters] = useState({
    fromDate: getTodayDateStr(),
    toDate: getTodayDateStr()
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Printable Delivery Challan Modal
  const [selectedDcForPrint, setSelectedDcForPrint] = useState(null);

  // Fetch Delivery Challans from backend
  const loadDeliveryChallans = async () => {
    setLoading(true);
    try {
      const res = await deliveryChallanService.getDeliveryChallans();
      if (res.success && res.data && res.data.length > 0) {
        setChallans(res.data);
      }
    } catch (err) {
      console.warn('Backend API offline or unreachable, using local state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveryChallans();
    const handleCustSync = () => setCustomerList(customerService.getStoredCustomers());
    window.addEventListener('customerUpdated', handleCustSync);
    window.addEventListener('storage', handleCustSync);
    return () => {
      window.removeEventListener('customerUpdated', handleCustSync);
      window.removeEventListener('storage', handleCustSync);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const filteredSuggestions = formData.customer_name
    ? customerList.filter((c) => c.name.toLowerCase().includes(formData.customer_name.toLowerCase()))
    : customerList;

  const getStoredStocks = () => {
    try { return JSON.parse(localStorage.getItem('royalbikes_direct_stocks') || '[]'); } catch { return []; }
  };

  const [showProductSuggest, setShowProductSuggest] = useState(false);

  const productSuggestions = [...new Set(
    getStoredStocks().map(s => s.product).filter(Boolean)
  )];

  const handleEngineNumberChange = (e) => {
    const val = e.target.value;
    if (!val.trim()) {
      setFormData((prev) => ({ ...prev, engine_number: val, chassis_number: '', color: '', product_name: '' }));
      return;
    }
    const stocks = getStoredStocks();
    const match = stocks.find((s) => {
      const eng = (s.engineNumber || s.engine_number || '').toUpperCase();
      return eng === val.toUpperCase() || eng.startsWith(val.toUpperCase()) || eng.includes(val.toUpperCase());
    });
    if (match) {
      setFormData((prev) => ({
        ...prev,
        engine_number: val,
        chassis_number: match.chassisNumber || match.chassis_number || '',
        color: match.color || '',
        product_name: match.product || prev.product_name
      }));
    } else {
      setFormData((prev) => ({ ...prev, engine_number: val }));
    }
  };

  const handleClear = () => {
    setFormData({
      order_date: getTodayDateStr(),
      expected_shipment_date: getFutureDateStr(3),
      sales_type: 'GST',
      reference_no: '',
      customer_name: '',
      customer_phone: '',
      customer_address: '',
      key_no: '',
      file_no: '',
      product_name: 'Royal Enfield Classic 350',
      quantity: 1,
      engine_number: '',
      chassis_number: '',
      color: '',
      delivery_terms: '',
      notes: ''
    });
  };

  const handleSubmitEntry = async (e) => {
    if (e) e.preventDefault();
    if (!formData.customer_name.trim()) {
      alert('Please select or add a Customer Name');
      return;
    }
    if (!formData.engine_number.trim() || !formData.chassis_number.trim() || !formData.color.trim()) {
      alert('Please fill out required fields marked with * (Engine Number, Chassis Number, Color)');
      return;
    }

    const currentYr = getCurrentYear();
    const nextNo = `DC-${currentYr}-${String(challans.length + 1).padStart(3, '0')}`;
    const newEntry = {
      ...formData,
      order_date: formData.order_date || getTodayDateStr(),
      expected_shipment_date: formData.expected_shipment_date || getFutureDateStr(3),
      dc_number: nextNo,
      status: 'Delivered'
    };

    try {
      const res = await deliveryChallanService.createDeliveryChallan(newEntry);
      if (res.success && res.data) {
        setChallans((prev) => [res.data, ...prev]);
      } else {
        setChallans((prev) => [{ id: Date.now(), ...newEntry }, ...prev]);
      }
    } catch (err) {
      setChallans((prev) => [{ id: Date.now(), ...newEntry }, ...prev]);
    }

    setSuccessMessage(`Delivery Challan #${newEntry.dc_number} saved successfully!`);
    setTimeout(() => setSuccessMessage(''), 4000);
    handleClear();
    handleTabChange('view');
  };

  const handleDeleteChallan = async (id) => {
    if (window.confirm('Are you sure you want to delete this Delivery Challan entry?')) {
      try {
        await deliveryChallanService.deleteDeliveryChallan(id);
      } catch (err) {
        // fallback local removal
      }
      setChallans((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // Filtered & Searched data
  const filteredChallans = challans.filter((item) => {
    const matchesSearch = 
      item.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.dc_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.product_name && item.product_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.engine_number && item.engine_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.chassis_number && item.chassis_number.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredChallans.length / itemsPerPage) || 1;
  const paginatedChallans = filteredChallans.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div>
      {/* Header & Breadcrumb Trail Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="page-title-icon">
            <Truck size={22} />
          </div>
          <div>
            <div className="page-title-text" style={{ margin: 0, fontSize: '1.45rem' }}>
              {activeTab === 'view' ? 'Delivery-Challan View' : 'Delivery-Challan'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
              <Home size={13} color="#94a3b8" />
              <span>•</span>
              <span>Transaction</span>
              <span>•</span>
              <span>Sales</span>
              <span>•</span>
              <span style={{ fontWeight: 600, color: '#475569' }}>Delivery-Challan</span>
            </div>
          </div>
        </div>

        {/* Top Right Action Button */}
        {activeTab === 'entry' && (
          <button 
            type="button" 
            onClick={handleSubmitEntry}
            className="btn-save-pill"
            disabled={loading}
            style={{ padding: '0.6rem 2.2rem', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)' }}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="karoda-tabs-wrap">
        <button
          className={`karoda-tab ${activeTab === 'entry' ? 'active' : ''}`}
          onClick={() => handleTabChange('entry')}
        >
          Entry
        </button>
        <button
          className={`karoda-tab ${activeTab === 'view' ? 'active' : ''}`}
          onClick={() => handleTabChange('view')}
        >
          View
        </button>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: '#ecfdf5',
          color: '#047857',
          border: '1px solid #a7f3d0',
          borderRadius: '8px',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.5rem'
        }}>
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* TAB 1: ENTRY FORM */}
      {activeTab === 'entry' && (
        <form onSubmit={handleSubmitEntry} style={{ maxWidth: '900px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Row 1: Dates & Customer Details Lookup */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '1.25rem' }}>
              <div>
                <fieldset className="outlined-fieldset" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <legend className="outlined-legend">Order Date</legend>
                  <input
                    type="text"
                    name="order_date"
                    value={formData.order_date}
                    onChange={handleInputChange}
                    className="outlined-input"
                  />
                  <Calendar size={18} color="#64748b" />
                </fieldset>
              </div>

              <div>
                <fieldset className="outlined-fieldset" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <legend className="outlined-legend">Expected Shipment Date</legend>
                  <input
                    type="text"
                    name="expected_shipment_date"
                    value={formData.expected_shipment_date}
                    onChange={handleInputChange}
                    className="outlined-input"
                  />
                  <Calendar size={18} color="#64748b" />
                </fieldset>
              </div>

              {/* Customer Name with suggestions */}
              <div style={{ position: 'relative' }}>
                <fieldset className="outlined-fieldset" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <legend className="outlined-legend">Customer Name*</legend>
                  <User size={16} color="#64748b" />
                  <input
                    ref={nameRef}
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    onFocus={() => setShowSuggest(true)}
                    onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                    placeholder="Type customer name..."
                    className="outlined-input"
                    autoComplete="off"
                  />
                </fieldset>
                {showSuggest && filteredSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                    background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto', marginTop: '2px'
                  }}>
                    {filteredSuggestions.map((c) => (
                      <div
                        key={c.id}
                        onMouseDown={() => {
                          setFormData((prev) => ({
                            ...prev,
                            customer_name: c.name,
                            customer_phone: c.mob || c.phone || prev.customer_phone,
                            customer_address: c.address || c.city || prev.customer_address
                          }));
                          setShowSuggest(false);
                        }}
                        style={{ padding: '0.55rem 1rem', cursor: 'pointer', fontSize: '0.88rem', borderBottom: '1px solid #f1f5f9' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                      >
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.name}</div>
                        {c.mob && <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{c.mob}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Address, Phone, Key No, File No */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '1.25rem' }}>
              <fieldset className="outlined-fieldset">
                <legend className="outlined-legend">Customer Address</legend>
                <input type="text" name="customer_address" value={formData.customer_address} onChange={handleInputChange} className="outlined-input" placeholder="205, Sanjay Nagar, Vyasarpadi, Chennai-600039" />
              </fieldset>
              <fieldset className="outlined-fieldset">
                <legend className="outlined-legend">Phone No</legend>
                <input type="text" name="customer_phone" value={formData.customer_phone} onChange={handleInputChange} className="outlined-input" placeholder="9876543210" />
              </fieldset>
              <fieldset className="outlined-fieldset">
                <legend className="outlined-legend">Key No</legend>
                <input type="text" name="key_no" value={formData.key_no} onChange={handleInputChange} className="outlined-input" />
              </fieldset>
              <fieldset className="outlined-fieldset">
                <legend className="outlined-legend">File No</legend>
                <input type="text" name="file_no" value={formData.file_no} onChange={handleInputChange} className="outlined-input" placeholder="2995" />
              </fieldset>
            </div>

            {/* Row 3: Sales Type & Reference# */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <fieldset className="outlined-fieldset">
                <legend className="outlined-legend">Sales Type*</legend>
                <select
                  name="sales_type"
                  value={formData.sales_type}
                  onChange={handleInputChange}
                  className="outlined-select"
                >
                  <option value="GST">GST</option>
                  <option value="NON-GST">NON-GST</option>
                  <option value="EXPORT">EXPORT</option>
                </select>
              </fieldset>

              <fieldset className="outlined-fieldset">
                <legend className="outlined-legend">Reference#</legend>
                <input
                  type="text"
                  name="reference_no"
                  value={formData.reference_no}
                  onChange={handleInputChange}
                  className="outlined-input"
                />
              </fieldset>
            </div>

            {/* Row 3: Product with suggestions from Direct Stock */}
            <fieldset className="outlined-fieldset" style={{ position: 'relative' }}>
              <legend className="outlined-legend">Product</legend>
              <input
                type="text"
                name="product_name"
                value={formData.product_name}
                onChange={(e) => {
                  handleInputChange(e);
                }}
                onFocus={() => setShowProductSuggest(true)}
                onBlur={() => setTimeout(() => setShowProductSuggest(false), 150)}
                className="outlined-input"
                placeholder="Type or select product..."
                autoComplete="off"
              />
              {showProductSuggest && productSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.1)', maxHeight: '220px', overflowY: 'auto', marginTop: '2px'
                }}>
                  {productSuggestions
                    .filter(p => p.toLowerCase().includes((formData.product_name || '').toLowerCase()))
                    .map((p, idx) => (
                      <div key={idx}
                        onMouseDown={() => setFormData(prev => ({ ...prev, product_name: p }))}
                        style={{ padding: '0.55rem 1rem', cursor: 'pointer', fontSize: '0.88rem', borderBottom: '1px solid #f1f5f9', fontWeight: 500 }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      >{p}</div>
                    ))}
                </div>
              )}
            </fieldset>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr 1fr', gap: '1.25rem' }}>
              <fieldset className="outlined-fieldset">
                <legend className="outlined-legend">Quantity</legend>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="outlined-input"
                />
              </fieldset>

              <fieldset className="outlined-fieldset">
                <legend className="outlined-legend">Engine Number *</legend>
                <input
                  type="text"
                  name="engine_number"
                  value={formData.engine_number}
                  onChange={handleEngineNumberChange}
                  className="outlined-input"
                />
              </fieldset>

              <fieldset className="outlined-fieldset">
                <legend className="outlined-legend">Chassis Number *</legend>
                <input
                  type="text"
                  name="chassis_number"
                  value={formData.chassis_number}
                  onChange={handleInputChange}
                  className="outlined-input"
                  style={formData.chassis_number ? { background: '#f0fdf4', color: '#15803d', fontWeight: 600 } : {}}
                  placeholder="Auto-filled from Engine No"
                />
              </fieldset>

              <fieldset className="outlined-fieldset">
                <legend className="outlined-legend">Color *</legend>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="outlined-input"
                  style={formData.color ? { background: '#f0fdf4', color: '#15803d', fontWeight: 600 } : {}}
                  placeholder="Auto-filled from Engine No"
                />
              </fieldset>
            </div>

            {/* Row 4: Delivery Terms & Notes */}
            <fieldset className="outlined-fieldset">
              <legend className="outlined-legend">Delivery Terms</legend>
              <input
                type="text"
                name="delivery_terms"
                value={formData.delivery_terms}
                onChange={handleInputChange}
                className="outlined-input"
              />
            </fieldset>

            <fieldset className="outlined-fieldset">
              <legend className="outlined-legend">Notes</legend>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="outlined-textarea"
                rows={3}
              />
            </fieldset>

            {/* Form Action Buttons */}
            <div className="form-actions-row" style={{ justifyContent: 'center', marginTop: '1rem' }}>
              <button type="submit" className="btn-save-pill" style={{ minWidth: '120px' }}>
                Save
              </button>
              <button type="button" onClick={handleClear} className="btn-clear-link">
                Clear
              </button>
            </div>

          </div>
        </form>
      )}

      {/* TAB 2: VIEW DELIVERY CHALLANS */}
      {activeTab === 'view' && (
        <div>
          {/* Top Filter Controls */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <fieldset className="outlined-fieldset" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <legend className="outlined-legend">FromDate</legend>
                <input
                  type="text"
                  value={filters.fromDate}
                  onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                  className="outlined-input"
                />
                <Calendar size={18} color="#64748b" />
              </fieldset>
              <div className="field-subtext">Click on the input or the datepicker icon</div>
            </div>

            <div style={{ flex: 1, minWidth: '220px' }}>
              <fieldset className="outlined-fieldset" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <legend className="outlined-legend">ToDate</legend>
                <input
                  type="text"
                  value={filters.toDate}
                  onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                  className="outlined-input"
                />
                <Calendar size={18} color="#64748b" />
              </fieldset>
              <div className="field-subtext">Click on the input or the datepicker icon</div>
            </div>

            <div style={{ paddingTop: '0.2rem' }}>
              <button type="button" className="btn-save-pill" style={{ padding: '0.65rem 2rem' }}>
                Submit
              </button>
            </div>
          </div>

          {/* Table Card Container */}
          <div className="table-card">
            {/* Search Header Banner */}
            <div className="receipt-search-banner">
              <div className="receipt-search-box">
                <Search size={18} color="rgba(255,255,255,0.8)" />
                <input
                  type="text"
                  placeholder="Type here to search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Delivery Challan Table */}
            <div className="table-responsive">
              <table className="karoda-table">
                <thead>
                  <tr>
                    <th>Print</th>
                    <th>DC NUMBER</th>
                    <th>CUSTOMER NAME</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedChallans.length > 0 ? (
                    paginatedChallans.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <button
                              type="button"
                              className="btn-icon-circle"
                              title="Print Delivery Challan"
                              onClick={() => setSelectedDcForPrint(row)}
                            >
                              <Printer size={18} color="#475569" />
                            </button>
                            <button
                              type="button"
                              className="btn-icon-circle"
                              title="Delete Delivery Challan"
                              onClick={() => handleDeleteChallan(row.id)}
                            >
                              <Trash2 size={16} color="#ef4444" />
                            </button>
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, color: '#6366f1' }}>{row.dc_number}</td>
                        <td style={{ fontWeight: 600 }}>{row.customer_name}</td>
                        <td>
                          <span className="badge-note-pill" style={{ backgroundColor: '#ecfdf5', color: '#047857' }}>
                            {row.status || 'Delivered'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                        No delivery challan records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <div className="table-pagination-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Items per page:</span>
                <select
                  className="pagination-select"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div>
                {filteredChallans.length > 0
                  ? `${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filteredChallans.length)} of ${filteredChallans.length}`
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
                <button
                  type="button"
                  className="page-nav-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Bottom Footer Banner */}
      <div className="page-footer-banner">
        <div className="badge-gst-software">
          <ShoppingBag size={16} />
          <span>GST Billing Software</span>
        </div>
        <div className="footer-copyright-text">
          Copyright ©2026 All rights reserved
        </div>
      </div>

      {selectedDcForPrint && (
        <div className="modal-overlay" onClick={() => setSelectedDcForPrint(null)}>
          <div className="printable-receipt-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Delivery Challan — #{selectedDcForPrint.dc_number}</div>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button type="button" className="btn-save-pill" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 1.1rem', fontSize: '0.85rem' }}>
                  <Printer size={15} /> Print
                </button>
                <button type="button" className="btn-icon-circle" onClick={() => setSelectedDcForPrint(null)}><X size={18} /></button>
              </div>
            </div>
            <div style={{ padding: '1.25rem' }}>
              <DeliveryChallanPrint data={selectedDcForPrint} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
