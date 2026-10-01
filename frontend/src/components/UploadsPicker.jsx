import React, { useEffect, useState } from 'react';
import API from '../api/api';
import { resolveImageSrc } from '../utils/resolveImage';

export default function UploadsPicker({ onSelect }) {
  const [uploads, setUploads] = useState([]);
  const [selected, setSelected] = useState([]);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  useEffect(() => {
    let mounted = true;
    API.get('/uploads/list').then(res => {
      if (!mounted) return;
      setUploads(res.data || []);
    }).catch(err => {
      console.error('Failed to fetch uploads', err?.message || err);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (onSelect) onSelect(selected.map(s => `/uploads/${s}`));
  }, [selected]);

  const toggle = (name) => {
    setSelected(prev => prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]);
  };

  return (
    <div className="uploads-picker">
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8}}>
        {uploads.length === 0 && <div style={{color: '#666'}}>No uploads available</div>}
        {uploads.map((f) => {
          const { local, remote } = resolveImageSrc(`/uploads/${f}`);
          const url = local || remote;
          const isSelected = selected.includes(f);
          return (
            <div key={f} style={{width: 90, textAlign: 'center'}}>
              <div
                onClick={() => toggle(f)}
                style={{
                  width: 90,
                  height: 70,
                  cursor: 'pointer',
                  border: isSelected ? '3px solid #1f6feb' : '1px solid #ddd',
                  borderRadius: 6,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#fff'
                }}
              >
                <img src={url} alt={f} style={{maxWidth: '100%', maxHeight: '100%'}} onError={(e)=>{e.target.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII='}} />
              </div>
              <div style={{fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={f}>{f}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
