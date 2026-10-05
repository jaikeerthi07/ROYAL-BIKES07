import React, { useState, useEffect } from 'react';
import {
  Receipt as ReceiptIcon,
  Calendar,
  Search,
  Printer,
  X,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  CheckCircle2,
  Eye,
  Pencil,
  Trash2
} from 'lucide-react';
import { receiptService } from '../services/receiptService';
import { customerService } from '../services/customerService';
import { CustomerSearchSelect } from '../components/CustomerSearchSelect';
import { getTodayDateStr } from '../utils/dateUtils';
import { SimpleVoucherPrint } from '../components/VoucherPrintLayout';

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

export const Receipt = () => {
  const [activeTab, setActiveTab] = useState('entry');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  // Receipts Data List
  const [receipts, setReceipts] = useState([]);

  const [customerList, setCustomerList] = useState(() => customerService.getStoredCustomers());

  const loadCustomers = async () => {
    const list = await customerService.getAllCustomers();
    setCustomerList(list);
  };

  // Form State for Entry Tab
  const [formData, setFormData] = useState({
    account_code: '',
    customer_name: '',
    receipt_date: getTodayDateStr(),
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
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState(null);
  const [selectedReceiptForDetail, setSelectedReceiptForDetail] = useState(null);
  const [editingReceipt, setEditingReceipt] = useState(null);

  const loadReceipts = async () => {
    setLoading(true);
    try {
      const res = await receiptService.getReceipts();
      if (res.success && res.data) setReceipts(res.data);
    } catch (err) {
      console.warn('Backend offline, using local state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceipts();
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
      receipt_date: getTodayDateStr(),
      amount: '0',
      payment_type: '',
      note: ''
    });
  };

  // Save account_code -> customer_name mapping to localStorage
  const saveAccountCodeMapping = (account_code, customer_name) => {
    if (!account_code || !customer_name) return;
    const customers = customerService.getStoredCustomers();
    const alreadyExists = customers.find(
      (c) => c.account_code && c.account_code.trim() === account_code.trim()
    );
    if (!alreadyExists) {
      const newEntry = {
        id: Date.now(),
        name: customer_name.toUpperCase(),
        account_code: account_code.trim(),
        city: '',
        mob: '',
        phone: '',
        email: '',
        address: ''
      };
      const updated = [newEntry, ...customers];
      localStorage.setItem('royalbikes_customers', JSON.stringify(updated));
      window.dispatchEvent(new Event('customerUpdated'));
    }
  };

  const handleSubmitEntry = async (e) => {
    e.preventDefault();
    if (!formData.customer_name.trim()) { alert('Please enter Customer Name'); return; }
    if (!formData.payment_type) { alert('Please select Payment Type'); return; }
    // Save account_code -> customer_name mapping for use in other modules
    saveAccountCodeMapping(formData.account_code, formData.customer_name);
    const nextNo = String(receipts.length + 4698).padStart(5, '0');
    const newEntry = {
      account_code: formData.account_code || '2917',
      customer_name: formData.customer_name.toUpperCase(),
      receipt_date: formData.receipt_date || getTodayDateStr(),
      amount: parseFloat(formData.amount) || 0,
      payment_type: formData.payment_type,
      note: formData.note.trim() || '-',
      receipt_no: nextNo,
      status: 'active'
    };
    try {
      setLoading(true);
      const res = await receiptService.createReceipt(newEntry);
      if (res.success && res.data) setReceipts((prev) => [res.data, ...prev]);
      else setReceipts((prev) => [{ id: Date.now(), ...newEntry }, ...prev]);
    } catch (err) {
      setReceipts((prev) => [{ id: Date.now(), ...newEntry }, ...prev]);
    } finally {
      setLoading(false);
    }
    setSuccessMessage(`Receipt #${newEntry.receipt_no} created successfully!`);
    setTimeout(() => setSuccessMessage(''), 4000);
    handleClear();
    setActiveTab('view');
  };

  const handleEditReceipt = (row) => {
    setEditingReceipt({ ...row });
  };

  const handleSaveEdit = () => {
    setReceipts(prev => prev.map(r => r.id === editingReceipt.id ? editingReceipt : r));
    setEditingReceipt(null);
  };

  const handleDeleteReceipt = async (id) => {
    if (window.confirm('Are you sure you want to delete this receipt entry?')) {
      try { await receiptService.deleteReceipt(id); } catch (err) {}
      setReceipts((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const filteredReceipts = receipts.filter((item) =>
    item.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.receipt_no.includes(searchQuery) ||
    (item.account_code && item.account_code.includes(searchQuery)) ||
    item.payment_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage) || 1;
  const paginatedReceipts = filteredReceipts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div>
      <div className="page-title-header">
        <div className="page-title-icon"><ReceiptIcon size={22} /></div>
        <div className="page-title-text">Receipt-Entry</div>
      </div>

      <div className="karoda-tabs-wrap">
        <button className={`karoda-tab ${activeTab === 'entry' ? 'active' : ''}`} onClick={() => setActiveTab('entry')}>Entry</button>
        <button className={`karoda-tab ${activeTab === 'view' ? 'active' : ''}`} onClick={() => setActiveTab('view')}>View</button>
      </div>

      {successMessage && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '0.85rem 1.25rem', marginBottom: '1.5rem' }}>
          <CheckCircle2 size={18} /><span>{successMessage}</span>
        </div>
      )}

      {activeTab === 'entry' && (
        <form onSubmit={handleSubmitEntry} style={{ maxWidth: '750px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <fieldset className="outlined-fieldset">
              <legend className="outlined-legend">Account Code</legend>
              <input type="text" name="account_code" value={formData.account_code} onChange={handleAccountCodeChange} className="outlined-input" placeholder="e.g. 2917" />
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

            <CustomerSearchSelect
              selectedCustomerName={formData.customer_name}
              onSelectCustomer={(cust) => setFormData((prev) => ({ ...prev, customer_name: cust.name, account_code: cust.account_code || prev.account_code }))}
              customerList={customerList}
              setCustomerList={setCustomerList}
            />

            <div>
              <fieldset className="outlined-fieldset" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <legend className="outlined-legend">Receipt Date</legend>
                <input type="text" name="receipt_date" value={formData.receipt_date} onChange={handleInputChange} className="outlined-input" />
                <Calendar size={18} color="#64748b" />
              </fieldset>
              <div className="field-subtext">Click on the input or the datepicker icon</div>
            </div>

            <fieldset className="outlined-fieldset">
              <legend className="outlined-legend">Amount</legend>
              <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} className="outlined-input" />
            </fieldset>

            <fieldset className="outlined-fieldset">
              <legend className="outlined-legend">Payment Type *</legend>
              <select name="payment_type" value={formData.payment_type} onChange={handleInputChange} className="outlined-select">
                <option value="" disabled hidden>Select Payment Type</option>
                <option value="CASH">CASH</option>
                <option value="CARD">CARD</option>
                <option value="UPI">UPI</option>
                <option value="CHEQUE">CHEQUE</option>
              </select>
            </fieldset>

            <fieldset className="outlined-fieldset">
              <legend className="outlined-legend">Note</legend>
              <textarea name="note" value={formData.note} onChange={handleInputChange} className="outlined-textarea" rows={3} />
            </fieldset>

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

      {activeTab === 'view' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <fieldset className="outlined-fieldset" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <legend className="outlined-legend">FromDate</legend>
                <input type="text" value={filters.fromDate} onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} className="outlined-input" />
                <Calendar size={18} color="#64748b" />
              </fieldset>
            </div>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <fieldset className="outlined-fieldset" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <legend className="outlined-legend">ToDate</legend>
                <input type="text" value={filters.toDate} onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} className="outlined-input" />
                <Calendar size={18} color="#64748b" />
              </fieldset>
            </div>
            <div style={{ paddingTop: '0.2rem' }}>
              <button type="button" className="btn-save-pill" style={{ padding: '0.65rem 2rem' }}>Submit</button>
            </div>
          </div>

          <div className="table-card">
            <div className="receipt-search-banner">
              <div className="receipt-search-box">
                <Search size={18} color="rgba(255,255,255,0.8)" />
                <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>

            <div className="table-responsive">
              <table className="karoda-table">
                <thead>
                  <tr>
                    <th>Print</th><th>DATE</th><th>RECEIPTNO</th><th>ACCT.NO</th>
                    <th>CUSTOMER NAME</th><th>AMOUNT</th><th>NOTE</th><th style={{textAlign:'center'}}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReceipts.length > 0 ? paginatedReceipts.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <button type="button" className="btn-icon-circle" title="Print Receipt" onClick={() => setSelectedReceiptForPrint(row)}>
                          <Printer size={18} color="#475569" />
                        </button>
                      </td>
                      <td>{row.receipt_date}</td>
                      <td>{row.receipt_no}</td>
                      <td>{row.account_code || '-'}</td>
                      <td style={{ fontWeight: 600 }}>{row.customer_name}</td>
                      <td>{row.amount}</td>
                      <td><span className="badge-note-pill">{row.note || '-'}</span></td>
                      <td style={{textAlign:'center'}}>
                        <div style={{display:'inline-flex',gap:'0.35rem'}}>
                          <button type="button" className="btn-icon-circle" title="View Details" onClick={() => setSelectedReceiptForDetail(row)} style={{color:'#6366f1'}}><Eye size={15}/></button>
                          <button type="button" className="btn-icon-circle" title="Edit" onClick={() => handleEditReceipt(row)} style={{color:'#0891b2'}}><Pencil size={15}/></button>
                          <button type="button" className="btn-icon-circle" title="Print" onClick={() => setSelectedReceiptForPrint(row)} style={{color:'#475569'}}><Printer size={15}/></button>
                          <button type="button" className="btn-icon-circle" title="Delete" onClick={() => handleDeleteReceipt(row.id)} style={{color:'#ef4444'}}><Trash2 size={15}/></button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>No receipt records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-pagination-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Items per page:</span>
                <select className="pagination-select" value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                  <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
                </select>
              </div>
              <div>{filteredReceipts.length > 0 ? `${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filteredReceipts.length)} of ${filteredReceipts.length}` : '0 of 0'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button type="button" className="page-nav-btn" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}><ChevronLeft size={18} /></button>
                <button type="button" className="page-nav-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}><ChevronRight size={18} /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="page-footer-banner">
        <div className="badge-gst-software"><ShoppingBag size={16} /><span>GST Billing Software</span></div>
        <div className="footer-copyright-text">Copyright ©2026 All rights reserved</div>
      </div>

      {selectedReceiptForDetail && (
        <div className="modal-overlay" onClick={() => setSelectedReceiptForDetail(null)}>
          <div className="printable-receipt-card" style={{maxWidth:'420px'}} onClick={e => e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.75rem 1.25rem',borderBottom:'1px solid #e2e8f0'}}>
              <div style={{fontWeight:700,fontSize:'0.95rem',color:'#0f172a'}}>Receipt Details — #{selectedReceiptForDetail.receipt_no}</div>
              <button type="button" className="btn-icon-circle" onClick={() => setSelectedReceiptForDetail(null)}><X size={18}/></button>
            </div>
            <div style={{padding:'1.25rem',display:'flex',flexDirection:'column',gap:'0.75rem',fontSize:'0.9rem'}}>
              {[['Receipt No', selectedReceiptForDetail.receipt_no],['Date', selectedReceiptForDetail.receipt_date],['Customer', selectedReceiptForDetail.customer_name],['Account Code', selectedReceiptForDetail.account_code||'-'],['Amount', `₹${selectedReceiptForDetail.amount}`],['Payment Type', selectedReceiptForDetail.payment_type],['Note', selectedReceiptForDetail.note||'-']].map(([label,val])=>(
                <div key={label} style={{display:'flex',gap:'0.5rem'}}>
                  <span style={{fontWeight:600,color:'#475569',minWidth:'120px'}}>{label}:</span>
                  <span style={{color:'#0f172a'}}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {editingReceipt && (
        <div className="modal-overlay" onClick={() => setEditingReceipt(null)}>
          <div className="printable-receipt-card" style={{maxWidth:'440px'}} onClick={e => e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.75rem 1.25rem',borderBottom:'1px solid #e2e8f0'}}>
              <div style={{fontWeight:700,fontSize:'0.95rem',color:'#0f172a'}}>Edit Receipt — #{editingReceipt.receipt_no}</div>
              <button type="button" className="btn-icon-circle" onClick={() => setEditingReceipt(null)}><X size={18}/></button>
            </div>
            <div style={{padding:'1.25rem',display:'flex',flexDirection:'column',gap:'1rem'}}>
              {[['customer_name','Customer Name','text'],['receipt_date','Date','text'],['amount','Amount','number'],['account_code','Account Code','text'],['note','Note','text']].map(([field,label,type])=>(
                <fieldset key={field} className="outlined-fieldset">
                  <legend className="outlined-legend">{label}</legend>
                  <input type={type} className="outlined-input" value={editingReceipt[field]||''} onChange={e => setEditingReceipt(prev=>({...prev,[field]:e.target.value}))}/>
                </fieldset>
              ))}
              <fieldset className="outlined-fieldset">
                <legend className="outlined-legend">Payment Type</legend>
                <select className="outlined-select" value={editingReceipt.payment_type||''} onChange={e => setEditingReceipt(prev=>({...prev,payment_type:e.target.value}))}>
                  <option value="CASH">CASH</option><option value="CARD">CARD</option><option value="UPI">UPI</option><option value="CHEQUE">CHEQUE</option>
                </select>
              </fieldset>
              <div style={{display:'flex',gap:'1rem',justifyContent:'flex-end'}}>
                <button type="button" className="btn-clear-link" onClick={() => setEditingReceipt(null)}>Cancel</button>
                <button type="button" className="btn-save-pill" onClick={handleSaveEdit}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedReceiptForPrint && (
        <div className="modal-overlay" onClick={() => setSelectedReceiptForPrint(null)}>
          <div className="printable-receipt-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Receipt Preview — #{selectedReceiptForPrint.receipt_no}</div>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button type="button" className="btn-save-pill" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 1.1rem', fontSize: '0.85rem' }}>
                  <Printer size={15} /> Print
                </button>
                <button type="button" className="btn-icon-circle" onClick={() => setSelectedReceiptForPrint(null)}><X size={18} /></button>
              </div>
            </div>
            <div style={{ padding: '1.25rem' }}>
              <SimpleVoucherPrint
                voucherNo={selectedReceiptForPrint.receipt_no}
                date={selectedReceiptForPrint.receipt_date}
                customerName={selectedReceiptForPrint.customer_name}
                amount={selectedReceiptForPrint.amount}
                accountCode={selectedReceiptForPrint.account_code || '2917'}
                paymentType={selectedReceiptForPrint.payment_type}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
