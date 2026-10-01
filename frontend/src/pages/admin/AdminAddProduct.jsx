import React, { useState } from 'react';
import UploadsPicker from '../../components/UploadsPicker';
import API, { setAuthToken } from '../../api/api';
import { useNavigate } from 'react-router-dom';
import CATEGORIES from '../../constants/categories';

export default function AdminAddProduct(){
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState(0);
  const [originalPrice, setOriginalPrice] = useState('');
  const [stock, setStock] = useState(10);
  const [category, setCategory] = useState('');
  const [rating, setRating] = useState(5);
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
  // basic client-side validation
  if (!name || !price) return alert('Please provide product name and price');
  // Check slug uniqueness client-side to give faster feedback
  try {
    const slug = encodeURIComponent((name || '').toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    if (slug) {
      try {
        const existing = await API.get(`/products/${slug}`);
        if (existing && existing.data) return alert('A product with a similar name/slug already exists. Change the product name.');
      } catch (err) {
        // 404 means not found which is what we want
        if (err.response && err.response.status !== 404) {
          console.warn('Slug check failed', err);
        }
      }
    }
  } catch (e) {
    // ignore slug-check failures
  }

  const form = new FormData();
    form.append('name', name);
    form.append('description', desc);
    form.append('price', price);
    if (originalPrice) form.append('originalPrice', originalPrice);
    form.append('stock', stock);
    form.append('category', category);
    form.append('rating', rating);
    // Normalize FileList to array when file input used
    let imgs = images;
    if (imgs && typeof imgs === 'object' && typeof imgs.length === 'number' && !(Array.isArray(imgs))) {
      try { imgs = Array.from(imgs); } catch (err) { /* leave as-is */ }
    }

    // If the admin selected existing uploads (strings), send them in a JSON field
    if (imgs && imgs.length && typeof imgs[0] === 'string') {
      // send as JSON string in images field so backend will accept as body images
      form.append('images', JSON.stringify(imgs));
    } else if (imgs && imgs.length) {
      for (let i = 0; i < imgs.length; i++) form.append('images', imgs[i]);
    }

    try {
  // Ensure auth header exists
  const token = localStorage.getItem('token');
  if (!token) return alert('You must be logged in as admin to add products. Please login and try again.');
  setAuthToken(token);

  // Do not set Content-Type manually; let the browser include the correct multipart boundary
      // Debug: log form keys for easier diagnosis
      try {
        for (const pair of form.entries()) console.debug('form entry', pair[0], pair[1]);
      } catch (e) { /* ignore */ }

  const res = await API.post('/products', form);
  alert('Product added');
  // notify other parts of the app (home) to refresh product list
  try { window.dispatchEvent(new CustomEvent('productsChanged')); localStorage.setItem('productsChanged', String(Date.now())); } catch (err) { /* ignore */ }
  navigate('/admin');
  } catch (err) {
      console.error('Add product failed', err);
      // Network / CORS errors do not populate err.response
      if (err.request && !err.response) {
        alert(`Unable to contact backend or CORS blocked the request. Please ensure backend is running and CORS allows this origin. Check browser console for details.`);
      } else if (err.response) {
        const status = err.response.status;
        const body = err.response.data;
        const msg = body?.message || JSON.stringify(body) || err.message;
        // If server indicates slug collision, retry once with timestamp appended to name
        if (status === 400 && /slug|same slug|already exists/i.test(msg)) {
          const ts = Date.now();
          const newName = `${name}-${ts}`;
          if (confirm(`Product name appears duplicate. Retry with unique name: "${newName}" ?`)) {
            // update form and retry once
            setName(newName);
            // rebuild FormData with new name
            const retryForm = new FormData();
            retryForm.append('name', newName);
            retryForm.append('description', desc);
            retryForm.append('price', price);
            if (originalPrice) retryForm.append('originalPrice', originalPrice);
            retryForm.append('stock', stock);
            retryForm.append('category', category);
            retryForm.append('rating', rating);
            let imgs = images;
            if (imgs && typeof imgs === 'object' && typeof imgs.length === 'number' && !(Array.isArray(imgs))) {
              try { imgs = Array.from(imgs); } catch (e) { /* ignore */ }
            }
            if (imgs && imgs.length && typeof imgs[0] === 'string') {
              retryForm.append('images', JSON.stringify(imgs));
            } else if (imgs && imgs.length) {
              for (let i = 0; i < imgs.length; i++) retryForm.append('images', imgs[i]);
            }
            try {
              setAuthToken(localStorage.getItem('token'));
              await API.post('/products', retryForm);
              alert('Product added (with auto-suffix)');
              try { window.dispatchEvent(new CustomEvent('productsChanged')); localStorage.setItem('productsChanged', String(Date.now())); } catch (err) { /* ignore */ }
              navigate('/admin');
              return;
            } catch (retryErr) {
              console.error('Retry add product failed', retryErr);
              const rmsg = retryErr?.response?.data?.message || retryErr?.message || 'Retry failed';
              alert(`Retry failed: ${rmsg}`);
              return;
            }
          }
        }
        alert(`Server responded ${status}: ${msg}`);
      } else {
        alert(err.message || 'Error adding product');
      }
    }
  };

  const onImagesChange = (filesOrArray) => {
    setImages(filesOrArray);
    // build previews if FileList or array of File
    let arr = filesOrArray;
    if (!arr) arr = [];
    if (arr && typeof arr === 'object' && typeof arr.length === 'number' && !(Array.isArray(arr))) {
      try { arr = Array.from(arr); } catch (err) { /* ignore */ }
    }
    const urls = [];
    if (arr && arr.length && typeof arr[0] !== 'string') {
      for (const f of arr) {
        try { urls.push(URL.createObjectURL(f)); } catch (e) { /* ignore */ }
      }
    } else if (arr && arr.length && typeof arr[0] === 'string') {
      // existing uploads selected - convert to preview src via uploads path
      for (const s of arr) urls.push(s.startsWith('/uploads/') ? s : `/uploads/${s}`);
    }
    setPreviewUrls(urls);
  };

  return (
    <div className="admin-form-container">
      <h2>Add New Product</h2>
  <form onSubmit={submit} className="admin-form">
        <div className="form-group">
          <label>Product Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" required />
        </div>
        
        <div className="form-group">
          <label>Description</label>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Description" rows="4" />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Price (Rs)</label>
            <input type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder="Price" required min="0" step="0.01" />
          </div>
          
          <div className="form-group">
            <label>Stock</label>
            <input type="number" value={stock} onChange={e=>setStock(e.target.value)} placeholder="Stock" min="0" />
          </div>
        </div>
        
        <div className="form-group">
          <label>Category</label>
          <select value={category} onChange={e=>setCategory(e.target.value)} className="filter">
            <option value="">Select a category</option>
            {CATEGORIES.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Product Images</label>
          <input type="file" multiple onChange={e=>onImagesChange(e.target.files)} accept="image/*" />
          <small>You can select multiple images (max 6)</small>
          {previewUrls.length > 0 && (
            <div style={{marginTop:10, display:'flex', gap:8}}>
              {previewUrls.map((u, i) => (<img key={i} src={u} alt={`preview-${i}`} style={{width:72,height:72,objectFit:'cover',borderRadius:6,border:'1px solid #ddd'}} />))}
            </div>
          )}
          <div style={{marginTop: 10}}>
            <strong>Or choose from existing uploads</strong>
            <UploadsPicker onSelect={(selected) => onImagesChange(selected)} />
          </div>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn-primary">Add Product</button>
          <button type="button" onClick={() => navigate('/admin')} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}