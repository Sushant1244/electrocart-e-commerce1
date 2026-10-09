import React, { useCallback, useEffect, useRef, useState } from 'react';
import { resolveImageSrc } from '../utils/resolveImage';
import '../styles/hero-showcase.css';

/* =====================================================================
   Swap in your own products here. Transparent PNGs look best.
   `image` accepts '/uploads/foo.png' (resolved against local + backend
   uploads) or any absolute http(s) URL.
   ===================================================================== */
export const HERO_PRODUCTS = [
  {
    id: 'iphone-15-pro-max',
    name: 'iPhone 15 Pro Max',
    headline: 'Up To 20% Discount Check it Out',
    price: 'Rs 178,900',
    image: '/uploads/Iphone banner.png',
  },
  {
    id: 'alpha-watch-ultra',
    name: 'Alpha Watch Ultra',
    headline: 'Up To 15% Off Smart Watches',
    price: 'Rs 3,500',
    image: '/uploads/Alpha Watch ultra ⭐ Featured Product Alpha Watch ultra.png',
  },
  {
    id: 'wireless-headphones',
    name: 'Wireless Headphones',
    headline: 'Up To 25% Off Audio Gear',
    price: 'Rs 3,200',
    image: '/uploads/Wireless Headphones.png',
  },
  {
    id: 'macbook-air-m4',
    name: 'MacBook Air M4',
    headline: 'Up To 10% Off Laptops',
    price: 'Rs 117,000',
    image: '/uploads/MacBook Air M4.png',
  },
];

const CYCLE_MS = 5000; // auto-advance interval
const FLIP_MS = 600;   // matches the flip in/out CSS duration

const srcFor = (product) => {
  const { local, remote } = resolveImageSrc(product.image);
  return { primary: local || remote, fallback: remote || local };
};

export default function HeroShowcase({ onActiveChange }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('idle'); // 'idle' | 'exit' | 'enter'
  const [paused, setPaused] = useState(false);

  const indexRef = useRef(0);
  const busyRef = useRef(false);
  const timersRef = useRef([]);

  const later = (fn, ms) => timersRef.current.push(setTimeout(fn, ms));
  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  // Flip the current product out, then the next one in.
  const goTo = useCallback((next) => {
    if (busyRef.current || next === indexRef.current) return;
    busyRef.current = true;
    clearTimers();
    setPhase('exit');
    later(() => {
      indexRef.current = next;
      setIndex(next);
      setPhase('enter');
      if (onActiveChange) onActiveChange(HERO_PRODUCTS[next]);
      later(() => {
        setPhase('idle');
        busyRef.current = false;
      }, FLIP_MS);
    }, FLIP_MS);
  }, [clearTimers, onActiveChange]);

  // Auto-cycle; paused while the pointer is over the stage.
  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => {
      goTo((indexRef.current + 1) % HERO_PRODUCTS.length);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, [paused, goTo]);

  // Preload every product image so switches never flash empty.
  useEffect(() => {
    HERO_PRODUCTS.forEach((p) => {
      const img = new Image();
      img.src = srcFor(p).primary;
    });
  }, []);

  // Announce the first product so the headline starts in sync.
  useEffect(() => {
    if (onActiveChange) onActiveChange(HERO_PRODUCTS[0]);
  }, [onActiveChange]);

  useEffect(() => clearTimers, [clearTimers]);

  const product = HERO_PRODUCTS[index];
  const { primary, fallback } = srcFor(product);

  return (
    <div
      className="hero-showcase"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="hero-stage">
        <div className="hero-float">
          <div className="hero-spin">
            <div className={`hero-product phase-${phase}`}>
              <img
                className="hero-img"
                src={primary}
                alt={product.name}
                onError={(e) => {
                  if (fallback && e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                }}
              />
              <span className="hero-shine" aria-hidden="true" />
              <div className="hero-reflection" aria-hidden="true">
                <img src={primary} alt="" onError={(e) => {
                  if (fallback && e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                }} />
              </div>
            </div>
          </div>
        </div>
        <div className="hero-shadow" aria-hidden="true" />
      </div>

      <p className="hero-caption hero-caption-swap" key={`caption-${product.id}`}>
        <span>{product.name}</span>
        <span className="hero-price">{product.price}</span>
      </p>

      <div className="hero-dots" role="tablist" aria-label="Featured products">
        {HERO_PRODUCTS.map((p, i) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Show ${p.name}`}
            className={`hero-dot ${i === index ? 'active' : ''}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  );
}
