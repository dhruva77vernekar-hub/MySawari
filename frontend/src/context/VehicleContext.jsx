import React, { createContext, useContext, useState } from 'react';
import { VEHICLE_DATA } from '../mock/mockData';

const VehicleContext = createContext();

export function VehicleProvider({ children }) {
  const [selectedVehicle, setSelectedVehicle] = useState(() => {
    const savedCode = localStorage.getItem('mysawari_selected_vehicle');
    const found = VEHICLE_DATA.find((v) => v.code === savedCode);
    return found || VEHICLE_DATA[0];
  });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeChapter, setActiveChapter] = useState(() => selectedVehicle?.code || 'cab');

  const selectVehicleByCode = (code) => {
    const found = VEHICLE_DATA.find((v) => v.code === code);
    if (found) {
      setSelectedVehicle(found);
      setActiveChapter(found.code);
      localStorage.setItem('mysawari_selected_vehicle', found.code);
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
