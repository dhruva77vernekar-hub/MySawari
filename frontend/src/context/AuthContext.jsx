import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('mysawari_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      id: 'demo-user-1',
      fullName: 'Dhruv Patil',
      phone: '+91 98765 43210',
      email: 'dhruv@mysawari.app',
      role: 'rider',
      coins: 120, // 10 coins per ride
      shortcuts: [
        { id: '1', label: 'Home', address: 'Tilakwadi, Belagavi', icon: 'Home' },
        { id: '2', label: 'College', address: 'KLE Technological University, Udyambag', icon: 'Briefcase' }
      ],
      isSuspended: false
    };
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('mysawari_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('mysawari_user');
    }
  }, [user]);

  const signIn = async (email, passcode) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 450));
    const namePart = email.split('@')[0];
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    
    setUser({
      id: 'user-' + Date.now(),
      fullName: formattedName || 'Rider',
      email: email || 'rider@mysawari.app',
      phone: '+91 98450 12345',
      role: 'rider',
      coins: 130,
      shortcuts: [
        { id: '1', label: 'Home', address: 'Tilakwadi, Belagavi', icon: 'Home' },
        { id: '2', label: 'Campus', address: 'KLE Tech Campus, Udyambag', icon: 'Briefcase' }
      ],
      isSuspended: false
    });
    setLoading(false);
    return true;
  };

  const signOut = () => {
    setUser(null);
  };

  const updateProfile = ({ fullName, phone, email }) => {
    setUser((prev) => ({
      ...prev,
      fullName: fullName || prev.fullName,
      phone: phone || prev.phone,
      email: email || prev.email
    }));
  };

  const addCoins = (amount = 10) => {
    setUser((prev) => ({
      ...prev,
      coins: (prev?.coins || 0) + amount
    }));
  };

  const addShortcut = (label, address) => {
    const newShortcut = {
      id: 'sc-' + Date.now(),
      label,
      address,
      icon: 'MapPin'
    };
    setUser((prev) => ({
      ...prev,
      shortcuts: [...(prev?.shortcuts || []), newShortcut]
    }));
  };

  const removeShortcut = (id) => {
    setUser((prev) => ({
      ...prev,
      shortcuts: (prev?.shortcuts || []).filter((s) => s.id !== id)
    }));
  };

  const deleteAccount = () => {
    setUser(null);
    localStorage.removeItem('mysawari_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'guest',
        loading,
        signIn,
        signOut,
        updateProfile,
        addCoins,
        addShortcut,
        removeShortcut,
        deleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
