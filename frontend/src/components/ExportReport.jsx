import React, { useState, useEffect } from 'react';
import API from '../api/api';

export default function ExportReport({ onClose, onExportComplete }) {
  const [reportType, setReportType] = useState('orders');
  const [format, setFormat] = useState('csv');
  const [period, setPeriod] = useState('30');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [includeDetails, setIncludeDetails] = useState(true);
  const [groupBy, setGroupBy] = useState('day');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Calculate date range based on period
  useEffect(() => {
    if (period !== 'custom') {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - parseInt(period));
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [period]);

  // Fetch report preview data
  const fetchPreview = async () => {
    if (!startDate || !endDate) {
      setError('Please select a date range');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        reportType,
        startDate,
        endDate,
        status,
        category,
        groupBy,
        includeDetails: includeDetails.toString(),
        limit: '50',
        offset: '0'
      });

      const response = await API.get(`/reports/generate?${params}`);
      setReportData(response.data);
      setShowPreview(true);
    } catch (err) {
      console.error('Preview error:', err);
      setError(err.response?.data?.message || 'Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  // Export report
  const handleExport = async () => {
    if (!startDate || !endDate) {
      setError('Please select a date range');
      return;
    }

    setExporting(true);
    setError('');

    try {
      const params = new URLSearchParams({
        reportType,
        startDate,
        endDate,
        status,
        category,
        format
      });

      const response = await API.get(`/reports/export?${params}`, {
        responseType: 'blob'
      });

      // Determine content type based on format
      let mimeType = 'text/csv';
      let extension = 'csv';
      
      switch (format) {
        case 'json':
          mimeType = 'application/json';
          extension = 'json';
          break;
        case 'excel':
          mimeType = 'application/vnd.ms-excel';
          extension = 'xls';
          break;
        default:
          mimeType = 'text/csv';
          extension = 'csv';
      }

      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report_${startDate}_to_${endDate}.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      if (onExportComplete) {
        onExportComplete();
      }
      
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Export error:', err);
      setError(err.response?.data?.message || 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    const num = Number(value ?? 0) || 0;
    return new Intl.NumberFormat('en-NP', { 
      style: 'currency', 
      currency: 'NPR',
      maximumFractionDigits: 2 
    }).format(num);
  };

  return (
    <div className="export-report-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="export-report-modal" style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '700px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
      }}>
        <div className="export-report-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid #eee'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Export Report</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '0',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <div className="export-report-form">
          {/* Report Type */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="orders">Orders Report</option>
              <option value="products">Products Report</option>
              <option value="analytics">Analytics Report</option>
              <option value="users">Users Report</option>
            </select>
          </div>

          {/* Export Format */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
              Export Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="csv">CSV (Comma Separated Values)</option>
              <option value="json">JSON</option>
              <option value="excel">Excel</option>
            </select>
          </div>

          {/* Period Selection */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
              Date Range
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                backgroundColor: 'white',
                marginBottom: '12px'
              }}
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>

            {period === 'custom' && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: '#666' }}>Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: '#666' }}>End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Status Filter (for orders) */}
          {reportType === 'orders' && (
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                Order Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          {/* Category Filter (for products) */}
          {reportType === 'products' && (
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                <option value="all">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Audio">Audio</option>
                <option value="Computers">Computers</option>
                <option value="Accessories">Accessories</option>
                <option value="Smart Home">Smart Home</option>
              </select>
            </div>
          )}

          {/* Group By */}
          {reportType === 'orders' && (
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                Group Data By
              </label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
            </div>
          )}

          {/* Include Details Checkbox */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeDetails}
                onChange={(e) => setIncludeDetails(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '14px' }}>Include detailed records</span>
            </label>
          </div>

          {/* Preview Section */}
          {showPreview && reportData && (
            <div style={{
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>Report Preview</h3>
              
              {reportData.metadata && (
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                  <div><strong>Period:</strong> {new Date(reportData.metadata.startDate).toLocaleDateString()} - {new Date(reportData.metadata.endDate).toLocaleDateString()}</div>
                  <div><strong>Total Records:</strong> {reportData.metadata.totalRecords || 'N/A'}</div>
                </div>
              )}

              {reportData.data?.summary && (
                <div style={{ marginBottom: '12px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>Summary</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '13px' }}>
                    {reportData.data.summary.totalOrders !== undefined && (
                      <div><strong>Total Orders:</strong> {reportData.data.summary.totalOrders}</div>
                    )}
                    {reportData.data.summary.totalRevenue !== undefined && (
                      <div><strong>Total Revenue:</strong> {formatCurrency(reportData.data.summary.totalRevenue)}</div>
                    )}
                    {reportData.data.summary.totalProducts !== undefined && (
                      <div><strong>Total Products:</strong> {reportData.data.summary.totalProducts}</div>
                    )}
                    {reportData.data.summary.totalUsers !== undefined && (
                      <div><strong>Total Users:</strong> {reportData.data.summary.totalUsers}</div>
                    )}
                    {reportData.data.summary.totalSales !== undefined && (
                      <div><strong>Total Sales:</strong> {formatCurrency(reportData.data.summary.totalSales)}</div>
                    )}
                  </div>
                </div>
              )}

              {reportData.data?.orders?.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>Sample Records (First 5)</h4>
                  <div style={{ fontSize: '12px', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#e5e7eb' }}>
                          <th style={{ padding: '6px', textAlign: 'left' }}>Order ID</th>
                          <th style={{ padding: '6px', textAlign: 'left' }}>Status</th>
                          <th style={{ padding: '6px', textAlign: 'right' }}>Total</th>
                          <th style={{ padding: '6px', textAlign: 'left' }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.data.orders.slice(0, 5).map((order, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '6px' }}>{order.id || order._id || 'N/A'}</td>
                            <td style={{ padding: '6px' }}>{order.status || 'N/A'}</td>
                            <td style={{ padding: '6px', textAlign: 'right' }}>{formatCurrency(order.total || order.totalPrice)}</td>
                            <td style={{ padding: '6px' }}>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={fetchPreview}
              disabled={loading}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Loading...' : 'Preview'}
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || !startDate || !endDate}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#4f46e5',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: exporting || !startDate || !endDate ? 'not-allowed' : 'pointer',
                opacity: exporting || !startDate || !endDate ? 0.7 : 1
              }}
            >
              {exporting ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
