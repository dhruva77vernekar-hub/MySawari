import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeroStage from '../components/landing/HeroStage';
import VehicleComparisonCards from '../components/landing/VehicleComparisonCards';
import HowItWorksRibbon from '../components/landing/HowItWorksRibbon';
import Footer from '../components/nav/Footer';
import AIAssistantView from '../components/views/AIAssistantView';
import ProfileView from '../components/views/ProfileView';
import RideBuddyPassView from '../components/views/RideBuddyPassView';

export default function Landing({ activeTab = 'normal', onTabChange }) {
  const navigate = useNavigate();

  const handleAiBookRide = (booking) => {
    navigate('/book', {
      state: {
        pickup: booking.pickup,
        drop: booking.drop,
        pickupCoords: booking.pickupCoords,
        dropCoords: booking.dropCoords,
        vehicleCode: booking.vehicleCode,
        fare: booking.fare
      }
    });
  };

  return (
    <div className="w-full min-h-screen bg-[#F1F0FA] flex flex-col justify-between">
      <div>
        {/* Dynamic Main View based on LiquidNavbar tab */}
        {activeTab === 'normal' && (
          <div className="animate-fade-in">
            <HeroStage />
            <VehicleComparisonCards />
            <HowItWorksRibbon />
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="animate-fade-in pt-24">
            <AIAssistantView onBookRide={handleAiBookRide} />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="animate-fade-in pt-24">
            <ProfileView />
          </div>
        )}

        {activeTab === 'pass' && (
          <div className="animate-fade-in pt-24">
            <RideBuddyPassView />
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
