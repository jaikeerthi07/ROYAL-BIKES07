import React, { useState, useRef } from 'react';
import { Home, Calendar, ShoppingBag } from 'lucide-react';
import { reportService } from '../services/reportService';
import { getTodayDateStr } from '../utils/dateUtils';

export const DayBookReport = () => {
  const [organization, setOrganization] = useState('ROYAL BIKES');
  const [fromDate, setFromDate] = useState(getTodayDateStr);
  const [toDate, setToDate] = useState(getTodayDateStr);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fromDateRef = useRef(null);
  const toDateRef = useRef(null);

  const formatCurrency = (val) => {
    const isNegative = val < 0;
    const absVal = Math.abs(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${isNegative ? '-' : ''}₹${absVal}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitted(true);
    try {
      const res = await reportService.getDayBookReport({ from_date: fromDate, to_date: toDate });
      if (res.success) {
        setReportData(res);
      }
    } catch (err) {
      console.warn('Day book report fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const openDatePicker = (ref) => {
    if (ref.current) {
      if (typeof ref.current.showPicker === 'function') ref.current.showPicker();
      else { ref.current.focus(); ref.current.click(); }
    }
  };

  // Closing balance = Opening + Receipts - Vouchers - RTN
  const closingBalance = reportData
    ? reportData.opening_balance + reportData.receipts_total - reportData.vouchers_total - (reportData.rtn_total || 0)
    : 0;

  // Customers who have RTN Payment — hide their rows from main Receipt/Voucher tables
  const rtnCustomerNames = new Set(
    (reportData?.rtn_payments || []).map(r => (r.particulars || '').trim().toUpperCase())
  );
  const visibleReceipts = (reportData?.receipts || []).filter(
    r => !rtnCustomerNames.has((r.particulars || '').trim().toUpperCase())
  );
  const visibleVouchers = (reportData?.vouchers || []).filter(
    v => !rtnCustomerNames.has((v.particulars || '').trim().toUpperCase())
  );
  const visibleReceiptsTotal = visibleReceipts.reduce((s, r) => s + r.amount, 0);
  const visibleVouchersTotal = visibleVouchers.reduce((s, v) => s + v.amount, 0);

  return (
    <div>
      {/* Title & Breadcrumb */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Day Book Report
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
          <Home size={13} color="#94a3b8" />
          <span>•</span><span>Reports</span>
          <span>•</span><span>MIS Reports</span>
          <span>•</span><span style={{ fontWeight: 600, color: '#475569' }}>Day Book Report</span>
        </div>
      </div>

      {/* Filter Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.25rem', marginBottom: '2rem', flexWrap: 'wrap' }}>

          {/* Organization */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <fieldset className="outlined-fieldset">
              <legend className="outlined-legend">Select Organization</legend>
              <select value={organization} onChange={(e) => setOrganization(e.target.value)} className="outlined-select">
                <option value="ROYAL BIKES">ROYAL BIKES</option>
              </select>
            </fieldset>
          </div>

          {/* From Date */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <fieldset
              className="outlined-fieldset"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => openDatePicker(fromDateRef)}
            >
              <legend className="outlined-legend">From Date</legend>
              <input
                type="text"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="outlined-input"
                placeholder="DD-MM-YYYY"
                style={{ cursor: 'pointer' }}
              />
              <Calendar size={18} color="#64748b" />
              <input
                type="date"
                ref={fromDateRef}
                onChange={(e) => {
                  if (e.target.value) {
                    const [y, m, d] = e.target.value.split('-');
                    setFromDate(`${d}-${m}-${y}`);
                  }
                }}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
              />
            </fieldset>
          </div>

          {/* To Date */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <fieldset
              className="outlined-fieldset"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => openDatePicker(toDateRef)}
            >
              <legend className="outlined-legend">To Date</legend>
              <input
                type="text"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="outlined-input"
                placeholder="DD-MM-YYYY"
                style={{ cursor: 'pointer' }}
              />
              <Calendar size={18} color="#64748b" />
              <input
                type="date"
                ref={toDateRef}
                onChange={(e) => {
                  if (e.target.value) {
                    const [y, m, d] = e.target.value.split('-');
                    setToDate(`${d}-${m}-${y}`);
                  }
                }}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
              />
            </fieldset>
          </div>

          {/* Submit */}
          <div>
            <button type="submit" className="btn-save-pill" style={{ padding: '0.65rem 2rem' }}>
              {loading ? 'Loading...' : 'Submit'}
            </button>
          </div>
        </div>
      </form>

      {/* Not yet submitted */}
      {!submitted && (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', fontSize: '0.95rem' }}>
          Select organization and date range, then click <strong>Submit</strong> to view the Day Book.
        </div>
      )}

      {/* Loading */}
      {submitted && loading && (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#6366f1', fontSize: '0.95rem' }}>
          Loading Day Book...
        </div>
      )}

      {/* Report Output */}
      {submitted && !loading && reportData && (
        <>
          {/* Opening Balance */}
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#a855f7', marginBottom: '1.75rem' }}>
            Opening Balance&nbsp;
            <span style={{ color: '#6366f1' }}>{formatCurrency(reportData.opening_balance)}</span>
          </div>

          {/* RECEIPT Section */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#22c55e', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              Receipt <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>(Money Incoming ⬆️)</span>
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#6366f1', fontWeight: 600 }}>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', width: '25%' }}>Date</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', width: '25%' }}>Receipt No</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', width: '50%' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {visibleReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: '1.5rem 0.5rem', color: '#94a3b8', textAlign: 'center' }}>No receipts for this period</td>
                  </tr>
                ) : (
                  visibleReceipts.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#334155' }}>{row.date}</td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#334155' }}>{row.receipt_no}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 700, color: '#22c55e' }}>
                        {formatCurrency(row.amount)}
                      </td>
                    </tr>
                  ))
                )}
                <tr style={{ borderTop: '1.5px solid #cbd5e1', fontWeight: 800, backgroundColor: '#f0fdf4' }}>
                  <td colSpan={2} style={{ padding: '0.75rem 0.5rem', color: '#0f172a' }}>Total</td>
                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#22c55e' }}>
                    {formatCurrency(visibleReceiptsTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* VOUCHER Section */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              Voucher <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>(Money Outgoing ⬇️)</span>
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#6366f1', fontWeight: 600 }}>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', width: '25%' }}>Date</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', width: '25%' }}>Voucher No</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', width: '50%' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {visibleVouchers.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: '1.5rem 0.5rem', color: '#94a3b8', textAlign: 'center' }}>No vouchers for this period</td>
                  </tr>
                ) : (
                  visibleVouchers.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#334155' }}>{row.date}</td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#334155' }}>{row.voucher_no}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>
                        {formatCurrency(row.amount)}
                      </td>
                    </tr>
                  ))
                )}
                <tr style={{ borderTop: '1.5px solid #cbd5e1', fontWeight: 800, backgroundColor: '#fef2f2' }}>
                  <td colSpan={2} style={{ padding: '0.75rem 0.5rem', color: '#0f172a' }}>Total</td>
                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#ef4444' }}>
                    {formatCurrency(visibleVouchersTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Closing Balance Calculation Box */}
          <div style={{
            backgroundColor: '#faf5ff',
            border: '1.5px solid #d8b4fe',
            borderRadius: '12px',
            padding: '1.5rem 2rem',
            marginBottom: '2rem',
            maxWidth: '480px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem', color: '#475569' }}>
              <span>Opening Balance</span>
              <span style={{ fontWeight: 600, color: '#7c3aed' }}>+ {formatCurrency(reportData.opening_balance)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem', color: '#475569' }}>
              <span>(+) Total Receipt</span>
              <span style={{ fontWeight: 600, color: '#22c55e' }}>+ {formatCurrency(reportData.receipts_total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.85rem', fontSize: '0.95rem', color: '#475569' }}>
              <span>(−) Total Voucher</span>
              <span style={{ fontWeight: 600, color: '#ef4444' }}>− {formatCurrency(reportData.vouchers_total)}</span>
            </div>
            <div style={{ borderTop: '1.5px solid #d8b4fe', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#a855f7' }}>Closing Balance</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: closingBalance >= 0 ? '#22c55e' : '#ef4444' }}>
                {formatCurrency(closingBalance)}
              </span>
            </div>
          </div>

          {/* Customer Summary */}
          {(reportData.customer_summary || []).length > 0 && (
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6366f1', marginBottom: '0.85rem' }}>
                Customer Summary
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #e2e8f0', color: '#6366f1', fontWeight: 600 }}>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', width: '28%' }}>Customer Name</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', width: '18%' }}>Receipt</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', width: '18%' }}>Voucher</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', width: '18%' }}>RTN Payment</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', width: '18%' }}>Net Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.customer_summary.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: '#0f172a' }}>{row.customer_name || '—'}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#22c55e', fontWeight: 600 }}>
                        {row.receipt_total > 0 ? formatCurrency(row.receipt_total) : '—'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>
                        {row.voucher_total > 0 ? `− ${formatCurrency(row.voucher_total)}` : '—'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#f97316', fontWeight: 600 }}>
                        {row.rtn_total > 0 ? `− ${formatCurrency(row.rtn_total)}` : '—'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 800, color: row.net_total >= 0 ? '#0f172a' : '#ef4444' }}>
                        {formatCurrency(row.net_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* No data after submit */}
      {submitted && !loading && reportData && reportData.receipts.length === 0 && reportData.vouchers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.9rem' }}>
          No transactions found for the selected date range.
        </div>
      )}

      {/* Footer */}
      <div className="page-footer-banner" style={{ marginTop: '2rem' }}>
        <div className="badge-gst-software">
          <ShoppingBag size={16} />
          <span>GST Billing Software</span>
        </div>
        <div className="footer-copyright-text">Copyright ©2026 All rights reserved</div>
      </div>
    </div>
  );
};
