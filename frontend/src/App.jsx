// frontend/src/App.jsx

import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import LoginPage from './components/LoginPage'
import AppSection from './sections/AppSection'
import HeroSection from './sections/HeroSection'
import HowItWorksPage from './pages/HowItWorksPage'

export default function App() {
  const [token, setToken]             = useState(() => localStorage.getItem('nm_token'))
  const [userName, setUserName]       = useState(() => localStorage.getItem('nm_name') || '')
  const [userEmail, setUserEmail]     = useState(() => localStorage.getItem('nm_email') || '')
  const [userPicture, setUserPicture] = useState(() => localStorage.getItem('nm_picture') || null)
  const [showModal, setShowModal]     = useState(false)

  const navigate = useNavigate()

  // ── JWT expiry check on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (!token) return
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.exp * 1000 < Date.now()) {
        clearAuth()
      }
    } catch {
      clearAuth()
    }
  }, [])

  function clearAuth() {
    localStorage.removeItem('nm_token')
    localStorage.removeItem('nm_name')
    localStorage.removeItem('nm_email')
    localStorage.removeItem('nm_picture')
    setToken(null)
    setUserName('')
    setUserEmail('')
    setUserPicture(null)
  }

  function handleLogin(jwt, name, email, picture) {
    localStorage.setItem('nm_token', jwt)
    localStorage.setItem('nm_name', name)
    localStorage.setItem('nm_email', email)
    if (picture) {
      localStorage.setItem('nm_picture', picture)
    } else {
      localStorage.removeItem('nm_picture')
    }

    setToken(jwt)
    setUserName(name)
    setUserEmail(email)
    setUserPicture(picture || null)
    setShowModal(false)

    setTimeout(() => {
      document.getElementById('app')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  function handleLogout() {
    clearAuth()
  }

  function handleStartUsing() {
    if (token) {
      document.getElementById('app')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      setShowModal(true)
    }
  }

  function handleLearnMore() {
    navigate('/how-it-works')
  }

  function openLoginModal() {
    setShowModal(true)
  }

  // ── Main page — Hero + App ─────────────────────────────────────────────────
  const MainPage = (
    <>
      <HeroSection
        onStartUsing={handleStartUsing}
        isLoggedIn={!!token}
        onLearnMore={handleLearnMore}
      />

      <AppSection
        token={token}
        onLogout={handleLogout}
        onOpenLogin={openLoginModal}
        userName={userName}
        userEmail={userEmail}
        userPicture={userPicture}
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

  return (
    <Routes>
      <Route path="/" element={MainPage} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
    </Routes>
  )
}     