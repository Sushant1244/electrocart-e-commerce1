import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { resolveImageSrc } from '../../utils/resolveImage';
import UploadsPicker from '../../components/UploadsPicker';
import { useParams, useNavigate } from 'react-router-dom';
import CATEGORIES from '../../constants/categories';

export default function AdminEditProduct(){
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState(0);
  const [originalPrice, setOriginalPrice] = useState('');
  const [stock, setStock] = useState(10);
  const [category, setCategory] = useState('');
  const [rating, setRating] = useState(5);
  const [featured, setFeatured] = useState(false);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [replaceImages, setReplaceImages] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const res = await API.get(`/products/by-id/${id}`);
      const p = res.data;
      if (p) {
        setProduct(p);
        setName(p.name || '');
        setDesc(p.description || '');
        setPrice(p.price || 0);
        setOriginalPrice(p.originalPrice || '');
        setStock(p.stock || 0);
        setCategory(p.category || '');
        setRating(p.rating || 5);
        setFeatured(p.featured || false);
        setExistingImages(p.images || []);
      }
    } catch (err) {
      alert('Failed to load product');
      navigate('/admin');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', name);
    form.append('description', desc);
    form.append('price', price);
    if (originalPrice) form.append('originalPrice', originalPrice);
    form.append('stock', stock);
    form.append('category', category);
    form.append('rating', rating);
    form.append('featured', featured);
    
    // Only append new images if files are selected
  if (replaceImages) form.append('replaceImages', 'true');

  // If the admin selected existing uploads (strings), the UploadsPicker
  // will return strings like '/uploads/<file>'. If files chosen via file
  // input, images will be a FileList.
  if (images && images.length && typeof images[0] === 'string') {
      form.append('images', JSON.stringify(images));
    } else {
      for (let i = 0; i < images.length; i++) {
        form.append('images', images[i]);
      }
    }

    try {
      // Do not set Content-Type manually; let the browser include multipart boundary
      await API.put(`/products/${id}`, form);
      alert('Product updated successfully');
  try { window.dispatchEvent(new CustomEvent('productsChanged')); localStorage.setItem('productsChanged', String(Date.now())); } catch (err) { /* ignore */ }
  navigate('/admin');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update product');
    }
  };

  if (!product) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-form-container">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
        <h2>Edit Product</h2>
        <div style={{display:'flex', gap:8}}>
          <button type="button" className="btn-outline" onClick={() => navigate('/admin')}>Dashboard</button>
          <button type="button" className="btn-primary" onClick={() => navigate('/admin/add')}>Add Product</button>
        </div>
      </div>
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
            <input type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder="Current Price" required min="0" step="0.01" />
          </div>
          
          <div className="form-group">
            <label>Original Price (Rs) - Optional</label>
            <input type="number" value={originalPrice} onChange={e=>setOriginalPrice(e.target.value)} placeholder="Original Price (for discount)" min="0" step="0.01" />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Stock</label>
            <input type="number" value={stock} onChange={e=>setStock(e.target.value)} placeholder="Stock" min="0" />
          </div>
          
          <div className="form-group">
            <label>Rating (1-5)</label>
            <input type="number" value={rating} onChange={e=>setRating(e.target.value)} placeholder="Rating" min="1" max="5" step="0.1" />
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
          <label>
            <input type="checkbox" checked={featured} onChange={e=>setFeatured(e.target.checked)} />
            Featured Product
          </label>
        </div>

        {existingImages.length > 0 && (
          <div className="form-group">
            <label>Current Images</label>
            <div className="existing-images">
              {existingImages.map((img, idx) => {
                const raw = img;
                const { local, remote } = resolveImageSrc(raw.startsWith('/') ? raw : `/uploads/${raw}`);
                const src = local || remote || '';
                return (
                  <div key={String(img) + idx} style={{display:'inline-block', marginRight:8, textAlign:'center'}}>
                    <img
                      src={src}
                      alt={`Product ${idx + 1}`}
                      style={{width:64, height:64, objectFit:'cover', borderRadius:6}}
                      onError={(e) => { if (remote && e.currentTarget.src !== remote) e.currentTarget.src = remote; else e.currentTarget.src = ''; }}
                    />
                    <div style={{marginTop:6}}>
                      <button type="button" onClick={async ()=>{
                        if (!confirm('Delete this image?')) return;
                        // send deleteImages request
                        const body = new FormData();
                        body.append('deleteImages', JSON.stringify([raw]));
                        try {
                          await API.put(`/products/${id}`, body);
                          await loadProduct();
                        } catch (err) { alert('Failed to delete image'); }
                      }} style={{display:'block', fontSize:12}}>Delete</button>
                      <label style={{display:'block', fontSize:12, marginTop:4, cursor:'pointer'}}>
                        <input type="file" accept="image/*" style={{display:'none'}} onChange={async (e)=>{
                          const f = e.target.files && e.target.files[0];
                          if (!f) return;
                          if (!confirm('Replace this image with selected file?')) return;
                          const form = new FormData();
                          // add file and request replacement: we'll delete the old and append the new
                          form.append('images', f);
                          // To replace a single image, first request deleteImages for that image, then upload the new file appended
                          // To replace a single image, first request deleteImages for that image, then upload the new file appended
                          const del = new FormData();
                          del.append('deleteImages', JSON.stringify([raw]));
                          try { await API.put(`/products/${id}`, del); }
                          catch (err) { /* continue to upload new file even if delete failed */ }
                          try {
                            await API.put(`/products/${id}`, form);
                            await loadProduct();
                          } catch (err) { alert('Failed to upload replacement image'); }
                        }} />
                        <span>Replace</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <div className="form-group">
          <label>Add New Images</label>
          <input type="file" multiple onChange={e=>setImages(e.target.files)} accept="image/*" />
          <div style={{marginTop:6}}>
            <label style={{fontSize:13}}>
              <input type="checkbox" checked={replaceImages} onChange={e=>setReplaceImages(e.target.checked)} />
              &nbsp; Replace existing images (delete previous uploads)
            </label>
          </div>
          <small>Select new images to add or check "Replace" to delete previous images and set only the new ones</small>
          <div style={{marginTop: 8}}>
            <strong>Or choose from existing uploads</strong>
            <UploadsPicker onSelect={(selected) => setImages(selected)} />
          </div>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn-primary">Update Product</button>
          <button type="button" onClick={() => navigate('/admin')} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}

