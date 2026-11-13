import React, { createContext, useContext, useState } from 'react';
import { VEHICLE_DATA } from '../mock/mockData';

const VehicleContext = createContext();

export function VehicleProvider({ children }) {
  const [selectedVehicle, setSelectedVehicle] = useState(VEHICLE_DATA[1]); // Default to Bike Taxi
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeChapter, setActiveChapter] = useState('bike');

  const selectVehicleByCode = (code) => {
    const found = VEHICLE_DATA.find((v) => v.code === code);
    if (found) {
      setSelectedVehicle(found);
      setActiveChapter(found.code);
    }
  };

  return (
    <VehicleContext.Provider
      value={{
        vehicles: VEHICLE_DATA,
        selectedVehicle,
        setSelectedVehicle,
        selectVehicleByCode,
        scrollProgress,
        setScrollProgress,
        activeChapter,
        setActiveChapter
      }}
    >
      {children}
    </VehicleContext.Provider>
  );
}

export const useVehicle = () => useContext(VehicleContext);
