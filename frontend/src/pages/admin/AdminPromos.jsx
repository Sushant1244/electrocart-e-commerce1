import React, { useState, useEffect } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/$/, '');

export default function AdminPromos() {
  const [promos, setPromos] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTemplates, setShowTemplates] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '',
    maxUses: '',
    expiresAt: '',
    description: '',
    active: true
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPromos();
    fetchTemplates();
  }, []);

  const fetchPromos = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/promos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setPromos(data);
    } catch (err) {
      setError('Failed to fetch promo codes');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/promos/templates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTemplates(data);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      const url = editingPromo 
        ? `${API_BASE}/promos/${editingPromo.code}`
        : `${API_BASE}/promos`;
      const method = editingPromo ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save promo code');
      }
      
      setSuccess(editingPromo ? 'Promo code updated successfully!' : 'Promo code created successfully!');
      setShowModal(false);
      setEditingPromo(null);
      resetForm();
      fetchPromos();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minOrderAmount: promo.minOrderAmount || '',
      maxUses: promo.maxUses || '',
      expiresAt: promo.expiresAt ? promo.expiresAt.split('T')[0] : '',
      description: promo.description || '',
      active: promo.active
    });
    setShowModal(true);
  };

  const handleDelete = async (code) => {
    if (!window.confirm(`Are you sure you want to delete promo code "${code}"?`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/promos/${code}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error('Failed to delete promo code');
      }
      
      setSuccess('Promo code deleted successfully!');
      fetchPromos();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (promo) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/promos/${promo.code}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ active: !promo.active })
      });
      
      if (!res.ok) {
        throw new Error('Failed to update promo code');
      }
      
      fetchPromos();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: '',
      minOrderAmount: '',
      maxUses: '',
      expiresAt: '',
      description: '',
      active: true
    });
  };

  const openAddModal = () => {
    setEditingPromo(null);
    resetForm();
    setShowModal(true);
  };

  const openFromTemplate = (template) => {
    setEditingPromo(null);
    setFormData({
      code: template.code,
      discountType: template.discountType,
      discountValue: template.discountValue,
      minOrderAmount: template.minOrderAmount || '',
      maxUses: template.maxUses || '',
      expiresAt: '',
      description: template.description || '',
      active: true
    });
    setShowModal(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpired = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  if (loading) {
    return <div className="loading">Loading promo codes...</div>;
  }

  return (
    <div className="admin-promos">
      <div className="admin-header">
        <div>
          <h2>Promo Codes</h2>
          <p className="admin-sub">Manage discount codes and promotions</p>
        </div>
        <div className="admin-header-actions">
          <button className="btn-secondary" onClick={() => setShowTemplates(!showTemplates)}>
            {showTemplates ? 'Hide Templates' : 'Show Templates'}
          </button>
          <button className="btn-primary" onClick={openAddModal}>
            + Add Promo Code
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Promo Templates Section */}
      {showTemplates && templates.length > 0 && (
        <div className="templates-section">
          <h3>Quick Start Templates</h3>
          <p className="templates-sub">Click a template to create a promo code quickly</p>
          <div className="templates-grid">
            {templates.map((template) => (
              <div key={template.id} className="template-card" onClick={() => openFromTemplate(template)}>
                <div className="template-name">{template.name}</div>
                <div className="template-code">{template.code}</div>
                <div className="template-discount">
                  {template.discountType === 'percentage' 
                    ? `${template.discountValue}% OFF` 
                    : `Rs. ${template.discountValue} OFF`}
                </div>
                <div className="template-desc">{template.description}</div>
                <button className="btn-template">Use Template</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="promos-grid">
        {promos.length === 0 ? (
          <div className="empty-state">
            <p>No promo codes found. Create your first promo code!</p>
          </div>
        ) : (
          promos.map((promo) => (
            <div key={promo.code} className={`promo-card ${!promo.active ? 'inactive' : ''} ${isExpired(promo.expiresAt) ? 'expired' : ''}`}>
              <div className="promo-card-header">
                <span className="promo-code">{promo.code}</span>
                <span className={`promo-status ${promo.active ? 'active' : 'inactive'}`}>
                  {isExpired(promo.expiresAt) ? 'Expired' : promo.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="promo-card-body">
                <p className="promo-description">{promo.description || 'No description'}</p>
                
                <div className="promo-details">
                  <div className="promo-detail">
                    <span className="label">Discount:</span>
                    <span className="value">
                      {promo.discountType === 'percentage' 
                        ? `${promo.discountValue}%` 
                        : `Rs. ${promo.discountValue}`}
                    </span>
                  </div>
                  <div className="promo-detail">
                    <span className="label">Min Order:</span>
                    <span className="value">Rs. {promo.minOrderAmount || 0}</span>
                  </div>
                  <div className="promo-detail">
                    <span className="label">Usage:</span>
                    <span className="value">{promo.usedCount} / {promo.maxUses}</span>
                  </div>
                  <div className="promo-detail">
                    <span className="label">Expires:</span>
                    <span className="value">{formatDate(promo.expiresAt)}</span>
                  </div>
                </div>
              </div>
              
              <div className="promo-card-actions">
                <button 
                  className={`btn-toggle ${promo.active ? 'btn-deactivate' : 'btn-activate'}`}
                  onClick={() => handleToggleActive(promo)}
                >
                  {promo.active ? 'Deactivate' : 'Activate'}
                </button>
                <button className="btn-edit" onClick={() => handleEdit(promo)}>
                  Edit
                </button>
                <button className="btn-delete" onClick={() => handleDelete(promo.code)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingPromo ? 'Edit Promo Code' : 'Create New Promo Code'}</h3>
            
            <form onSubmit={handleSubmit} className="promo-form">
              <div className="form-group">
                <label>Promo Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., SUMMER20"
                  required
                  disabled={editingPromo}
                  maxLength={20}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Discount Type *</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    required
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (Rs.)</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Discount Value *</label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    placeholder={formData.discountType === 'percentage' ? '10' : '500'}
                    required
                    min="1"
                    max={formData.discountType === 'percentage' ? 100 : 100000}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Min Order Amount (Rs.)</label>
                  <input
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                <div className="form-group">
                  <label>Max Uses</label>
                  <input
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                    placeholder="100"
                    min="1"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this promo code..."
                  rows={2}
                />
              </div>
              
              {editingPromo && (
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    />
                    Active
                  </label>
                </div>
              )}
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingPromo ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
