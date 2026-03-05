// frontend/src/sections/AppSection.jsx

import LeftPanel from '../components/LeftPanel'
import RightPanel from '../components/RightPanel'

export default function AppSection({ token, onLogout, onOpenLogin }) {
  return (
    <section id="app" style={{
      position: 'relative',
      height: '100vh',
      display: 'flex',
      zIndex: 1,
      borderTop: '1px solid #222222',
      background: '#080808',
    }}>
      <LeftPanel token={token} onOpenLogin={onOpenLogin} />
      <RightPanel token={token} onOpenLogin={onOpenLogin} />
    </section>
  )
}