import React from 'react';

const CONTACT_PILLS = [
  ['LAND LINE', '04443537237'],
  ['RTO', '8925270575'],
  ['SALES', '6369308779'],
  ['CUSTOMER CARE', '9677037270'],
];

const numberToWords = (num) => {
  const n = parseInt(num, 10);
  if (isNaN(n) || n <= 0) return 'zero rupees only';
  const units = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
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

const box = {
  fontFamily: "'Times New Roman', Times, serif",
  color: '#000',
  background: '#fff',
  border: '2px solid #111',
  padding: '1rem 1.25rem 0.85rem',
  width: '100%',
  boxSizing: 'border-box',
};

const pill = {
  border: '1px solid #999',
  borderRadius: '16px',
  padding: '0.2rem 0.4rem',
  textAlign: 'center',
};

const dottedField = {
  borderBottom: '1px dotted #000',
  flex: 1,
  marginLeft: '0.4rem',
  fontWeight: 'bold',
  fontSize: '0.95rem',
  paddingLeft: '0.4rem',
};

/* ── Header shared by all voucher types ── */
const VoucherHeader = () => (
  <>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
      <img src="/royal-bikes-logo.png.jpeg" alt="Royal Bikes"
        style={{ height: '68px', width: '68px', objectFit: 'contain', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.1 }}>
          ROYAL BIKES
        </div>
        <div style={{ fontSize: '0.72rem', color: '#000', lineHeight: 1.4, marginTop: '0.2rem' }}>
          104/1, ERUKKANCHERY HIGH ROAD, SHARMA NAGAR, VYASARPADI<br />
          CHENNAI-600039 (ANNAI DIGITAL OPPOSITE)<br />
          E-mail : royalbikes2020@gmail.com
        </div>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
      {CONTACT_PILLS.map(([label, val]) => (
        <div key={label} style={pill}>
          <div style={{ fontSize: '0.6rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 'bold' }}>{label}</div>
          <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#000' }}>{val}</div>
        </div>
      ))}
    </div>

    <div style={{ borderTop: '1px solid #888', marginBottom: '0.85rem' }} />
  </>
);

const Signatures = ({ right = 'Customer Signature' }) => (
  <>
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0.5rem', marginBottom: '0.35rem' }}>
      <div style={{ fontWeight: 'bold', fontSize: '0.88rem' }}>Authorised Signature</div>
      <div style={{ fontWeight: 'bold', fontSize: '0.88rem' }}>{right}</div>
    </div>
    <div style={{ textAlign: 'center', fontSize: '0.68rem', color: '#222' }}>
      Any cancellation is subjects to 10% deduct on at the discretion of the company
    </div>
  </>
);

/* ── Simple Voucher (Receipt / Voucher / RTN) ── */
export const SimpleVoucherPrint = ({ voucherNo, date, customerName, amount, accountCode, paymentType }) => (
  <div style={box}>
    <VoucherHeader />

    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
      <div style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>VOUCHER NO: {voucherNo}</div>
      <div style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>Date : {(date || '').replace(/-/g, '/')}</div>
    </div>

    <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '0.85rem', fontSize: '0.9rem' }}>
      <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Customer Name :</span>
      <span style={dottedField}>{customerName}</span>
    </div>

    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.85rem', fontSize: '0.9rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', flex: 1.2 }}>
        <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Amount :</span>
        <span style={dottedField}>{amount}/-</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', flex: 1 }}>
        <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>A/c No :</span>
        <span style={dottedField}>{accountCode}</span>
      </div>
    </div>

    <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '0.85rem', fontSize: '0.9rem' }}>
      <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Sum of Rupees :</span>
      <span style={{ ...dottedField, textTransform: 'lowercase' }}>{numberToWords(amount)}</span>
    </div>

    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', border: '1.5px solid #444', borderRadius: '24px', padding: '0.3rem 1.25rem', fontSize: '0.88rem' }}>
        <span>Mode of payment</span>
        <strong>{paymentType || 'CASH'}</strong>
      </div>
    </div>

    <Signatures />
  </div>
);

