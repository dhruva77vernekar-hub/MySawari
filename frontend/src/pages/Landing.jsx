import React from 'react';
import HeroStage from '../components/landing/HeroStage';
import VehicleComparisonCards from '../components/landing/VehicleComparisonCards';
import HowItWorksRibbon from '../components/landing/HowItWorksRibbon';
import Footer from '../components/nav/Footer';

export default function Landing() {
  return (
    <div className="w-full min-h-screen bg-[#F1F0FA]">
      <HeroStage />
      <VehicleComparisonCards />
      <HowItWorksRibbon />
      <Footer />
    </div>
  );
}
