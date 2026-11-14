import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Initial mock riders pool for admin management and rider login
const INITIAL_RIDERS = [
  {
    id: 'rider-suresh-1',
    fullName: 'Suresh Patil',
    email: 'suresh.patil@mysawari.app',
    phone: '+91 98450 12345',
    role: 'rider',
    vehicleType: 'bike',
    vehicleName: 'Hero Splendor Plus',
    vehicleNumber: 'KA-22-EX-4912',
    dlNumber: 'DL-KA-22-2020-0091823',
    dlExpiry: '2030-12-31',
    status: 'APPROVED',
    rating: 4.9,
    tripsCompleted: 128,
    todayEarnings: 840,
    rewardPoints: 180,
    submittedAt: '2026-10-15T10:30:00Z',
    verifiedAt: '2026-10-15T14:20:00Z',
    dlDocUrl: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=400&q=80',
    rcDocUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'rider-basavaraj-2',
    fullName: 'Basavaraj M',
    email: 'basavaraj@mysawari.app',
    phone: '+91 94481 99887',
    role: 'rider',
    vehicleType: 'cab',
    vehicleName: 'Maruti Suzuki Dzire',
    vehicleNumber: 'KA-22-MB-3011',
    dlNumber: 'DL-KA-22-2018-0044512',
    dlExpiry: '2028-06-30',
    status: 'APPROVED',
    rating: 4.8,
    tripsCompleted: 245,
    todayEarnings: 1420,
    rewardPoints: 210,
    submittedAt: '2026-09-10T08:15:00Z',
    verifiedAt: '2026-09-10T11:00:00Z',
    dlDocUrl: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=400&q=80',
    rcDocUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'rider-praveen-3',
    fullName: 'Praveen Kumar',
    email: 'praveen.k@mysawari.app',
    phone: '+91 97402 11223',
    role: 'rider',
    vehicleType: 'auto',
    vehicleName: 'Bajaj Compact RE Auto',
    vehicleNumber: 'KA-22-TR-8819',
    dlNumber: 'DL-KA-22-2021-0083114',
    dlExpiry: '2031-03-15',
    status: 'PENDING_APPROVAL',
    rating: 5.0,
    tripsCompleted: 0,
    todayEarnings: 0,
    rewardPoints: 0,
    submittedAt: '2026-11-13T18:45:00Z',
    verifiedAt: null,
    dlDocUrl: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=400&q=80',
    rcDocUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'rider-anand-4',
    fullName: 'Anand Shetti',
    email: 'anand.s@mysawari.app',
    phone: '+91 99001 55667',
    role: 'rider',
    vehicleType: 'xl',
    vehicleName: 'Toyota Innova Crysta',
    vehicleNumber: 'KA-22-Z-7741',
    dlNumber: 'DL-KA-22-2015-0012998',
    dlExpiry: '2025-01-10',
    status: 'REJECTED',
    rejectionReason: 'Vehicle RC document is blurry and driving licence expired on Jan 2025. Please upload a renewed DL copy.',
    rating: 0,
    tripsCompleted: 0,
    todayEarnings: 0,
    rewardPoints: 0,
    submittedAt: '2026-11-12T14:10:00Z',
    verifiedAt: null,
    dlDocUrl: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=400&q=80',
    rcDocUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'rider-mahesh-5',
    fullName: 'Mahesh G',
    email: 'mahesh.g@mysawari.app',
    phone: '+91 96112 33445',
    role: 'rider',
    vehicleType: 'bike',
    vehicleName: 'Honda Activa 6G',
    vehicleNumber: 'KA-22-AB-1200',
    dlNumber: 'DL-KA-22-2022-0051122',
    dlExpiry: '2032-08-20',
    status: 'SUSPENDED',
    suspensionReason: 'Account suspended following 3 passenger cancellation complaints regarding fare discrepancy.',
    rating: 3.4,
    tripsCompleted: 45,
    todayEarnings: 0,
    rewardPoints: 30,
    submittedAt: '2026-08-01T09:00:00Z',
    verifiedAt: '2026-08-02T12:00:00Z',
    dlDocUrl: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=400&q=80',
    rcDocUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80'
  }
];