/* ── Delivery Challan Print ── */
export const DeliveryChallanPrint = ({ data }) => (
  <div style={box}>
    <VoucherHeader />

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
      <div style={{ fontSize: '0.9rem' }}><strong>DC No: {data.dc_number}</strong></div>
      <div style={{ border: '2px solid #000', padding: '0.2rem 1.2rem', fontWeight: 'bold', fontSize: '0.95rem', letterSpacing: '0.05em' }}>DELIVERY CHALLAN</div>
      <div style={{ fontSize: '0.9rem' }}><strong>Date : {(data.order_date || '').replace(/-/g, '/')}</strong></div>
    </div>

    <div style={{ marginBottom: '0.6rem', fontSize: '0.88rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '0.4rem' }}>
        <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap', minWidth: '130px' }}>Customer Name :</span>
        <span style={{ borderBottom: '1px dotted #000', flex: 1, paddingLeft: '0.4rem', fontWeight: 'bold' }}>{data.customer_name}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '0.4rem' }}>
        <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap', minWidth: '130px' }}>Address :</span>
        <span style={{ borderBottom: '1px dotted #000', flex: 1, paddingLeft: '0.4rem' }}>{data.customer_address || ''}</span>
      </div>
      <div style={{ borderBottom: '1px dotted #000', marginBottom: '0.4rem', paddingLeft: '130px', minHeight: '1.2rem' }}></div>
      <div style={{ borderBottom: '1px dotted #000', marginBottom: '0.4rem', paddingLeft: '130px', minHeight: '1.2rem' }}></div>
      <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '0.4rem' }}>
        <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap', minWidth: '130px' }}>Ph.No:</span>
        <span style={{ borderBottom: '1px dotted #000', flex: 1, paddingLeft: '0.4rem' }}>{data.customer_phone || ''}</span>
      </div>
    </div>

    <div style={{ border: '1.5px solid #000', borderRadius: '4px', padding: '0.3rem 1rem', textAlign: 'center', fontWeight: 'bold', fontSize: '0.88rem', marginBottom: '0.75rem', display: 'inline-block', width: '100%', boxSizing: 'border-box' }}>
      VEHICLE DETAILS
    </div>

    <div style={{ fontSize: '0.88rem', marginBottom: '0.75rem' }}>
      {[['Model', data.product_name], ['Colour', data.color], ['Engine No', data.engine_number], ['Chassis No', data.chassis_number], ['Key No', data.key_no || ''], ['File No', data.file_no || data.reference_no || '']].map(([label, val]) => (
        <div key={label} style={{ display: 'flex', alignItems: 'baseline', marginBottom: '0.35rem' }}>
          <span style={{ fontWeight: 'bold', minWidth: '100px' }}>{label}</span>
          <span style={{ marginRight: '0.3rem' }}>:</span>
          <span style={{ borderBottom: '1px dotted #000', flex: 1, paddingLeft: '0.3rem' }}>{val}</span>
        </div>
      ))}
    </div>

    <div style={{ border: '1px solid #888', borderRadius: '4px', padding: '0.5rem 0.75rem', fontSize: '0.72rem', color: '#333', marginBottom: '1.25rem', lineHeight: 1.5 }}>
      I am taking delivery of vehicle in good condition along with necessary fitting without registration on my own risk. IN case of any damage of Lose, I will be responsible
    </div>

    <div style={{ textAlign: 'right', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>For ROYAL BIKES</div>

    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 'bold' }}>
      <div>Customer Signature</div>
      <div>Authorised Signature</div>
    </div>
  </div>
);

/* ── Booking Order Print ── */
export const BookingOrderPrint = ({ data }) => (
  <div style={box}>
    <VoucherHeader />

    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
      <div style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>VOUCHER NO: {data.booking_no}</div>
      <div style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>Date : {(data.booking_date || '').replace(/-/g, '/')}</div>
    </div>

    <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '0.85rem', fontSize: '0.9rem' }}>
      <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Customer Name :</span>
      <span style={dottedField}>{data.customer_name}</span>
    </div>

    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.85rem', fontSize: '0.9rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', flex: 1.2 }}>
        <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Amount :</span>
        <span style={dottedField}>{data.booking_amount}/-</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', flex: 1 }}>
        <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Model :</span>
        <span style={{ ...dottedField, fontSize: '0.78rem' }}>{data.model_name}</span>
      </div>
    </div>

    <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '0.85rem', fontSize: '0.9rem' }}>
      <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Sum of Rupees :</span>
      <span style={{ ...dottedField, textTransform: 'lowercase' }}>{numberToWords(data.booking_amount)}</span>
    </div>

    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', border: '1.5px solid #444', borderRadius: '24px', padding: '0.3rem 1.25rem', fontSize: '0.88rem' }}>
        <span>Mode of payment</span>
        <strong>{data.payment_mode || 'CASH'}</strong>
      </div>
    </div>

    <Signatures />
  </div>
);
