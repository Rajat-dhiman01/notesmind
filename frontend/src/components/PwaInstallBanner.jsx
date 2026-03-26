// frontend/src/components/PwaInstallBanner.jsx

import { useState, useEffect } from 'react'

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [visible, setVisible]               = useState(false)

  useEffect(() => {
    // If user already dismissed, never show again
    if (localStorage.getItem('pwa_dismissed') === 'true') return

    function handleBeforeInstallPrompt(e) {
      // Prevent browser's default mini-infobar
      e.preventDefault()
      setDeferredPrompt(e)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // If app is already installed, hide the banner
    window.addEventListener('appinstalled', () => {
      setVisible(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setVisible(false)
    }
    // Whether accepted or dismissed by native dialog, clear the deferred prompt
    setDeferredPrompt(null)
  }

  function handleDismiss() {
    setVisible(false)
    setDeferredPrompt(null)
    // Remember dismissal — don't show again this session or next
    localStorage.setItem('pwa_dismissed', 'true')
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 48px)',
      maxWidth: '420px',
      background: '#161616',
      border: '1px solid rgba(79,70,229,0.35)',
      borderRadius: '14px',
      padding: '16px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(79,70,229,0.1)',
      zIndex: 9999,
      animation: 'bannerSlideUp 300ms cubic-bezier(0.16, 1, 0.3, 1) both',
      fontFamily: "'DM Mono', monospace",
    }}>

      {/* Icon */}
      <div style={{
        width: '42px',
        height: '42px',
        borderRadius: '10px',
        background: 'rgba(79,70,229,0.15)',
        border: '1px solid rgba(79,70,229,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <img
          src="/icon-192.png"
          alt="NotesMind"
          style={{ width: '28px', height: '28px', borderRadius: '6px' }}
        />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '13px',
          fontWeight: 600,
          color: '#f0f0f0',
          fontFamily: "'Syne', sans-serif",
          marginBottom: '2px',
        }}>
          Add to Home Screen
        </div>
        <div style={{
          fontSize: '11px',
          color: '#666',
          lineHeight: 1.4,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          Use NotesMind as an app — offline ready
        </div>
      </div>

      {/* Install button */}
      <button
        onClick={handleInstall}
        style={{
          background: '#4f46e5',
          border: 'none',
          borderRadius: '8px',
          color: '#ffffff',
          fontSize: '12px',
          fontFamily: "'DM Mono', monospace",
          padding: '8px 14px',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'background 150ms, transform 150ms',
          fontWeight: 500,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#4338ca' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#4f46e5' }}
      >
        Install
      </button>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        style={{
          background: 'none',
          border: 'none',
          color: '#444',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'color 150ms',
          lineHeight: 1,
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#888' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#444' }}
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <style>{`
        @keyframes bannerSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}