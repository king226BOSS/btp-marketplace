import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Profile from './pages/Profile'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import About from './pages/About'
import AdminDashboard from './pages/AdminDashboard'
import ArtisanAnalytics from './pages/ArtisanAnalytics'
import Materials from './pages/Materials'
import Messaging from './pages/Messaging'
import Notifications from './pages/Notifications'

function App() {
  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<About />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/analytics" element={<ArtisanAnalytics />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/messages" element={<Messaging />} />
          <Route path="/notifications" element={<Notifications />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
