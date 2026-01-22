import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ParentSidebarLayout from './ParentSidebarLayout';

const ParentRoute = ({ children }) => {
  const { user, token } = useContext(AuthContext);

  if (!token) {
    return <Navigate to="/parent/login" replace />;
  }

  if (user?.userType !== 'parent') {
    return <Navigate to="/login" replace />;
  }

  return <ParentSidebarLayout>{children}</ParentSidebarLayout>;
};

export default ParentRoute;
