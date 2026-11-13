import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { VehicleProvider } from './context/VehicleContext';
import FloatingNav from './components/nav/FloatingNav';
import MenuOverlay from './components/nav/MenuOverlay';

// Pages
import Landing from './pages/Landing';
import Book from './pages/Book';
import RideTracking from './pages/RideTracking';
import CaptainDashboard from './pages/CaptainDashboard';
import AdminDashboard from './pages/AdminDashboard';
import History from './pages/History';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <AuthProvider>
      <VehicleProvider>
        <BrowserRouter>
          <div className="relative min-h-screen bg-[#F1F0FA] font-sans antialiased text-[#0A0A14] selection:bg-[#3A4DFF] selection:text-white">
            {/* Global Floating Navigation */}
            <FloatingNav onOpenMenu={() => setIsMenuOpen(true)} />

            {/* Fullscreen Overlay Menu */}
            <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            {/* Route Outlets */}
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/book" element={<Book />} />
              <Route path="/ride/:id" element={<RideTracking />} />
              <Route path="/captain" element={<CaptainDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/history" element={<History />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Landing />} />
            </Routes>
          </div>
        </BrowserRouter>
      </VehicleProvider>
    </AuthProvider>
  );
}
