// frontend/src/components/RightPanel.jsx

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { streamQuestion } from '../lib/api'

// ─── Markdown renderer config ────────────────────────────────────────────────

const MD_COMPONENTS = {
  h2: ({ children }) => (
    <h2 style={{
      fontSize: '15px', fontWeight: 700, color: '#ffffff',
      margin: '18px 0 8px 0', paddingBottom: '6px',
      borderBottom: '1px solid #2a2a2a',
      fontFamily: "'Syne', sans-serif", letterSpacing: '-0.01em',
    }}>{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 style={{
      fontSize: '13px', fontWeight: 600, color: '#a5b4fc',
      margin: '14px 0 6px 0', fontFamily: "'Syne', sans-serif",
      textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>{children}</h3>
  ),
  p: ({ children }) => (
    <p style={{ margin: '0 0 10px 0', lineHeight: 1.8, color: '#e5e5e5' }}>{children}</p>
  ),
  ul: ({ children }) => (
    <ul style={{ margin: '4px 0 12px 0', paddingLeft: '0', listStyle: 'none' }}>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol style={{ margin: '4px 0 12px 0', paddingLeft: '20px' }}>{children}</ol>
  ),
  li: ({ children }) => (
    <li style={{
      display: 'flex', alignItems: 'flex-start', gap: '8px',
      marginBottom: '6px', lineHeight: 1.7, color: '#e5e5e5',
    }}>
      <span style={{
        width: '5px', height: '5px', borderRadius: '50%',
        background: '#4f46e5', flexShrink: 0, marginTop: '8px',
      }} />
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => (
    <strong style={{ color: '#ffffff', fontWeight: 600 }}>{children}</strong>
  ),
  code: ({ inline, children }) =>
    inline ? (
      <code style={{
        background: '#2a2a2a', padding: '2px 6px', borderRadius: '4px',
        fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#a5b4fc',
      }}>{children}</code>
    ) : (
      <pre style={{
        background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: '8px',
        padding: '16px', overflowX: 'auto', margin: '12px 0',
      }}>
        <code style={{ fontFamily: "'DM Mono', monospace", fontSize: '13px', color: '#e5e5e5' }}>
          {children}
        </code>
      </pre>
    ),
  blockquote: ({ children }) => (
    <blockquote style={{
      borderLeft: '3px solid #4f46e5', margin: '12px 0', padding: '8px 16px',
      background: 'rgba(79,70,229,0.08)', borderRadius: '0 6px 6px 0',
      color: '#a5b4fc', fontStyle: 'italic',
    }}>{children}</blockquote>
  ),
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function UserBubble({ text }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', animation: 'msgAppear 0.2s ease both' }}>
      <div style={{
        maxWidth: '75%', padding: '11px 16px',
        borderRadius: '18px 18px 4px 18px',
        background: '#4f46e5', color: '#ffffff',
        fontSize: '15px', lineHeight: 1.6,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        {text}
      </div>
    </div>
  )
}

function AiBubble({ text, isStreaming }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px', animation: 'msgAppear 0.2s ease both' }}>
      <div style={{
        maxWidth: '75%', padding: '12px 16px',
        borderRadius: '18px 18px 18px 4px',
        background: '#1a1a1a', border: '1px solid #222',
        color: '#e5e5e5', fontSize: '15px', lineHeight: 1.6,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        <ReactMarkdown components={MD_COMPONENTS}>{text}</ReactMarkdown>
        {isStreaming && (
          <span style={{
            display: 'inline-block', width: '8px', height: '15px',
            background: '#4f46e5', borderRadius: '2px', marginLeft: '2px',
            verticalAlign: 'middle', animation: 'cursorBlink 0.8s ease infinite',
          }} />
        )}
      </div>
    </div>
  )
}

function AuthPromptBubble({ onOpenLogin }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px', animation: 'msgAppear 0.2s ease both' }}>
      <div style={{
        maxWidth: '75%', padding: '12px 16px',
        borderRadius: '18px 18px 18px 4px',
        background: 'rgba(79,70,229,0.08)',
        border: '1px solid rgba(79,70,229,0.25)',
        display: 'flex', alignItems: 'center',
        gap: '12px', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '13px', color: '#a5b4fc', lineHeight: 1.5 }}>
          Sign in to start asking questions.
        </span>
        <button
          onClick={onOpenLogin}
          style={{
            background: 'rgba(79,70,229,0.2)', border: '1px solid rgba(79,70,229,0.4)',
            borderRadius: '6px', color: '#a5b4fc', fontSize: '12px',
            padding: '4px 12px', cursor: 'pointer',
            fontFamily: "'DM Mono', monospace",
            whiteSpace: 'nowrap', transition: 'background 150ms',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,70,229,0.35)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(79,70,229,0.2)'}
        >
          Sign in →
        </button>
      </div>
    </div>
  )
}

function ThinkingBubble() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px', animation: 'msgAppear 0.2s ease both' }}>
      <div style={{
        padding: '14px 18px', borderRadius: '18px 18px 18px 4px',
        background: '#1a1a1a', border: '1px solid #222',
        display: 'flex', gap: '6px', alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: '6px', height: '6px', borderRadius: '50%', background: '#555',
            animation: `thinkDot 1.2s ease ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function RightPanel({ token, onOpenLogin, isMobile, onOpenDrawer, activeDoc }) {
  const [messages, setMessages]           = useState([])
  const [streamingText, setStreamingText] = useState('')
  const [isThinking, setIsThinking]       = useState(false)
  const [isStreaming, setIsStreaming]      = useState(false)
  const [input, setInput]                 = useState('')
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const bottomRef                         = useRef(null)
  const streamBufferRef                   = useRef('')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText, isThinking])

  function sendMessage() {
    const question = input.trim()
    if (!question || isThinking || isStreaming) return

    if (!token) {
      setMessages(prev => [...prev, { role: 'user', text: question }])
      setMessages(prev => [...prev, { role: 'auth' }])
      setInput('')
      return
    }

    setMessages(prev => [...prev, { role: 'user', text: question }])
    setInput('')
    setIsThinking(true)
    setStreamingText('')
    streamBufferRef.current = ''

    streamQuestion(
      question, token,
      (token) => {
        setIsThinking(false)
        setIsStreaming(true)
        streamBufferRef.current += token
        setStreamingText(streamBufferRef.current)
      },
      () => {
        const finalText = streamBufferRef.current
        streamBufferRef.current = ''
        setIsStreaming(false)
        setStreamingText('')
        if (finalText.trim()) {
          setMessages(msgs => [...msgs, { role: 'ai', text: finalText }])
        }
      },
      (errMsg) => {
        streamBufferRef.current = ''
        setIsThinking(false)
        setIsStreaming(false)
        setStreamingText('')
        setMessages(msgs => [...msgs, { role: 'ai', text: `Error: ${errMsg}` }])
      }
    )
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function clearChat() {
    setMessages([])
    setStreamingText('')
    setIsThinking(false)
    setIsStreaming(false)
    setShowClearConfirm(false)
  }

  const isBusy = isThinking || isStreaming

  return (
    <div style={{
      // On mobile: take full width. On desktop: flex-1 as before.
      flex: 1,
      width: isMobile ? '100%' : undefined,
      display: 'flex',
      flexDirection: 'column',
      background: '#080808',
      fontFamily: "'DM Mono', monospace",
      overflow: 'hidden',
    }}>

      {/* ── Header ── */}
      <div style={{
        height: '52px',
        padding: '0 16px',
        borderBottom: '1px solid #1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

          {/* Hamburger button — mobile only */}
          {isMobile && (
            <button
              onClick={onOpenDrawer}
              style={{
                background: 'none',
                border: '1px solid #2a2a2a',
                color: '#555',
                width: '32px',
                height: '32px',
                borderRadius: '7px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'border-color 150ms, color 150ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.color = '#a5b4fc' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#555' }}
            >
              {/* Hamburger icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6"  x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          )}

          <div style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: '#4f46e5', boxShadow: '0 0 6px rgba(79,70,229,0.8)',
            animation: 'pulseDot 2s ease infinite',
          }} />
          <span style={{
            fontSize: '13px', color: '#f0f0f0',
            fontFamily: "'Syne', sans-serif", fontWeight: 600,
          }}>
            NotesMind
          </span>
         <span style={{ fontSize: '13px', color: '#555' }}>/</span>
          {activeDoc ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(79,70,229,0.12)',
              border: '1px solid rgba(79,70,229,0.35)',
              borderRadius: '100px', padding: '3px 10px 3px 7px',
              maxWidth: '200px',
            }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#4f46e5', flexShrink: 0,
                boxShadow: '0 0 6px rgba(79,70,229,0.8)',
              }} />
              <span style={{
                fontSize: '12px', color: '#a5b4fc',
                whiteSpace: 'nowrap', overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontFamily: "'DM Mono', monospace",
              }}>
                {activeDoc}
              </span>
            </div>
          ) : (
            <span style={{ fontSize: '13px', color: '#555' }}>Chat</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Hide model label on mobile to save space */}
          {!isMobile && (
            <div style={{ fontSize: '11px', color: '#555' }}>Llama 3.1 · Groq</div>
          )}

          {/* Sign in button — only when not logged in */}
          {!token && (
            <button
              onClick={onOpenLogin}
              style={{
                fontSize: '11px', color: '#a5b4fc',
                border: '1px solid rgba(79,70,229,0.35)',
                padding: '3px 10px', borderRadius: '5px',
                background: 'rgba(79,70,229,0.08)',
                cursor: 'pointer', fontFamily: "'DM Mono', monospace",
                transition: 'background 150ms, border-color 150ms, color 150ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(79,70,229,0.18)'; e.currentTarget.style.borderColor = 'rgba(79,70,229,0.6)'; e.currentTarget.style.color = '#ffffff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(79,70,229,0.08)'; e.currentTarget.style.borderColor = 'rgba(79,70,229,0.35)'; e.currentTarget.style.color = '#a5b4fc' }}
            >
              Sign in
            </button>
          )}

          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              style={{
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.35)',
                color: '#f87171',
                fontSize: '11px', padding: '4px 12px', borderRadius: '5px',
                cursor: 'pointer', fontFamily: "'DM Mono', monospace",
                transition: 'border-color 150ms, color 150ms, background 150ms',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(248,113,113,0.18)'
                e.currentTarget.style.borderColor = 'rgba(248,113,113,0.6)'
                e.currentTarget.style.color = '#ffffff'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(248,113,113,0.08)'
                e.currentTarget.style.borderColor = 'rgba(248,113,113,0.35)'
                e.currentTarget.style.color = '#f87171'
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3,6 5,6 21,6"/>
                <path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6"/>
                <path d="M10,11v6M14,11v6"/>
              </svg>
              clear
            </button>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: '#1a1a1a', border: '1px solid #2a2a2a',
              borderRadius: '6px', padding: '4px 8px',
              animation: 'msgAppear 0.15s ease both',
            }}>
              <span style={{ fontSize: '11px', color: '#888', whiteSpace: 'nowrap' }}>
                Clear chat?
              </span>
              <button
                onClick={clearChat}
                style={{
                  background: 'rgba(248,113,113,0.15)',
                  border: '1px solid rgba(248,113,113,0.4)',
                  color: '#f87171', fontSize: '11px', padding: '2px 8px',
                  borderRadius: '4px', cursor: 'pointer',
                  fontFamily: "'DM Mono', monospace",
                  transition: 'background 150ms',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.28)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,113,113,0.15)'}
              >
                yes
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{
                  background: 'none', border: '1px solid #333',
                  color: '#555', fontSize: '11px', padding: '2px 8px',
                  borderRadius: '4px', cursor: 'pointer',
                  fontFamily: "'DM Mono', monospace",
                  transition: 'border-color 150ms, color 150ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#888' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#555' }}
              >
                no
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {messages.length === 0 && !isBusy && (
          <div style={{
            textAlign: 'center', marginTop: '80px',
            fontSize: '14px', color: '#555', lineHeight: 1.7,
          }}>
            Upload a PDF from the left panel.<br />Then ask anything about it.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {messages.map((msg, i) => {
            if (msg.role === 'user') return <UserBubble key={i} text={msg.text} />
            if (msg.role === 'auth') return <AuthPromptBubble key={i} onOpenLogin={onOpenLogin} />
            return <AiBubble key={i} text={msg.text} isStreaming={false} />
          })}

          {isStreaming && streamingText && (
            <AiBubble text={streamingText} isStreaming={true} />
          )}
          {isThinking && <ThinkingBubble />}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input bar ── */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #1a1a1a',
        background: '#0f0f0f',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
            placeholder="Ask a question about your documents..."
            style={{
              flex: 1, background: '#161616', border: '1px solid #222222',
              color: '#f0f0f0', fontFamily: "'DM Mono', monospace",
              fontSize: '13px', padding: '11px 14px', borderRadius: '8px',
              outline: 'none', height: '44px', transition: 'border-color 150ms',
              opacity: isBusy ? 0.5 : 1,
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(79,70,229,0.5)'}
            onBlur={e => e.target.style.borderColor = '#222222'}
          />
          <button
            onClick={sendMessage}
            disabled={isBusy || !input.trim()}
            style={{
              width: '44px', height: '44px', borderRadius: '8px', border: 'none',
              background: isBusy || !input.trim() ? 'rgba(79,70,229,0.25)' : '#4f46e5',
              color: 'white',
              cursor: isBusy || !input.trim() ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'background 150ms, transform 150ms',
            }}
            onMouseEnter={e => { if (!isBusy && input.trim()) e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ width: '16px', height: '16px' }}>
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22,2 15,22 11,13 2,9"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes pulseDot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @keyframes msgAppear {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes thinkDot {
          0%, 60%, 100% { transform: translateY(0);    opacity: 0.4; }
          30%           { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0; }
        }
      `}</style>
    </div>
  )
}