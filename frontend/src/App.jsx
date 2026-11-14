import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { VehicleProvider } from './context/VehicleContext';
import { LanguageProvider } from './context/LanguageContext';
import FloatingNav from './components/nav/FloatingNav';
import MenuOverlay from './components/nav/MenuOverlay';
import EmergencySosFloating from './components/safety/EmergencySosFloating';

// Pages
import Landing from './pages/Landing';
import Book from './pages/Book';
import RideTracking from './pages/RideTracking';
import CaptainDashboard from './pages/CaptainDashboard';
import RiderDashboard from './pages/RiderDashboard';
import RiderRegister from './pages/RiderRegister';
import RiderStatus from './pages/RiderStatus';
import AdminDashboard from './pages/AdminDashboard';
import History from './pages/History';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Shared activeTab state: controls LiquidNavbar in FloatingNav + view in Landing
  const [activeTab, setActiveTab] = useState('normal');

  return (
    <AuthProvider>
      <LanguageProvider>
        <VehicleProvider>
          <BrowserRouter>
            <div className="relative min-h-screen bg-[#F1F0FA] font-sans antialiased text-[#0A0A14] selection:bg-[#3A4DFF] selection:text-white">
              {/* Global Floating Navigation — with LiquidNavbar pill on Landing */}
              <FloatingNav
                onOpenMenu={() => setIsMenuOpen(true)}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />

              {/* Fullscreen Overlay Menu */}
              <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

              {/* Floating Emergency SOS Button (Bottom Right) */}
              <EmergencySosFloating />

              {/* Route Outlets */}
              <Routes>
                <Route path="/" element={<Landing activeTab={activeTab} onTabChange={setActiveTab} />} />
                <Route path="/ride-buddy" element={<Landing activeTab="pass" onTabChange={setActiveTab} />} />
                <Route path="/book" element={<Book />} />
                <Route path="/ride/:id" element={<RideTracking />} />
                
                {/* Rider (Captain) Routes */}
                <Route path="/captain" element={<CaptainDashboard />} />
                <Route path="/rider/dashboard" element={<RiderDashboard />} />
                <Route path="/rider/register" element={<RiderRegister />} />
                <Route path="/rider/application-status" element={<RiderStatus />} />

                {/* Admin Platform Routes */}
                <Route path="/admin/*" element={<AdminDashboard />} />

                {/* Customer History & Authentication */}
                <Route path="/history" element={<History />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Fallback */}
                <Route path="*" element={<Landing activeTab={activeTab} onTabChange={setActiveTab} />} />
              </Routes>
            </div>
          </BrowserRouter>
        </VehicleProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
