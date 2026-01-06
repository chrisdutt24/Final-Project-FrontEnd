import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Overview } from './pages/Overview'
import { Appointments } from './pages/Appointments'

function App() {
  const SettingsPlaceholder = ({ title }) => (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">{title}</h1>
      <p className="text-gray-500">This setting section is under development for the MVP.</p>
      <div className="mt-8">
        <Link to="/" className="text-black font-medium hover:underline">← Back to Overview</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/settings/account" element={<SettingsPlaceholder title="Account Settings" />} />
          <Route path="/settings/notifications" element={<SettingsPlaceholder title="Notifications" />} />
          <Route path="/settings/dates" element={<SettingsPlaceholder title="Dates & Times" />} />
          <Route path="/settings/categories" element={<SettingsPlaceholder title="Edit Categories" />} />
          <Route path="/settings/storage" element={<SettingsPlaceholder title="Storage & Documents" />} />
          <Route path="/settings/privacy" element={<SettingsPlaceholder title="Privacy & Security" />} />
        </Routes>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-400">
            <div className="mb-4 md:mb-0">&copy; 2024 LifeSync Life Admin Dashboard</div>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-gray-600">Company Name</a>
              <a href="#" className="hover:text-gray-600">Terms & Conditions</a>
              <a href="#" className="hover:text-gray-600">Imprint</a>
              <a href="#" className="hover:text-gray-600">Jobs</a>
              <a href="#" className="hover:text-gray-600">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
