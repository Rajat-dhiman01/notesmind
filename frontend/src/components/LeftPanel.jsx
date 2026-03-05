// frontend/src/components/LeftPanel.jsx

import { useState, useEffect } from 'react'
import { uploadPDF, getDocuments, resetIndex } from '../lib/api'

export default function LeftPanel({ token, onOpenLogin }) {
  const [file, setFile]           = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)
  const [status, setStatus]       = useState(null)
  const [documents, setDocuments] = useState([])
  const [dragOver, setDragOver]   = useState(false)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    if (token) fetchDocs()
  }, [token])

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

    // Not logged in — show inline prompt instead of silently failing
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

  const circumference = 2 * Math.PI * 30

  return (
    <div style={{
      width: '300px',
      minWidth: '300px',
      background: '#0f0f0f',
      borderRight: '1px solid #222222',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: "'DM Mono', monospace",
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid #222222',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: '15px',
          fontWeight: 700,
          color: '#f0f0f0',
          letterSpacing: '-0.02em',
        }}>
          Notes<span style={{ color: '#4f46e5' }}>Mind</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Version badge */}
          <div style={{
            fontSize: '10px',
            color: '#555',
            letterSpacing: '0.1em',
            border: '1px solid #2a2a2a',
            padding: '2px 8px',
            borderRadius: '100px',
          }}>
            v0.5
          </div>

          {/* Sign in button — only shown when not logged in */}
          {!token && (
            <button
              onClick={onOpenLogin}
              style={{
                fontSize: '10px',
                color: '#a5b4fc',
                letterSpacing: '0.05em',
                border: '1px solid rgba(79,70,229,0.35)',
                padding: '2px 10px',
                borderRadius: '100px',
                background: 'rgba(79,70,229,0.08)',
                cursor: 'pointer',
                fontFamily: "'DM Mono', monospace",
                transition: 'background 150ms, border-color 150ms, color 150ms',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(79,70,229,0.18)'
                e.currentTarget.style.borderColor = 'rgba(79,70,229,0.6)'
                e.currentTarget.style.color = '#ffffff'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(79,70,229,0.08)'
                e.currentTarget.style.borderColor = 'rgba(79,70,229,0.35)'
                e.currentTarget.style.color = '#a5b4fc'
              }}
            >
              Sign in
            </button>
          )}
        </div>
      </div>

      {/* ── Upload section ── */}
      <div style={{ padding: '20px', borderBottom: '1px solid #222222' }}>
        <div style={{
          fontSize: '10px',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: '#555',
          marginBottom: '12px',
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
              borderRadius: '10px',
              padding: '24px 16px',
              textAlign: 'center',
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

        <input
          id="file-input"
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

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
              <svg viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"
                style={{ width: '14px', height: '14px' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '12px', color: '#f0f0f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {file.name}
              </div>
              <div style={{ fontSize: '11px', color: '#555' }}>
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </div>
            </div>
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

        {/* Status messages */}
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

        {/* Auth prompt — shown when upload attempted without token */}
        {status && status.type === 'auth' && (
          <div style={{
            fontSize: '12px',
            marginBottom: '12px',
            padding: '10px 12px',
            borderRadius: '6px',
            color: '#a5b4fc',
            background: 'rgba(79,70,229,0.08)',
            border: '1px solid rgba(79,70,229,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}>
            <span>{status.text}</span>
            <button
              onClick={onOpenLogin}
              style={{
                background: 'rgba(79,70,229,0.2)',
                border: '1px solid rgba(79,70,229,0.4)',
                borderRadius: '4px',
                color: '#a5b4fc',
                fontSize: '11px',
                padding: '3px 8px',
                cursor: 'pointer',
                fontFamily: "'DM Mono', monospace",
                whiteSpace: 'nowrap',
                transition: 'background 150ms',
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#555' }}>
            Indexed Documents
          </div>

          {documents.length > 0 && (
            <button
              onClick={handleReset}
              disabled={resetting}
              style={{
                background: 'none', border: '1px solid #222',
                color: resetting ? '#333' : '#555',
                fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
                cursor: resetting ? 'default' : 'pointer',
                fontFamily: "'DM Mono', monospace",
                letterSpacing: '0.05em',
                transition: 'border-color 150ms, color 150ms',
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
    </div>
  )
}