import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, 
  Bell, 
  Bookmark, 
  UserPlus, 
  CheckCheck, 
  X, 
  Phone, 
  Building,
  Package,
  ChevronDown, 
  CheckCircle, 
  AlertCircle,
  AlertTriangle,
  Info,
  Clock,
  Trash2,
  Check,
  Pencil
} from 'lucide-react';

const INDIAN_STATES = [
  'TAMIL NADU',
  'ANDHRA PRADESH',
  'KARNATAKA',
  'KERALA',
  'MAHARASHTRA',
  'TELANGANA',
  'DELHI',
  'PUDUCHERRY',
  'GUJARAT',
  'RAJASTHAN',
  'WEST BENGAL'
];

const DEFAULT_BOOKMARKS = [
  { id: '1', title: 'Direct Stock Entry', path: '/direct-stock' },
  { id: '2', title: 'Delivery Challan Entry', path: '/delivery-challan/entry' },
  { id: '3', title: 'Booking Order Entry', path: '/booking-order/entry' },
  { id: '4', title: 'Current Stock Report', path: '/current-stock-report' },
  { id: '5', title: 'MIS Day Book Report', path: '/day-book' }
];

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const getStoredVendors = () => {
    try {
      const v = localStorage.getItem('royalbikes_vendors');
      if (v) return JSON.parse(v);
    } catch (e) {}
    return [
      { id: 1, name: 'ROYAL ENFIELD DISTRIBUTORS', phone: '04443537237', city: 'Chennai' },
      { id: 2, name: 'HARDEEP HONDA', phone: '9841000001', city: 'Chennai' },
      { id: 3, name: 'HERO MOTOCORP DEALERS', phone: '9841000002', city: 'Chennai' },
      { id: 4, name: 'SRI MOTORS', phone: '9841000003', city: 'Chennai' },
      { id: 5, name: 'MADRAS MOTORS', phone: '9841000004', city: 'Chennai' },
      { id: 6, name: 'RNS MOTORS', phone: '9841000005', city: 'Chennai' }
    ];
  };

  const getStoredBrands = () => {
    try {
      const b = localStorage.getItem('royalbikes_brands');
      if (b) return JSON.parse(b);
    } catch (e) {}
    return ['ROYAL ENFIELD', 'HONDA', 'HERO'];
  };

  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({ name: '', brand: 'ROYAL ENFIELD' });
  const [vendorForm, setVendorForm] = useState({ name: '', phone: '', city: '' });
  const [vendorTab, setVendorTab] = useState('add');
  const [productTab, setProductTab] = useState('add');
  const [editingVendor, setEditingVendor] = useState(null); // { id, name, phone, city }
  const [editingProduct, setEditingProduct] = useState(null); // { id, name, brand }

  const getStoredCustomProducts = () => {
    try {
      const p = localStorage.getItem('royalbikes_custom_products');
      if (p) return JSON.parse(p);
    } catch (e) {}
    return [];
  };

  // Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'warning',
      title: 'Low Stock Alert',
      message: 'Honda Activa 6G STD is low on showroom stock (1 unit remaining).',
      time: '12m ago',
      read: false,
      path: '/current-stock-report'
    },
    {
      id: 2,
      type: 'info',
      title: 'Scheduled Delivery',
      message: 'Delivery Challan DC-2026-001 is scheduled for delivery today.',
      time: '35m ago',
      read: false,
      path: '/delivery-challan/view'
    },
    {
      id: 3,
      type: 'success',
      title: 'Direct Stock Received',
      message: 'Royal Enfield Hunter 350 batch received and verified.',
      time: '1h ago',
      read: false,
      path: '/direct-stock'
    },
    {
      id: 4,
      type: 'neutral',
      title: 'Day Book Reconciled',
      message: 'All daily receipts and voucher balances are synchronized.',
      time: '3h ago',
      read: true,
      path: '/day-book'
    }
  ]);

  // Bookmarks State
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const stored = localStorage.getItem('royalbikes_bookmarks');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_BOOKMARKS;
  });

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    flatHouseNo: '',
    streetArea: '',
    landmark: '',
    pincode: '',
    townCity: '',
    state: 'TAMIL NADU'
  });

  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const bookmarkRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowAddMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (bookmarkRef.current && !bookmarkRef.current.contains(event.target)) {
        setShowBookmarks(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (item) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    setShowNotifications(false);
    if (item.path) {
      navigate(item.path);
    }
  };

  const handleToggleBookmarkCurrentPage = () => {
    const currentPath = location.pathname;
    const pathTitles = {
      '/': 'Analytics Dashboard',
      '/analytics': 'Analytics Dashboard',
      '/direct-stock': 'Direct Stock Entry',
      '/booking-order': 'Booking Order',
      '/booking-order/entry': 'Booking Order Entry',
      '/booking-order/view': 'Booking Order View',
      '/receipt': 'Receipt Entry',
      '/voucher-entry': 'Voucher Entry',
      '/rtn-payment': 'RTN Payment',
      '/delivery-challan': 'Delivery Challan',
      '/delivery-challan/entry': 'Delivery Challan Entry',
      '/delivery-challan/view': 'Delivery Challan View',
      '/current-stock-report': 'Current Stock Report',
      '/mis-report': 'MIS Report',
      '/day-book': 'MIS Day Book Report'
    };

    const title = pathTitles[currentPath] || 'Showroom Page';
    const isAlreadyBookmarked = bookmarks.some((b) => b.path === currentPath);

    let updatedBookmarks;
    if (isAlreadyBookmarked) {
      updatedBookmarks = bookmarks.filter((b) => b.path !== currentPath);
    } else {
      updatedBookmarks = [{ id: Date.now().toString(), title, path: currentPath }, ...bookmarks];
    }

    setBookmarks(updatedBookmarks);
    localStorage.setItem('royalbikes_bookmarks', JSON.stringify(updatedBookmarks));
  };

  const handleDeleteBookmark = (e, id) => {
    e.stopPropagation();
    const updated = bookmarks.filter((b) => b.id !== id);
    setBookmarks(updated);
    localStorage.setItem('royalbikes_bookmarks', JSON.stringify(updated));
  };

  const handleOpenAddVendor = () => {
    setShowAddMenu(false);
    setAlert(null);
    setVendorForm({ name: '', phone: '', city: '' });
    setVendorTab('add');
    setShowVendorModal(true);
  };

  const handleOpenAddDirectStock = () => {
    setShowAddMenu(false);
    setAlert(null);
    setProductForm({ name: '', brand: 'ROYAL ENFIELD' });
    setProductTab('add');
    setShowProductModal(true);
  };

  const handleSaveEditVendor = () => {
    const existing = getStoredVendors();
    const updated = existing.map(v => (v.id || v) === editingVendor.id ? { ...v, name: editingVendor.name.toUpperCase(), phone: editingVendor.phone, city: editingVendor.city } : v);
    localStorage.setItem('royalbikes_vendors', JSON.stringify(updated));
    window.dispatchEvent(new Event('vendorUpdated'));
    setEditingVendor(null);
    setAlert({ type: 'success', message: 'Vendor updated successfully!' });
    setTimeout(() => setAlert(null), 1500);
  };

  const handleSaveEditProduct = () => {
    const existing = getStoredCustomProducts();
    const updated = existing.map(p => p.id === editingProduct.id ? { ...p, name: editingProduct.name, brand: editingProduct.brand } : p);
    localStorage.setItem('royalbikes_custom_products', JSON.stringify(updated));
    window.dispatchEvent(new Event('productUpdated'));
    setEditingProduct(null);
    setAlert({ type: 'success', message: 'Product updated successfully!' });
    setTimeout(() => setAlert(null), 1500);
  };

  const handleDeleteVendor = (id) => {
    const existing = getStoredVendors();
    const updated = existing.filter(v => (v.id || v) !== id);
    localStorage.setItem('royalbikes_vendors', JSON.stringify(updated));
    window.dispatchEvent(new Event('vendorUpdated'));
  };

  const handleDeleteProduct = (id) => {
    const existing = getStoredCustomProducts();
    const updated = existing.filter(p => p.id !== id);
    localStorage.setItem('royalbikes_custom_products', JSON.stringify(updated));
    window.dispatchEvent(new Event('productUpdated'));
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      setAlert({ type: 'error', message: 'Product name is required.' });
      return;
    }
    const product = { id: Date.now(), name: productForm.name.trim(), brand: productForm.brand };
    const existing = getStoredCustomProducts();
    const updated = [product, ...existing];
    localStorage.setItem('royalbikes_custom_products', JSON.stringify(updated));
    window.dispatchEvent(new Event('productUpdated'));
    setAlert({ type: 'success', message: `Product "${product.name}" added successfully!` });
    setTimeout(() => { setShowProductModal(false); setAlert(null); }, 1000);
  };

  const handleVendorSubmit = (e) => {
    e.preventDefault();
    if (!vendorForm.name.trim()) {
      setAlert({ type: 'error', message: 'Vendor Name is required.' });
      return;
    }
    const vendor = { id: Date.now(), name: vendorForm.name.trim().toUpperCase(), phone: vendorForm.phone.trim(), city: vendorForm.city.trim() };
    const existing = getStoredVendors();
    const updated = [vendor, ...existing];
    localStorage.setItem('royalbikes_vendors', JSON.stringify(updated));
    window.dispatchEvent(new Event('vendorUpdated'));
    setAlert({ type: 'success', message: `Vendor "${vendor.name}" added successfully!` });
    setTimeout(() => { setShowVendorModal(false); setAlert(null); }, 1000);
  };

  const isCurrentPageBookmarked = bookmarks.some((b) => b.path === location.pathname);

  return (
    <header className="karoda-topbar">
      {/* Add New Dropdown */}
      <div className="add-new-dropdown-container" ref={menuRef}>
        <button 
          className="btn-add-new" 
          onClick={() => setShowAddMenu(!showAddMenu)}
        >
          <Plus size={16} /> Add New
        </button>

        {showAddMenu && (
          <div className="add-new-menu-popup">
            <button 
              className="add-new-menu-item active-hover"
              onClick={handleOpenAddVendor}
            >
              <UserPlus size={16} className="menu-icon-customer" />
              <span>Add Vendor</span>
            </button>
            <button 
              className="add-new-menu-item"
              onClick={handleOpenAddDirectStock}
            >
              <CheckCheck size={16} className="menu-icon-stock" />
              <span>Add Direct-Stock Product</span>
            </button>
          </div>
        )}
      </div>

      {/* Right Actions: Notifications & Bookmarks */}
      <div className="topbar-right-actions">
        {/* Notifications Button & Dropdown */}
        <div className="topbar-action-item" ref={notifRef}>
          <button 
            className={`topbar-icon-btn ${showNotifications ? 'active' : ''}`} 
            title="Notifications"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowBookmarks(false);
            }}
          >
            <Bell size={20} />
            {unreadNotifCount > 0 && (
              <span className="topbar-badge-pill">{unreadNotifCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="topbar-popup-panel">
              <div className="topbar-popup-header">
                <div className="topbar-popup-title">
                  <Bell size={16} color="#6366f1" />
                  <span>Notifications</span>
                  {unreadNotifCount > 0 && (
                    <span style={{ fontSize: '0.72rem', background: '#e0e7ff', color: '#4338ca', padding: '0.1rem 0.45rem', borderRadius: '9999px', fontWeight: 700 }}>
                      {unreadNotifCount} new
                    </span>
                  )}
                </div>
                {unreadNotifCount > 0 && (
                  <button 
                    className="topbar-popup-action-btn"
                    onClick={handleMarkAllNotificationsRead}
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="topbar-popup-list">
                {notifications.map((item) => (
                  <div 
                    key={item.id} 
                    className={`topbar-notification-item ${!item.read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(item)}
                  >
                    <div className={`notification-icon-wrap ${item.type}`}>
                      {item.type === 'warning' && <AlertTriangle size={16} />}
                      {item.type === 'info' && <Info size={16} />}
                      {item.type === 'success' && <CheckCircle size={16} />}
                      {item.type === 'neutral' && <Clock size={16} />}
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">{item.title}</div>
                      <div className="notification-message">{item.message}</div>
                      <div className="notification-time">{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bookmarks Button & Dropdown */}
        <div className="topbar-action-item" ref={bookmarkRef}>
          <button 
            className={`topbar-icon-btn ${showBookmarks ? 'active' : ''}`} 
            title="Saved Bookmarks & Quick Links"
            onClick={() => {
              setShowBookmarks(!showBookmarks);
              setShowNotifications(false);
            }}
          >
            <Bookmark size={20} color={isCurrentPageBookmarked ? '#4f46e5' : undefined} fill={isCurrentPageBookmarked ? '#6366f1' : 'none'} />
          </button>

          {showBookmarks && (
            <div className="topbar-popup-panel">
              <div className="topbar-popup-header">
                <div className="topbar-popup-title">
                  <Bookmark size={16} color="#6366f1" />
                  <span>Bookmarks & Quick Links</span>
                </div>
              </div>

              <div className="topbar-popup-list">
                {bookmarks.map((bm) => (
                  <div 
                    key={bm.id} 
                    className="topbar-bookmark-item"
                    onClick={() => {
                      setShowBookmarks(false);
                      navigate(bm.path);
                    }}
                  >
                    <div className="topbar-bookmark-left">
                      <Bookmark size={15} color="#6366f1" fill="#e0e7ff" />
                      <span>{bm.title}</span>
                    </div>
                    <button 
                      type="button" 
                      className="topbar-bookmark-del-btn"
                      onClick={(e) => handleDeleteBookmark(e, bm.id)}
                      title="Remove Bookmark"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="topbar-bookmark-add-row">
                <button 
                  type="button" 
                  className="topbar-bookmark-add-btn"
                  onClick={handleToggleBookmarkCurrentPage}
                >
                  {isCurrentPageBookmarked ? (
                    <>
                      <Check size={14} />
                      <span>Bookmarked (Click to Unpin)</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      <span>Bookmark This Page</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Add Product Modal */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="new-customer-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="new-customer-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={18} color="#6366f1" />
                <h2 className="new-customer-modal-title">Direct Stock Products</h2>
              </div>
              <button type="button" className="new-customer-close-btn" onClick={() => setShowProductModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1rem' }}>
              {['add', 'manage'].map(t => (
                <button key={t} type="button" onClick={() => { setProductTab(t); setAlert(null); }}
                  style={{ flex: 1, padding: '0.55rem', fontWeight: 600, fontSize: '0.85rem', border: 'none', cursor: 'pointer', borderBottom: productTab === t ? '2px solid #6366f1' : '2px solid transparent', color: productTab === t ? '#6366f1' : '#64748b', background: 'none' }}>
                  {t === 'add' ? 'Add Product' : 'Manage Products'}
                </button>
              ))}
            </div>

            {alert && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', margin: '0.5rem 0', backgroundColor: alert.type === 'success' ? '#ecfdf5' : '#fef2f2', color: alert.type === 'success' ? '#047857' : '#b91c1c', border: `1px solid ${alert.type === 'success' ? '#a7f3d0' : '#fecaca'}` }}>
                {alert.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                <span>{alert.message}</span>
              </div>
            )}

            {productTab === 'add' ? (
              <form onSubmit={handleProductSubmit} className="new-customer-form">
                <fieldset className="nc-fieldset">
                  <legend className="nc-legend">Product / Model Name *</legend>
                  <div className="nc-input-inner">
                    <Package size={15} className="nc-icon" />
                    <input type="text" required className="nc-input"
                      placeholder="e.g. Royal Enfield Classic 500"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      autoFocus />
                  </div>
                </fieldset>
                <fieldset className="nc-fieldset">
                  <legend className="nc-legend">Brand *</legend>
                  <div className="nc-input-inner nc-select-wrapper">
                    <select className="nc-select" value={productForm.brand}
                      onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}>
                      {getStoredBrands().map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="nc-select-arrow" />
                  </div>
                </fieldset>
                <div className="new-customer-footer-actions">
                  <button type="button" className="nc-btn-cancel" onClick={() => setShowProductModal(false)}>CANCEL</button>
                  <button type="submit" className="nc-btn-submit">Add Product</button>
                </div>
              </form>
            ) : (
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {getStoredCustomProducts().length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>No custom products added yet.</div>
                ) : (
                  getStoredCustomProducts().map((p) => {
                    const isEditing = editingProduct && editingProduct.id === p.id;
                    return (
                      <div key={p.id} style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <input className="nc-input" value={editingProduct.name} onChange={e => setEditingProduct(prev => ({ ...prev, name: e.target.value }))} placeholder="Product Name" style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                            <div className="nc-input-inner nc-select-wrapper" style={{ border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                              <select className="nc-select" value={editingProduct.brand} onChange={e => setEditingProduct(prev => ({ ...prev, brand: e.target.value }))}>
                                {getStoredBrands().map(b => <option key={b} value={b}>{b}</option>)}
                              </select>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <button type="button" onClick={() => setEditingProduct(null)} style={{ padding: '0.3rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#64748b', fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
                              <button type="button" onClick={handleSaveEditProduct} style={{ padding: '0.3rem 0.75rem', borderRadius: '6px', border: 'none', background: '#6366f1', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>Save</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b' }}>{p.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.brand}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <button type="button" onClick={() => setEditingProduct({ id: p.id, name: p.name, brand: p.brand })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', padding: '4px' }} title="Edit"><Pencil size={15} /></button>
                              <button type="button" onClick={() => { handleDeleteProduct(p.id); setAlert({ type: 'success', message: `"${p.name}" deleted.` }); setTimeout(() => setAlert(null), 1500); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }} title="Delete"><Trash2 size={15} /></button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Vendor Modal */}
      {showVendorModal && (
        <div className="modal-overlay" onClick={() => setShowVendorModal(false)}>
          <div className="new-customer-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="new-customer-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building size={18} color="#6366f1" />
                <h2 className="new-customer-modal-title">Vendors</h2>
              </div>
              <button type="button" className="new-customer-close-btn" onClick={() => setShowVendorModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1rem' }}>
              {['add', 'manage'].map(t => (
                <button key={t} type="button" onClick={() => { setVendorTab(t); setAlert(null); }}
                  style={{ flex: 1, padding: '0.55rem', fontWeight: 600, fontSize: '0.85rem', border: 'none', cursor: 'pointer', borderBottom: vendorTab === t ? '2px solid #6366f1' : '2px solid transparent', color: vendorTab === t ? '#6366f1' : '#64748b', background: 'none' }}>
                  {t === 'add' ? 'Add Vendor' : 'Manage Vendors'}
                </button>
              ))}
            </div>

            {alert && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', margin: '0.5rem 0', backgroundColor: alert.type === 'success' ? '#ecfdf5' : '#fef2f2', color: alert.type === 'success' ? '#047857' : '#b91c1c', border: `1px solid ${alert.type === 'success' ? '#a7f3d0' : '#fecaca'}` }}>
                {alert.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                <span>{alert.message}</span>
              </div>
            )}

            {vendorTab === 'add' ? (
              <form onSubmit={handleVendorSubmit} className="new-customer-form">
                <fieldset className="nc-fieldset">
                  <legend className="nc-legend">Vendor Name *</legend>
                  <div className="nc-input-inner">
                    <Building size={15} className="nc-icon" />
                    <input type="text" required className="nc-input" placeholder="e.g. SRI MOTORS"
                      value={vendorForm.name} onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })} autoFocus />
                  </div>
                </fieldset>
                <fieldset className="nc-fieldset">
                  <legend className="nc-legend">Phone Number</legend>
                  <div className="nc-input-inner">
                    <Phone size={15} className="nc-icon" />
                    <input type="tel" className="nc-input" placeholder="e.g. 9841000000"
                      value={vendorForm.phone} onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })} />
                  </div>
                </fieldset>
                <fieldset className="nc-fieldset">
                  <legend className="nc-legend">City</legend>
                  <div className="nc-input-inner">
                    <input type="text" className="nc-input nc-input-noicon" placeholder="e.g. Chennai"
                      value={vendorForm.city} onChange={(e) => setVendorForm({ ...vendorForm, city: e.target.value })} />
                  </div>
                </fieldset>
                <div className="new-customer-footer-actions">
                  <button type="button" className="nc-btn-cancel" onClick={() => setShowVendorModal(false)}>CANCEL</button>
                  <button type="submit" className="nc-btn-submit">Add Vendor</button>
                </div>
              </form>
            ) : (
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {getStoredVendors().length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>No vendors found.</div>
                ) : (
                  getStoredVendors().map((v) => {
                    const id = v.id || v;
                    const name = v.name || v;
                    const phone = v.phone || '';
                    const city = v.city || '';
                    const isEditing = editingVendor && editingVendor.id === id;
                    return (
                      <div key={id} style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <input className="nc-input" value={editingVendor.name} onChange={e => setEditingVendor(p => ({ ...p, name: e.target.value }))} placeholder="Vendor Name" style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                            <input className="nc-input" value={editingVendor.phone} onChange={e => setEditingVendor(p => ({ ...p, phone: e.target.value }))} placeholder="Phone" style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                            <input className="nc-input" value={editingVendor.city} onChange={e => setEditingVendor(p => ({ ...p, city: e.target.value }))} placeholder="City" style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <button type="button" onClick={() => setEditingVendor(null)} style={{ padding: '0.3rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#64748b', fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
                              <button type="button" onClick={handleSaveEditVendor} style={{ padding: '0.3rem 0.75rem', borderRadius: '6px', border: 'none', background: '#6366f1', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>Save</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b' }}>{name}</div>
                              {(phone || city) && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{[phone, city].filter(Boolean).join(' · ')}</div>}
                            </div>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <button type="button" onClick={() => setEditingVendor({ id, name, phone, city })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', padding: '4px' }} title="Edit"><Pencil size={15} /></button>
                              <button type="button" onClick={() => { handleDeleteVendor(id); setAlert({ type: 'success', message: `"${name}" deleted.` }); setTimeout(() => setAlert(null), 1500); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }} title="Delete"><Trash2 size={15} /></button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
