// frontend/src/App.jsx

import { useState } from 'react'
import LoginPage from './components/LoginPage'
import AppSection from './sections/AppSection'
import HeroSection from './sections/HeroSection'

export default function App() {
  // Read token from localStorage on first render — survives page refresh
  const [token, setToken]         = useState(() => localStorage.getItem('nm_token'))
  const [userName, setUserName]   = useState(() => localStorage.getItem('nm_name') || '')
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('nm_email') || '')
  const [showModal, setShowModal] = useState(false)

  function handleLogin(jwt, name, email) {
    // Persist to localStorage so refresh doesn't log the user out
    localStorage.setItem('nm_token', jwt)
    localStorage.setItem('nm_name', name)
    localStorage.setItem('nm_email', email)

    setToken(jwt)
    setUserName(name)
    setUserEmail(email)
    setShowModal(false)

    setTimeout(() => {
      document.getElementById('app')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  function handleLogout() {
    // Clear localStorage on logout
    localStorage.removeItem('nm_token')
    localStorage.removeItem('nm_name')
    localStorage.removeItem('nm_email')

    setToken(null)
    setUserName('')
    setUserEmail('')
  }

  function handleStartUsing() {
    if (token) {
      document.getElementById('app')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      setShowModal(true)
    }
  }

  function openLoginModal() {
    setShowModal(true)
  }

  return (
    <>
      <HeroSection onStartUsing={handleStartUsing} isLoggedIn={!!token} />

      <AppSection
        token={token}
        onLogout={handleLogout}
        onOpenLogin={openLoginModal}
      />

      {showModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={() => setShowModal(false)}
            style={{
              position: 'absolute',
              top: '24px',
              right: '28px',
              background: 'none',
              border: '1px solid #2a2a2a',
              color: '#555',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'border-color 150ms, color 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#e5e5e5' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#555' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          <LoginPage onLogin={handleLogin} isModal={true} />
        </div>
      )}
    </>
  )
}