import React, { useState, useEffect } from 'react';
import { 
  CreditCard as CreditCardIcon, 
  Calendar, 
  Search, 
  Printer, 
  X, 
  ChevronLeft, 
  ChevronRight,
  ShoppingBag,
  CheckCircle2
} from 'lucide-react';
import { rtnPaymentService } from '../services/rtnPaymentService';
import { customerService } from '../services/customerService';
import { CustomerSearchSelect } from '../components/CustomerSearchSelect';
import { getTodayDateStr } from '../utils/dateUtils';
import { SimpleVoucherPrint } from '../components/VoucherPrintLayout';

// Helper to convert number to words
const numberToWords = (num) => {
  const n = parseInt(num, 10);
  if (isNaN(n) || n <= 0) return 'zero rupees only';
  
  const units = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  const convert = (val) => {
    if (val < 20) return units[val];
    if (val < 100) return tens[Math.floor(val / 10)] + (val % 10 ? ' ' + units[val % 10] : '');
    if (val < 1000) return units[Math.floor(val / 100)] + ' hundred' + (val % 100 ? ' ' + convert(val % 100) : '');
    if (val < 100000) return convert(Math.floor(val / 1000)) + ' thousand' + (val % 1000 ? ' ' + convert(val % 1000) : '');
    if (val < 10000000) return convert(Math.floor(val / 100000)) + ' lakh' + (val % 100000 ? ' ' + convert(val % 100000) : '');
    return convert(Math.floor(val / 10000000)) + ' crore' + (val % 10000000 ? ' ' + convert(val % 10000000) : '');
  };

  return convert(n) + ' only';
};

