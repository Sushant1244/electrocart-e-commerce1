import React, { useEffect, useRef, useState } from 'react';
import { BUSINESS } from '../data/policies';
import '../styles/policy.css';

/* =====================================================================
   Shared layout for the legal/policy pages.
   Renders: SEO tags, dark hero banner, sticky scroll-spy TOC, summary
   box, section blocks (text / lists / do-don't cards / accordion /
   note), anchor links on headings, back-to-top and print buttons.
   ===================================================================== */

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function Block({ block }) {
  switch (block.type) {
    case 'p':
      return <p>{block.text}</p>;
    case 'list':
      return <ul>{block.items.map((item, i) => <li key={i}>{item}</li>)}</ul>;
    case 'note':
      return <p className="policy-legal-note" role="note">{block.text}</p>;
    case 'doDont':
      return (
        <div className="policy-dodont">
          <div className="policy-card policy-card-do">
            <h3><span aria-hidden="true">✓</span> Do</h3>
            <ul>{block.do.map((item, i) => <li key={i}>{item}</li>)}</ul>
          </div>
          <div className="policy-card policy-card-dont">
            <h3><span aria-hidden="true">✕</span> Don’t</h3>
            <ul>{block.dont.map((item, i) => <li key={i}>{item}</li>)}</ul>
          </div>
        </div>
      );
    case 'accordion':
      return (
        <div className="policy-acc">
          {block.items.map((item, i) => (
            <details key={i} className="policy-acc-item">
              <summary>{item.title}</summary>
              <div className="policy-acc-body"><p>{item.body}</p></div>
            </details>
          ))}
        </div>
      );
    default:
      return null;
  }
}

export default function PolicyPage({ policy }) {
  const [activeId, setActiveId] = useState(policy.sections[0]?.id || '');
  const [tocOpen, setTocOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const rootRef = useRef(null);

  /* SEO: title, meta description and canonical per page. */
  useEffect(() => {
    document.title = `${policy.title} | ${BUSINESS.name}`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', policy.metaDescription);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.origin + policy.path);
  }, [policy]);

  /* Scroll-spy: highlight the TOC entry for the section in view. */
  useEffect(() => {
    const nodes = policy.sections
      .map((s) => rootRef.current?.querySelector(`#section-${s.id}`))
      .filter(Boolean);
    if (!nodes.length || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id.replace('section-', ''));
        });
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: 0 }
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [policy]);

  /* Back-to-top visibility. */
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Printing: open every accordion so no clause is hidden on paper. */
  useEffect(() => {
    const openAll = () => rootRef.current?.querySelectorAll('details').forEach((d) => d.setAttribute('open', ''));
    const closeAll = () => rootRef.current?.querySelectorAll('details').forEach((d) => d.removeAttribute('open'));
    window.addEventListener('beforeprint', openAll);
    window.addEventListener('afterprint', closeAll);
    return () => {
      window.removeEventListener('beforeprint', openAll);
      window.removeEventListener('afterprint', closeAll);
    };
  }, []);

  const jumpTo = (id) => {
    const el = rootRef.current?.querySelector(`#section-${id}`);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 16;
    window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    setActiveId(id);
    setTocOpen(false);
  };

  const toc = (
    <nav className="policy-toc" aria-label="On this page">
      <button
        type="button"
        className="policy-toc-toggle"
        aria-expanded={tocOpen}
        aria-controls="policy-toc-list"
        onClick={() => setTocOpen((o) => !o)}
      >
        On this page <span aria-hidden="true">{tocOpen ? '−' : '+'}</span>
      </button>
      <ul id="policy-toc-list" className={`policy-toc-list ${tocOpen ? 'open' : ''}`}>
        {policy.sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className={activeId === s.id ? 'active' : ''}
              aria-current={activeId === s.id ? 'true' : undefined}
              onClick={(e) => { e.preventDefault(); jumpTo(s.id); }}
            >
              {s.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <div className="policy-root" ref={rootRef}>
      <header className="policy-hero">
        <div className="container policy-hero-inner">
          <p className="policy-eyebrow">{BUSINESS.name} · {BUSINESS.brand}</p>
          <h1>{policy.title}</h1>
          <p className="policy-updated">Last updated: {BUSINESS.lastUpdated}</p>
        </div>
      </header>

      <div className="container policy-layout">
        <aside className="policy-sidebar">{toc}</aside>

        <article className="policy-content">
          <section className="policy-summary" aria-label="Summary">
            <h2>In short…</h2>
            <ul>{policy.summary.map((line, i) => <li key={i}>{line}</li>)}</ul>
          </section>

          {policy.sections.map((section) => (
            <section key={section.id} id={`section-${section.id}`} className="policy-section" aria-labelledby={`heading-${section.id}`}>
              <h2 id={`heading-${section.id}`}>
                {section.title}
                <a className="policy-anchor" href={`#${section.id}`} aria-label={`Link to ${section.title}`}
                   onClick={(e) => { e.preventDefault(); jumpTo(section.id); }}>#</a>
              </h2>
              {section.blocks.map((block, i) => <Block key={i} block={block} />)}
            </section>
          ))}

          <div className="policy-actions">
            <button type="button" className="btn" onClick={() => window.print()}>Print this page</button>
          </div>
        </article>
      </div>

      <button
        type="button"
        className={`policy-back-top ${showTop ? 'visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })}
        aria-label="Back to top"
      >
        ↑
      </button>
    </div>
  );
}
