// frontend/src/sections/HeroSection.jsx

import { useEffect, useRef } from 'react'

export default function HeroSection({ onStartUsing, isLoggedIn }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    const COUNT = 35

    for (let i = 0; i < COUNT; i++) {
      const m = document.createElement('div')
      const startX = Math.random() * 120 - 10
      const height = Math.random() * 120 + 60
      const duration = Math.random() * 4 + 3
      const delay = Math.random() * 8
      const opacity = Math.random() * 0.4 + 0.2

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

  return (
    <section style={{
      position: 'relative',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#080808',
      overflow: 'hidden',
    }}>
      {/* Meteor container */}
      <div ref={containerRef} style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        animation: 'fadeUp 0.8s ease both',
      }}>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '11px',
          letterSpacing: '0.2em',
          color: '#555555',
          textTransform: 'uppercase',
          border: '1px solid #2a2a2a',
          padding: '6px 14px',
          borderRadius: '100px',
        }}>
          Local AI — No Cloud — No API Keys
        </div>

        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(64px, 10vw, 108px)',
          fontWeight: 800,
          lineHeight: 0.95,
          letterSpacing: '-0.03em',
          textAlign: 'center',
          background: 'linear-gradient(180deg, #ffffff 0%, #ffffff 40%, #333333 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          NotesMind
        </h1>

        <p style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '15px',
          color: '#888888',
          textAlign: 'center',
          maxWidth: '400px',
          lineHeight: 1.7,
        }}>
          Ask questions. Get answers.<br />Strictly from your own notes.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

          {/* "Start Using" — now a button, calls onStartUsing prop */}
          <button
            onClick={onStartUsing}
            style={{
              background: '#4f46e5',
              color: 'white',
              border: 'none',
              padding: '12px 28px',
              borderRadius: '8px',
              fontFamily: "'DM Mono', monospace",
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background 150ms ease, transform 150ms ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#4338ca'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#4f46e5'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            {isLoggedIn ? 'Go to App' : 'Start Using'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'transparent',
              color: '#888888',
              border: '1px solid #2a2a2a',
              padding: '12px 24px',
              borderRadius: '8px',
              fontFamily: "'DM Mono', monospace",
              fontSize: '13px',
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'border-color 150ms, color 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#f0f0f0' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#888888' }}
          >
            View on GitHub
          </a>
        </div>
      </div>

      {/* Scroll hint */}
      <div style={{
        position: 'absolute',
        bottom: '32px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{ fontSize: '10px', letterSpacing: '0.15em', color: '#555', textTransform: 'uppercase' }}>Scroll</span>
        <div style={{
          width: '1px',
          height: '40px',
          background: 'linear-gradient(to bottom, #2a2a2a, transparent)',
          animation: 'scrollPulse 2s ease infinite',
        }} />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes meteorFall {
          0%   { opacity: 0; transform: rotate(15deg) translateY(-10px); }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { opacity: 0; transform: rotate(15deg) translateY(100vh); }
        }
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 1; }
        }
      `}</style>
    </section>
  )
}