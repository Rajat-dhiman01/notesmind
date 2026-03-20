// frontend/src/pages/HowItWorksPage.jsx

import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import HowItWorksSection from '../sections/HowItWorksSection'

export default function HowItWorksPage() {
  const navigate  = useNavigate()
  const meteorRef = useRef(null)

  useEffect(() => {
    const container = meteorRef.current
    const COUNT = 35

    for (let i = 0; i < COUNT; i++) {
      const m        = document.createElement('div')
      const startX   = Math.random() * 120 - 10
      const height   = Math.random() * 120 + 60
      const duration = Math.random() * 4 + 3
      const delay    = Math.random() * 8
      const opacity  = Math.random() * 0.4 + 0.2

      m.style.cssText = `
        position: absolute;
        left: ${startX}%;
        top: -${height}px;
        width: 1px;
        height: ${height}px;
        opacity: ${opacity};
        background: linear-gradient(to bottom, rgba(255,255,255,0.6), transparent);
        border-radius: 1px;
        transform: rotate(15deg);
        animation: meteorFall ${duration}s linear ${delay}s infinite;
        pointer-events: none;
      `
      container.appendChild(m)
    }

    return () => {
      while (container.firstChild) container.removeChild(container.firstChild)
    }
  }, [])

  function handleTryNow() {
    navigate('/')
    setTimeout(() => {
      document.getElementById('app')?.scrollIntoView({ behavior: 'smooth' })
    }, 150)
  }

  return (
    <div style={{
      position: 'relative',
      background: '#080808',
      minHeight: '100vh',
    }}>

      {/* ── Meteor container ─────────────────────────────────────────────────
          Key difference from HeroSection: the page is taller than 100vh so
          we use position:fixed to pin the meteors to the viewport at all
          times — they appear everywhere as you scroll, just like Hero.
          The ref container itself is fixed; individual meteors are absolute
          inside it so they animate relative to the viewport.
      ── */}
      <div
        ref={meteorRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
        }}
      />

      {/* ── All page content sits above meteor layer ── */}
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Sticky nav ── */}
        <nav style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(8,8,8,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid #1a1a1a',
          padding: '0 24px',
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>

          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              background: 'none', border: 'none', color: '#555',
              fontFamily: "'DM Mono', monospace", fontSize: '12px',
              cursor: 'pointer', letterSpacing: '0.04em',
              padding: '6px 0', transition: 'color 150ms',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#f0f0f0'}
            onMouseLeave={e => e.currentTarget.style.color = '#555'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back
          </button>

          <div style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '15px', fontWeight: 700,
            color: '#f0f0f0', letterSpacing: '-0.02em',
            position: 'absolute', left: '50%',
            transform: 'translateX(-50%)',
          }}>
            Notes<span style={{ color: '#4f46e5' }}>Mind</span>
          </div>

          <button
            onClick={handleTryNow}
            style={{
              background: '#4f46e5', color: '#fff', border: 'none',
              padding: '7px 16px', borderRadius: '7px',
              fontFamily: "'DM Mono', monospace", fontSize: '12px',
              cursor: 'pointer', display: 'inline-flex',
              alignItems: 'center', gap: '6px',
              transition: 'background 150ms, transform 150ms',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#4338ca'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#4f46e5'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Try it now
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </nav>

        <HowItWorksSection
          onTryNow={handleTryNow}
          photoUrl="https://res.cloudinary.com/ddczrosyz/image/upload/v1774029717/rajat_pfp_iqwfce.png"
        />
      </div>

      <style>{`
        @keyframes meteorFall {
          0%   { opacity: 0; transform: rotate(15deg) translateY(-10px); }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { opacity: 0; transform: rotate(15deg) translateY(100vh); }
        }
      `}</style>
    </div>
  )
}