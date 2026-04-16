import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import Discover from './components/screens/Discover.jsx';
import FacilityDetail from './components/screens/FacilityDetail.jsx';
import Bookings from './components/screens/Bookings.jsx';
import Favorites from './components/screens/Favorites.jsx';
import Profile from './components/screens/Profile.jsx';
import OwnerDashboard from './components/screens/OwnerDashboard.jsx';
import AddFacility from './components/screens/AddFacility.jsx';
import EditFacility from './components/screens/EditFacility.jsx';
import { useAuth } from './context/AuthContext.jsx';

export const AppRoutes = () => {
  const { isOwner } = useAuth();

  return (
    <Routes>
      {isOwner ? (
        <>
          <Route path="/" element={<Navigate to="/owner" replace />} />
          <Route path="/owner" element={<OwnerDashboard />} />
          <Route path="/owner/add-facility" element={<AddFacility />} />
          <Route path="/owner/edit-facility/:id" element={<EditFacility />} />
          <Route path="*" element={<Navigate to="/owner" replace />} />
        </>
      ) : (
        <>
          <Route path="/" element={<Layout />}>
            <Route path="/" element={<Discover />} />
            <Route path="/facility/:id" element={<FacilityDetail />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
  );
};
