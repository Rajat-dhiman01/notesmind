// frontend/src/sections/HeroSection.jsx

import { useEffect, useRef } from 'react'

export default function HeroSection({ onStartUsing, isLoggedIn, onLearnMore }) {
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
        padding: '0 24px',
        maxWidth: '560px',
        width: '100%',
        boxSizing: 'border-box',
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
          textAlign: 'center',
        }}>
          RAG POWERED — PRIVATE — PRECISE
        </div>

        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(32px, 5vw, 72px)',
          fontWeight: 800,
          lineHeight: 0.95,
          letterSpacing: '-0.03em',
          textAlign: 'center',
          background: 'linear-gradient(180deg, #ffffff 0%, #ffffff 40%, #333333 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: 0,
        }}>
          NotesMind
        </h1>

        <p style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 'clamp(13px, 3.5vw, 15px)',
          color: '#888888',
          textAlign: 'center',
          maxWidth: '400px',
          lineHeight: 1.7,
          margin: 0,
        }}>
          Your documents never leave your control.
          AI answers strictly from your files — not the internet.
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {/* Primary CTA */}
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
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#4338ca'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#4f46e5'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            {isLoggedIn ? 'Go to App' : 'Start Using'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>

          {/* Learn more — ghost button */}
          <button
            onClick={onLearnMore}
            style={{
              background: 'transparent',
              color: '#888888',
              border: '1px solid #2a2a2a',
              padding: '12px 24px',
              borderRadius: '8px',
              fontFamily: "'DM Mono', monospace",
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'border-color 150ms, color 150ms, transform 150ms',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#f0f0f0'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#888888'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Learn more
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
          </button>

          {/* GitHub link */}
          <a
            href="https://github.com/Rajat-dhiman01"
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
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#f0f0f0' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#888888' }}
          >
            View on GitHub
          </a>
        </div>

        {/* Trust signals */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px',
            fontSize: '11px', color: '#444', fontFamily: "'DM Mono', monospace",
            letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Never sent to OpenAI
          </div>

          <div style={{ width: '1px', height: '12px', background: '#2a2a2a' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '7px',
            fontSize: '11px', color: '#444', fontFamily: "'DM Mono', monospace",
            letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Your files only
          </div>

          <div style={{ width: '1px', height: '12px', background: '#2a2a2a' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '7px',
            fontSize: '11px', color: '#444', fontFamily: "'DM Mono', monospace",
            letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
            </svg>
            Groq powered
          </div>
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