export function AuthProvider({ children }) {
  // Master riders list (stored in localStorage)
  const [ridersList, setRidersList] = useState(() => {
    const saved = localStorage.getItem('mysawari_all_riders');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_RIDERS;
  });

  // Current logged in user (Customer, Rider/Captain, or Admin)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('mysawari_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    // Default active user is Dhruv Patil (Customer / User)
    return {
      id: 'demo-user-1',
      fullName: 'Dhruv Patil',
      phone: '+91 98765 43210',
      email: 'dhruv@mysawari.app',
      emergencyContact: localStorage.getItem('mysawari_emergency_contact') || '+91 94481 23456',
      emergencyContactName: 'Family / Guardian',
      role: 'user', // 'user' | 'rider' | 'admin'
      applicationStatus: 'APPROVED',
      coins: 120,
      shortcuts: [
        { id: '1', label: 'Home', address: 'Tilakwadi, Belagavi', icon: 'Home' },
        { id: '2', label: 'College', address: 'KLE Technological University, Udyambag', icon: 'Briefcase' }
      ],
      isSuspended: false
    };
  });

  // Rider reward ledger (transactions for detour / automatic reassignment compensation)
  const [rewardLedger, setRewardLedger] = useState(() => {
    const saved = localStorage.getItem('mysawari_reward_ledger');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'rw-1',
        riderId: 'rider-suresh-1',
        rideId: 'R-704',
        type: 'AUTOMATIC_REASSIGNMENT_COMPENSATION',
        description: 'Auto-reassignment detour compensation (1.8 km @ 10 pts/km)',
        points: 18,
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'rw-2',
        riderId: 'rider-suresh-1',
        rideId: 'R-689',
        type: 'PEAK_HOUR_BONUS',
        description: 'KLE Tech evening surge bonus trip',
        points: 25,
        timestamp: new Date(Date.now() - 86400000).toISOString()
      }
    ];
  });

  const [loading, setLoading] = useState(false);

  // Sync state to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('mysawari_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('mysawari_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('mysawari_all_riders', JSON.stringify(ridersList));
  }, [ridersList]);

  useEffect(() => {
    localStorage.setItem('mysawari_reward_ledger', JSON.stringify(rewardLedger));
  }, [rewardLedger]);

  // Sign in supporting 3 distinct roles: 'user', 'rider', 'admin'
  const signIn = async (email, passcode, targetRole = 'user') => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    if (targetRole === 'admin') {
      const adminUser = {
        id: 'admin-super-1',
        fullName: 'Platform Operations Admin',
        email: email || 'admin@mysawari.app',
        phone: '+91 83124 00000',
        role: 'admin',
        applicationStatus: 'APPROVED',
        coins: 0,
        isSuspended: false
      };
      setUser(adminUser);
      setLoading(false);
      return adminUser;
    }

    if (targetRole === 'rider') {
      // Look up rider in rider database
      const existingRider = ridersList.find(
        (r) => r.email.toLowerCase() === email.toLowerCase()
      );

      const riderUser = existingRider || {
        id: 'rider-' + Date.now(),
        fullName: email.split('@')[0].replace('.', ' ').toUpperCase(),
        email: email || 'suresh.patil@mysawari.app',
        phone: '+91 98450 12345',
        role: 'rider',
        vehicleType: 'bike',
        vehicleName: 'Hero Splendor Plus',
        vehicleNumber: 'KA-22-EX-4912',
        dlNumber: 'DL-KA-22-2020-0091823',
        status: 'APPROVED',
        todayEarnings: 840,
        rewardPoints: 180,
        tripsCompleted: 12,
        isSuspended: false
      };

      setUser({
        ...riderUser,
        role: 'rider',
        applicationStatus: riderUser.status || 'APPROVED'
      });
      setLoading(false);
      return riderUser;
    }

    // Default: Customer / User role
    const namePart = email.split('@')[0];
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const customerUser = {
      id: 'user-' + Date.now(),
      fullName: formattedName || 'Customer',
      email: email || 'user@mysawari.app',
      phone: '+91 98765 43210',
      role: 'user',
      applicationStatus: 'APPROVED',
      emergencyContact: localStorage.getItem('mysawari_emergency_contact') || '+91 94481 23456',
      emergencyContactName: 'Family / Guardian',
      coins: 130,
      shortcuts: [
        { id: '1', label: 'Home', address: 'Tilakwadi, Belagavi', icon: 'Home' },
        { id: '2', label: 'Campus', address: 'KLE Tech Campus, Udyambag', icon: 'Briefcase' }
      ],
      isSuspended: false
    };

    setUser(customerUser);
    setLoading(false);
    return customerUser;
  };

  const signOut = () => {
    setUser(null);
  };

  // Register a Customer (User)
  const registerUser = async ({ fullName, email, phone, password }) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const newUser = {
      id: 'user-' + Date.now(),
      fullName: fullName || 'New Customer',
      email,
      phone,
      role: 'user',
      applicationStatus: 'APPROVED',
      coins: 100,
      emergencyContact: '+91 94481 23456',
      emergencyContactName: 'Family / Guardian',
      shortcuts: [],
      isSuspended: false
    };
    setUser(newUser);
    setLoading(false);
    return newUser;
  };

  // Register a Rider (Captain) - Starts in PENDING_APPROVAL
  const registerRider = async (data) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    const newRider = {
      id: 'rider-' + Date.now(),
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      role: 'rider',
      vehicleType: data.vehicleType || 'bike',
      vehicleName: data.vehicleModel || 'Two Wheeler',
      vehicleNumber: data.vehicleNumber || 'KA-22-REG',
      dlNumber: data.dlNumber || 'DL-PENDING',
      dlExpiry: data.dlExpiry || '2030-12-31',
      status: 'PENDING_APPROVAL',
      rating: 5.0,
      tripsCompleted: 0,
      todayEarnings: 0,
      rewardPoints: 0,
      submittedAt: new Date().toISOString(),
      verifiedAt: null,
      dlDocUrl: data.dlDocUrl || 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=400&q=80',
      rcDocUrl: data.rcDocUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80'
    };

    // Add to master riders list
    setRidersList((prev) => [newRider, ...prev]);

    // Set as active session user in PENDING_APPROVAL status
    setUser({
      ...newRider,
      applicationStatus: 'PENDING_APPROVAL'
    });

    setLoading(false);
    return newRider;
  };

  // Admin action: Update rider application status (Approve, Reject with reason, Suspend, Reactivate)
  const updateRiderStatus = (riderId, newStatus, reason = '') => {
    setRidersList((prev) =>
      prev.map((rider) => {
        if (rider.id === riderId) {
          const updated = {
            ...rider,
            status: newStatus,
            rejectionReason: newStatus === 'REJECTED' ? reason : null,
            suspensionReason: newStatus === 'SUSPENDED' ? reason : null,
            verifiedAt: newStatus === 'APPROVED' ? new Date().toISOString() : rider.verifiedAt
          };
          // If current logged-in user is this rider, update their live session too
          if (user && user.id === riderId) {
            setUser((curr) => ({
              ...curr,
              ...updated,
              applicationStatus: newStatus
            }));
          }
          return updated;
        }
        return rider;
      })
    );
  };

  // Add reward points to rider wallet with audit log (e.g. from automatic reassignment)
  const addRiderRewardPoints = (riderId, points, description, rideId = 'R-AUTO') => {
    const entry = {
      id: 'rw-' + Date.now(),
      riderId,
      rideId,
      type: 'REASSIGNMENT_COMPENSATION',
      description,
      points,
      timestamp: new Date().toISOString()
    };

    setRewardLedger((prev) => [entry, ...prev]);

    // Update rider's balance in master list
    setRidersList((prev) =>
      prev.map((r) => {
        if (r.id === riderId) {
          return { ...r, rewardPoints: (r.rewardPoints || 0) + points };
        }
        return r;
      })
    );

    // If active user is this rider, update state
    if (user && (user.id === riderId || user.role === 'rider')) {
      setUser((curr) => ({
        ...curr,
        rewardPoints: (curr.rewardPoints || 0) + points
      }));
    }
  };

  // Redeem reward points
  const redeemRewardPoints = (pointsToRedeem) => {
    if (!user || (user.rewardPoints || 0) < pointsToRedeem) return false;
    const remaining = (user.rewardPoints || 0) - pointsToRedeem;
    setUser((curr) => ({
      ...curr,
      rewardPoints: remaining,
      todayEarnings: (curr.todayEarnings || 0) + pointsToRedeem // 1 Pt = 1 INR
    }));

    setRidersList((prev) =>
      prev.map((r) => (r.id === user.id ? { ...r, rewardPoints: remaining } : r))
    );

    const entry = {
      id: 'rw-' + Date.now(),
      riderId: user.id,
      rideId: 'REDEEM',
      type: 'POINTS_REDEMPTION',
      description: `Redeemed ${pointsToRedeem} Reward Points for ₹${pointsToRedeem}.00 direct wallet credit`,
      points: -pointsToRedeem,
      timestamp: new Date().toISOString()
    };
    setRewardLedger((prev) => [entry, ...prev]);
    return true;
  };

  const updateProfile = ({ fullName, phone, email, emergencyContact, emergencyContactName }) => {
    if (emergencyContact) {
      localStorage.setItem('mysawari_emergency_contact', emergencyContact);
    }
    setUser((prev) => ({
      ...prev,
      fullName: fullName || prev.fullName,
      phone: phone || prev.phone,
      email: email || prev.email,
      emergencyContact: emergencyContact || prev.emergencyContact || '+91 94481 23456',
      emergencyContactName: emergencyContactName || prev.emergencyContactName || 'Family / Guardian'
    }));
  };

  const updateEmergencyContact = (contact, name = 'Family / Guardian') => {
    localStorage.setItem('mysawari_emergency_contact', contact);
    setUser((prev) => ({
      ...prev,
      emergencyContact: contact,
      emergencyContactName: name
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
        role: user?.role || 'user',
        applicationStatus: user?.applicationStatus || user?.status || 'APPROVED',
        loading,
        ridersList,
        rewardLedger,
        signIn,
        signOut,
        registerUser,
        registerRider,
        updateRiderStatus,
        addRiderRewardPoints,
        redeemRewardPoints,
        updateProfile,
        updateEmergencyContact,
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
