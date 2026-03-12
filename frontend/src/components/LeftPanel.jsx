// frontend/src/components/LeftPanel.jsx

import { useState, useEffect, useRef } from 'react'
import { uploadPDF, getDocuments, resetIndex } from '../lib/api'

export default function LeftPanel({
  token,
  onOpenLogin,
  onLogout,
  userName,
  userEmail,
  userPicture,
  isMobile,
  drawerOpen,
  onCloseDrawer,
}) {
  const [file, setFile]                 = useState(null)
  const [uploading, setUploading]       = useState(false)
  const [progress, setProgress]         = useState(0)
  const [status, setStatus]             = useState(null)
  const [documents, setDocuments]       = useState([])
  const [dragOver, setDragOver]         = useState(false)
  const [resetting, setResetting]       = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef                     = useRef(null)

  useEffect(() => {
    if (token) fetchDocs()
  }, [token])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  async function fetchDocs() {
    try {
      const res = await getDocuments(token)
      setDocuments(res.data.documents ?? [])
    } catch {
      setDocuments([])
    }
  }

  async function handleUpload() {
    if (!file) return
    if (!token) {
      setStatus({ type: 'auth', text: 'Sign in to upload documents.' })
      return
    }
    setUploading(true)
    setProgress(0)
    setStatus(null)

    const interval = setInterval(() => {
      setProgress(prev => prev < 90 ? prev + 2 : prev)
    }, 100)

    try {
      const res = await uploadPDF(file, token)
      clearInterval(interval)
      setProgress(100)
      setStatus({ type: 'ok', text: res.data.message ?? 'Indexed successfully.' })
      setFile(null)
      await fetchDocs()
    } catch (err) {
      clearInterval(interval)
      setStatus({ type: 'err', text: err?.response?.data?.detail ?? 'Upload failed.' })
    } finally {
      setUploading(false)
    }
  }

  async function handleReset() {
    if (resetting) return
    setResetting(true)
    setStatus(null)
    try {
      await resetIndex(token)
      setDocuments([])
      setFile(null)
      setStatus({ type: 'ok', text: 'Index cleared.' })
    } catch {
      setStatus({ type: 'err', text: 'Reset failed.' })
    } finally {
      setResetting(false)
    }
  }

  function handleFileChange(e) {
    const f = e.target.files[0]
    if (f) { setFile(f); setStatus(null) }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f && f.name.endsWith('.pdf')) { setFile(f); setStatus(null) }
  }

  function handleLogoutClick() {
    setDropdownOpen(false)
    onLogout()
  }

  const firstName = userName ? userName.split(' ')[0] : ''
  const initial   = userName ? userName.charAt(0).toUpperCase() : '?'
  const circumference = 2 * Math.PI * 30

  // ── Mobile: panel is a fixed overlay drawer ──────────────────────────────
  const panelStyle = isMobile ? {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    width: '300px',
    zIndex: 200,
    transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 280ms cubic-bezier(0.4, 0, 0.2, 1)',
    background: '#0f0f0f',
    borderRight: '1px solid #222222',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: "'DM Mono', monospace",
  } : {
    // ── Desktop: normal static panel ──────────────────────────────────────
    width: '300px',
    minWidth: '300px',
    background: '#0f0f0f',
    borderRight: '1px solid #222222',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: "'DM Mono', monospace",
    position: 'relative',
  }

  const panel = (
    <div style={panelStyle}>

      {/* ── Header ── */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #222222',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: '15px', fontWeight: 700,
          color: '#f0f0f0', letterSpacing: '-0.02em',
        }}>
          Notes<span style={{ color: '#4f46e5' }}>Mind</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Version badge — hidden on mobile to save space */}
          {!isMobile && (
            <div style={{
              fontSize: '10px', color: '#555', letterSpacing: '0.1em',
              border: '1px solid #2a2a2a', padding: '2px 8px', borderRadius: '100px',
            }}>
              v0.5
            </div>
          )}

          {/* Not logged in — Sign in button */}
          {!token && (
            <button
              onClick={onOpenLogin}
              style={{
                fontSize: '10px', color: '#a5b4fc', letterSpacing: '0.05em',
                border: '1px solid rgba(79,70,229,0.35)', padding: '2px 10px',
                borderRadius: '100px', background: 'rgba(79,70,229,0.08)',
                cursor: 'pointer', fontFamily: "'DM Mono', monospace",
                transition: 'background 150ms, border-color 150ms, color 150ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(79,70,229,0.18)'; e.currentTarget.style.borderColor = 'rgba(79,70,229,0.6)'; e.currentTarget.style.color = '#ffffff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(79,70,229,0.08)'; e.currentTarget.style.borderColor = 'rgba(79,70,229,0.35)'; e.currentTarget.style.color = '#a5b4fc' }}
            >
              Sign in
            </button>
          )}

          {/* Logged in — Avatar + dropdown */}
          {token && (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(prev => !prev)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: '3px', background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden',
                  border: `2px solid ${dropdownOpen ? 'rgba(79,70,229,0.8)' : 'rgba(79,70,229,0.3)'}`,
                  transition: 'border-color 150ms', flexShrink: 0,
                }}>
                  {userPicture ? (
                    <img src={userPicture} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%', background: 'rgba(79,70,229,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontWeight: 600, color: '#a5b4fc',
                      fontFamily: "'Syne', sans-serif",
                    }}>
                      {initial}
                    </div>
                  )}
                </div>
                <span style={{
                  fontSize: '9px', color: '#555', letterSpacing: '0.05em',
                  maxWidth: '48px', overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap', lineHeight: 1,
                }}>
                  {firstName}
                </span>
              </button>

              {/* Floating dropdown */}
              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  width: '220px', background: '#161616', border: '1px solid #2a2a2a',
                  borderRadius: '12px', boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                  zIndex: 300, overflow: 'hidden',
                  animation: 'dropdownAppear 150ms ease both',
                }}>
                  <div style={{
                    padding: '16px', display: 'flex', alignItems: 'center',
                    gap: '12px', borderBottom: '1px solid #222',
                  }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden',
                      border: '2px solid rgba(79,70,229,0.3)', flexShrink: 0,
                    }}>
                      {userPicture ? (
                        <img src={userPicture} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%', background: 'rgba(79,70,229,0.3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '16px', fontWeight: 600, color: '#a5b4fc',
                          fontFamily: "'Syne', sans-serif",
                        }}>
                          {initial}
                        </div>
                      )}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{
                        fontSize: '13px', fontWeight: 600, color: '#f0f0f0',
                        fontFamily: "'Syne', sans-serif",
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {userName}
                      </div>
                      <div style={{
                        fontSize: '11px', color: '#555', marginTop: '2px',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {userEmail}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    padding: '10px 16px', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', borderBottom: '1px solid #1a1a1a',
                    opacity: 0.4, cursor: 'not-allowed',
                  }}>
                    <span style={{ fontSize: '12px', color: '#888' }}>Chat History</span>
                    <span style={{
                      fontSize: '9px', color: '#555', border: '1px solid #2a2a2a',
                      padding: '1px 6px', borderRadius: '100px', letterSpacing: '0.05em',
                    }}>soon</span>
                  </div>

                  <button
                    onClick={handleLogoutClick}
                    style={{
                      width: '100%', padding: '10px 16px', background: 'none',
                      border: 'none', textAlign: 'left', fontSize: '12px', color: '#888',
                      cursor: 'pointer', fontFamily: "'DM Mono', monospace",
                      transition: 'background 150ms, color 150ms',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; e.currentTarget.style.color = '#f87171' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#888' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16,17 21,12 16,7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Close button — mobile only */}
          {isMobile && (
            <button
              onClick={onCloseDrawer}
              style={{
                background: 'none', border: '1px solid #2a2a2a', color: '#555',
                width: '28px', height: '28px', borderRadius: '6px',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', transition: 'border-color 150ms, color 150ms',
                flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#e5e5e5' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#555' }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Upload section ── */}
      <div style={{ padding: '20px', borderBottom: '1px solid #222222' }}>
        <div style={{
          fontSize: '10px', letterSpacing: '0.15em',
          textTransform: 'uppercase', color: '#555', marginBottom: '12px',
        }}>
          Upload Document
        </div>

        {!file && !uploading && (
          <div
            onClick={() => document.getElementById('file-input').click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `1px dashed ${dragOver ? '#4f46e5' : '#2a2a2a'}`,
              borderRadius: '10px', padding: '24px 16px', textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? 'rgba(79,70,229,0.15)' : '#161616',
              marginBottom: '12px',
              transition: 'border-color 200ms, background 200ms',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3, color: '#f0f0f0' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <div style={{ fontSize: '12px', color: '#888', lineHeight: 1.5 }}>
              <strong style={{ color: '#f0f0f0', fontWeight: 500, display: 'block', marginBottom: '2px' }}>
                Drop PDF here
              </strong>
              or click to browse
            </div>
          </div>
        )}

        <input id="file-input" type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />

        {file && !uploading && (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '10px',
    background: '#161616', border: '1px solid rgba(79,70,229,0.3)',
    borderRadius: '8px', padding: '10px 12px', marginBottom: '12px',
  }}>
    <div style={{
      width: '28px', height: '28px', background: 'rgba(79,70,229,0.15)',
      borderRadius: '6px', display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0,
    }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" style={{ width: '14px', height: '14px' }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
      </svg>
    </div>
    <div style={{ overflow: 'hidden', flex: 1 }}>
      <div style={{ fontSize: '12px', color: '#f0f0f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {file.name}
      </div>
      <div style={{ fontSize: '11px', color: '#555' }}>
        {(file.size / 1024 / 1024).toFixed(1)} MB
      </div>
    </div>
    <button
      onClick={() => {
        setFile(null)
        setStatus(null)
        document.getElementById('file-input').value = ''
      }}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#555', padding: '4px', borderRadius: '4px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'color 150ms',
      }}
      onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
      onMouseLeave={e => e.currentTarget.style.color = '#555'}
      title="Remove file"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  </div>
)}

        {uploading && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: '10px', padding: '12px 0', marginBottom: '12px',
          }}>
            <div style={{ position: 'relative', width: '72px', height: '72px' }}>
              <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                <circle cx="36" cy="36" r="30" fill="none" stroke="#4f46e5" strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (progress / 100) * circumference}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '13px', color: '#f0f0f0',
                fontFamily: "'DM Mono', monospace",
              }}>
                {progress}%
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#555', textAlign: 'center', lineHeight: 1.5 }}>
              Indexing document...
            </div>
          </div>
        )}

        {status && status.type !== 'auth' && (
          <div style={{
            fontSize: '12px', marginBottom: '12px', padding: '8px 12px', borderRadius: '6px',
            color: status.type === 'ok' ? '#4f46e5' : '#f87171',
            background: status.type === 'ok' ? 'rgba(79,70,229,0.1)' : 'rgba(248,113,113,0.1)',
            border: `1px solid ${status.type === 'ok' ? 'rgba(79,70,229,0.3)' : 'rgba(248,113,113,0.2)'}`,
          }}>
            {status.text}
          </div>
        )}

        {status && status.type === 'auth' && (
          <div style={{
            fontSize: '12px', marginBottom: '12px', padding: '10px 12px', borderRadius: '6px',
            color: '#a5b4fc', background: 'rgba(79,70,229,0.08)',
            border: '1px solid rgba(79,70,229,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
          }}>
            <span>{status.text}</span>
            <button
              onClick={onOpenLogin}
              style={{
                background: 'rgba(79,70,229,0.2)', border: '1px solid rgba(79,70,229,0.4)',
                borderRadius: '4px', color: '#a5b4fc', fontSize: '11px',
                padding: '3px 8px', cursor: 'pointer', fontFamily: "'DM Mono', monospace",
                whiteSpace: 'nowrap', transition: 'background 150ms',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,70,229,0.35)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(79,70,229,0.2)'}
            >
              Sign in →
            </button>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          style={{
            width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
            background: !file || uploading ? 'rgba(79,70,229,0.3)' : '#4f46e5',
            color: 'white', fontSize: '13px', fontFamily: "'DM Mono', monospace",
            cursor: !file || uploading ? 'default' : 'pointer',
            transition: 'background 150ms',
          }}
        >
          {uploading ? 'Indexing...' : 'Upload'}
        </button>
      </div>

      {/* ── Document list ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          padding: '14px 20px 10px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#555' }}>
            Indexed Documents
          </div>
          {documents.length > 0 && (
            <button
              onClick={handleReset}
              disabled={resetting}
              style={{
                background: 'none', border: '1px solid #222', color: resetting ? '#333' : '#555',
                fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
                cursor: resetting ? 'default' : 'pointer', fontFamily: "'DM Mono', monospace",
                letterSpacing: '0.05em', transition: 'border-color 150ms, color 150ms',
              }}
              onMouseEnter={e => { if (!resetting) { e.currentTarget.style.borderColor = '#f87171'; e.currentTarget.style.color = '#f87171' } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.color = '#555' }}
            >
              {resetting ? 'clearing...' : 'reset'}
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {documents.length === 0 ? (
            <div style={{ padding: '0 20px', fontSize: '13px', color: '#555' }}>
              No documents yet.
            </div>
          ) : (
            documents.map((doc, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 20px', borderBottom: '1px solid #1a1a1a',
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4f46e5', flexShrink: 0 }} />
                <div style={{
                  fontSize: '13px', color: '#e5e5e5', overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                }}>
                  {doc}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes dropdownAppear {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )

  // On mobile: wrap panel with backdrop overlay
  if (isMobile) {
    return (
      <>
        {/* Backdrop — only visible when drawer is open */}
        {drawerOpen && (
          <div
            onClick={onCloseDrawer}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              zIndex: 199,
            }}
          />
        )}
        {panel}
      </>
    )
  }

  return panel
}