export const RtnPayment = () => {
  const [activeTab, setActiveTab] = useState('entry'); // 'entry' | 'view'
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // RTN Payments Data List
  const [rtnPayments, setRtnPayments] = useState([]);

  const [customerList, setCustomerList] = useState(() => customerService.getStoredCustomers());

  const loadCustomers = async () => {
    const list = await customerService.getAllCustomers();
    setCustomerList(list);
  };

  // Form State for Entry Tab
  const [formData, setFormData] = useState({
    account_code: '',
    customer_name: '',
    rtn_date: getTodayDateStr(),
    amount: '0',
    payment_type: '',
    note: ''
  });

  // Filter & Search State for View Tab
  const [filters, setFilters] = useState({
    fromDate: getTodayDateStr(),
    toDate: getTodayDateStr()
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State for Printable Voucher
  const [selectedRtnForPrint, setSelectedRtnForPrint] = useState(null);

  // Fetch RTN Payments from backend
  const loadRtnPayments = async () => {
    setLoading(true);
    try {
      const res = await rtnPaymentService.getRtnPayments();
      if (res.success && res.data && res.data.length > 0) {
        setRtnPayments(res.data);
      }
    } catch (err) {
      console.warn('Backend API offline or unreachable, using local state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRtnPayments();
    loadCustomers();

    const handleCustSync = () => loadCustomers();
    window.addEventListener('customerUpdated', handleCustSync);
    window.addEventListener('storage', handleCustSync);

    return () => {
      window.removeEventListener('customerUpdated', handleCustSync);
      window.removeEventListener('storage', handleCustSync);
    };
  }, []);

  const handleAccountCodeChange = (e) => {
    const code = e.target.value;
    setFormData(prev => ({ ...prev, account_code: code, customer_name: prev.customer_name }));
    if (code.trim()) {
      const allCustomers = [...customerService.getStoredCustomers(), ...customerList].filter(
        (c, i, arr) => arr.findIndex(x => x.account_code === c.account_code) === i
      );
      const matched = allCustomers.find(
        (c) => c.account_code && c.account_code.trim() === code.trim()
      );
      if (matched) {
        setFormData(prev => ({
          ...prev,
          account_code: code,
          customer_name: matched.name
        }));
      } else {
        setFormData(prev => ({ ...prev, account_code: code, customer_name: '' }));
      }
    } else {
      setFormData(prev => ({ ...prev, account_code: code, customer_name: '' }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClear = () => {
    setFormData({
      account_code: '',
      customer_name: '',
      rtn_date: getTodayDateStr(),
      amount: '0',
      payment_type: '',
      note: ''
    });
  };

  const handleSubmitEntry = async (e) => {
    e.preventDefault();
    if (!formData.customer_name.trim()) {
      alert('Please enter Customer Name');
      return;
    }
    if (!formData.payment_type) {
      alert('Please select Payment Type');
      return;
    }

    const nextNo = String(rtnPayments.length + 5102).padStart(5, '0');
    const newEntry = {
      account_code: formData.account_code || '3104',
      customer_name: formData.customer_name.toUpperCase(),
      rtn_date: formData.rtn_date || getTodayDateStr(),
      amount: parseFloat(formData.amount) || 0,
      payment_type: formData.payment_type,
      note: formData.note.trim() || '-',
      voucher_no: nextNo,
      status: 'active'
    };

    try {
      setLoading(true);
      const res = await rtnPaymentService.createRtnPayment(newEntry);
      if (res.success && res.data) {
        setRtnPayments((prev) => [res.data, ...prev]);
      } else {
        setRtnPayments((prev) => [{ id: Date.now(), ...newEntry }, ...prev]);
      }
    } catch (err) {
      setRtnPayments((prev) => [{ id: Date.now(), ...newEntry }, ...prev]);
    } finally {
      setLoading(false);
    }

    setSuccessMessage(`RTN Payment #${newEntry.voucher_no} created successfully!`);
    setTimeout(() => setSuccessMessage(''), 4000);
    handleClear();
    setActiveTab('view');
  };

  const handleDeleteRtn = async (id) => {
    if (window.confirm('Are you sure you want to delete this RTN Payment entry?')) {
      try {
        await rtnPaymentService.deleteRtnPayment(id);
      } catch (err) {
        // fallback local removal
      }
      setRtnPayments((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // Filtered & Searched data
  const filteredRtnPayments = rtnPayments.filter((item) => {
    const matchesSearch = 
      item.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.voucher_no.includes(searchQuery) ||
      (item.account_code && item.account_code.includes(searchQuery)) ||
      item.payment_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredRtnPayments.length / itemsPerPage) || 1;
  const paginatedRtnPayments = filteredRtnPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div>
      {/* Header Title Section */}
      <div className="page-title-header">
        <div className="page-title-icon">
          <CreditCardIcon size={22} />
        </div>
        <div className="page-title-text">RTN-PAYMENT</div>
      </div>

      {/* Navigation Tabs */}
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
        <form onSubmit={handleSubmitEntry} style={{ maxWidth: '750px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Account Code */}
            <fieldset className="outlined-fieldset">
              <legend className="outlined-legend">Account Code</legend>
              <input
                type="text"
                name="account_code"
                value={formData.account_code}
                onChange={handleAccountCodeChange}
                className="outlined-input"
                placeholder="e.g. 3104"
              />
            </fieldset>
            {formData.account_code && (() => {
              const matched = customerList.find(c => c.account_code && c.account_code.trim() === formData.account_code.trim());
              return matched ? (
                <div style={{ marginTop: '-1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.85rem', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '7px', fontSize: '0.85rem', color: '#047857' }}>
                  <CheckCircle2 size={15} />
                  <span>Customer found: <strong>{matched.name}</strong></span>
                </div>
              ) : null;
            })()}

            {/* Customer Name Lookup with ( Add New Customer ) */}
            <CustomerSearchSelect
              selectedCustomerName={formData.customer_name}
              onSelectCustomer={(cust) => setFormData((prev) => ({ ...prev, customer_name: cust.name, account_code: cust.account_code || prev.account_code }))}
              customerList={customerList}
              setCustomerList={setCustomerList}
            />

            {/* Receipt Date */}
            <div>
              <fieldset className="outlined-fieldset" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <legend className="outlined-legend">Receipt Date</legend>
                <input
                  type="text"
                  name="rtn_date"
                  value={formData.rtn_date}
                  onChange={handleInputChange}
                  className="outlined-input"
                />
                <Calendar size={18} color="#64748b" style={{ cursor: 'pointer' }} />
              </fieldset>
              <div className="field-subtext">Click on the input or the datepicker icon</div>
            </div>

            {/* Amount */}
            <div>
              <fieldset className="outlined-fieldset">
                <legend className="outlined-legend">Amount</legend>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="outlined-input"
                />
              </fieldset>
            </div>

            {/* Payment Type * Dropdown */}
            <fieldset className="outlined-fieldset">
              <legend className="outlined-legend">Payment Type *</legend>
              <select
                name="payment_type"
                value={formData.payment_type}
                onChange={handleInputChange}
                className="outlined-select"
                style={{ cursor: 'pointer' }}
              >
                <option value="" disabled hidden>Select Payment Type</option>
                <option value="CASH">CASH</option>
                <option value="CARD">CARD</option>
                <option value="UPI">UPI</option>
                <option value="CHEQUE">CHEQUE</option>
              </select>
            </fieldset>

            {/* Note */}
            <fieldset className="outlined-fieldset">
              <legend className="outlined-legend">Note</legend>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                className="outlined-textarea"
                rows={3}
              />
            </fieldset>

            {/* Action Buttons */}
            <div className="form-actions-row" style={{ justifyContent: 'center', marginTop: '1rem' }}>
              <button type="submit" className="btn-save-pill" style={{ minWidth: '120px' }} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit'}
              </button>
              <button type="button" onClick={handleClear} className="btn-clear-link">
                Cancel
              </button>
            </div>

          </div>
        </form>
      )}

      {/* TAB 2: VIEW RTN PAYMENTS & FILTER TABLE */}
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
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* RTN Payments Table */}
            <div className="table-responsive">
              <table className="karoda-table">
                <thead>
                  <tr>
                    <th>Print</th>
                    <th>DATE</th>
                    <th>VOUCHERNO</th>
                    <th>ACCT.NO</th>
                    <th>CUSTOMER NAME</th>
                    <th>AMOUNT</th>
                    <th>NOTE</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRtnPayments.length > 0 ? (
                    paginatedRtnPayments.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <button
                            type="button"
                            className="btn-icon-circle"
                            title="Print RTN Voucher"
                            onClick={() => setSelectedRtnForPrint(row)}
                          >
                            <Printer size={18} color="#475569" />
                          </button>
                        </td>
                        <td>{row.rtn_date}</td>
                        <td>{row.voucher_no}</td>
                        <td>{row.account_code || '-'}</td>
                        <td style={{ fontWeight: 600 }}>{row.customer_name}</td>
                        <td>{row.amount}</td>
                        <td>
                          <span className="badge-note-pill">{row.note || '-'}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-icon-circle"
                            title="Delete / Cancel RTN Payment"
                            onClick={() => handleDeleteRtn(row.id)}
                            style={{ border: '1px solid #e2e8f0' }}
                          >
                            <X size={16} color="#64748b" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                        No RTN Payment records found.
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
                {filteredRtnPayments.length > 0
                  ? `${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filteredRtnPayments.length)} of ${filteredRtnPayments.length}`
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

      {selectedRtnForPrint && (
        <div className="modal-overlay" onClick={() => setSelectedRtnForPrint(null)}>
          <div className="printable-receipt-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>RTN Payment Preview — #{selectedRtnForPrint.voucher_no}</div>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button type="button" className="btn-save-pill" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 1.1rem', fontSize: '0.85rem' }}>
                  <Printer size={15} /> Print
                </button>
                <button type="button" className="btn-icon-circle" onClick={() => setSelectedRtnForPrint(null)}><X size={18} /></button>
              </div>
            </div>
            <div style={{ padding: '1.25rem' }}>
              <SimpleVoucherPrint
                voucherNo={selectedRtnForPrint.voucher_no}
                date={selectedRtnForPrint.rtn_date}
                customerName={selectedRtnForPrint.customer_name}
                amount={selectedRtnForPrint.amount}
                accountCode={selectedRtnForPrint.account_code || '3104'}
                paymentType={selectedRtnForPrint.payment_type}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
