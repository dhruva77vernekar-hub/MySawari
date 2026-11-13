import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState({
    id: 'demo-user-1',
    fullName: 'Dhruv (Demo)',
    phone: '+91 98765 43210',
    email: 'dhruv@mysawari.app',
    role: 'rider', // 'rider' | 'captain' | 'admin'
    isSuspended: false
  });

  const [loading, setLoading] = useState(false);

  const switchRole = (newRole) => {
    setUser((prev) => ({
      ...prev,
      role: newRole,
      fullName: newRole === 'captain' ? 'Captain Suresh' : newRole === 'admin' ? 'Admin Officer' : 'Dhruv (Rider)'
    }));
  };

  const signIn = async (email, password) => {
    setLoading(true);
    setTimeout(() => {
      setUser((prev) => ({ ...prev, email }));
      setLoading(false);
    }, 400);
  };

  const signOut = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'guest',
        loading,
        signIn,
        signOut,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
