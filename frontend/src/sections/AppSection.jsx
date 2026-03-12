// frontend/src/sections/AppSection.jsx

import { useState, useEffect } from 'react'
import LeftPanel from '../components/LeftPanel'
import RightPanel from '../components/RightPanel'

export default function AppSection({
  token,
  onLogout,
  onOpenLogin,
  userName,
  userEmail,
  userPicture,
}) {
 const [drawerOpen, setDrawerOpen] = useState(false)
  const [isMobile, setIsMobile]     = useState(window.innerWidth <= 768)
  const [activeDoc, setActiveDoc]   = useState(null)
  // Update isMobile on window resize
  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      // Close drawer automatically when switching to desktop
      if (!mobile) setDrawerOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Prevent body scroll when drawer is open on mobile
  useEffect(() => {
    if (isMobile && drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isMobile, drawerOpen])

  return (
    <section id="app" style={{
      position: 'relative',
      height: '100vh',
      display: 'flex',
      zIndex: 1,
      borderTop: '1px solid #222222',
      background: '#080808',
    }}>
      <LeftPanel
        token={token}
        onOpenLogin={onOpenLogin}
        onLogout={onLogout}
        userName={userName}
        userEmail={userEmail}
        userPicture={userPicture}
        isMobile={isMobile}
        drawerOpen={drawerOpen}
        onCloseDrawer={() => setDrawerOpen(false)}
        onActiveDocChange={setActiveDoc}
      />
      <RightPanel
  token={token}
  onOpenLogin={onOpenLogin}
  isMobile={isMobile}
  onOpenDrawer={() => setDrawerOpen(true)}
  activeDoc={activeDoc}
/>
    </section>
  )
}