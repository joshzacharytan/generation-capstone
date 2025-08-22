import { useState, useEffect } from 'react';
import api from '../services/api';

export const useUserRole = () => {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        // Try to access super admin endpoint to determine role
        await api.get('/admin/tenants?limit=1');
        setUserRole('super_admin');
      } catch (error) {
        if (error.response?.status === 403) {
          setUserRole('tenant_admin');
        } else {
          setUserRole('unknown');
        }
      } finally {
        setLoading(false);
      }
    };

    const token = localStorage.getItem('access_token');
    if (token) {
      fetchUserRole();
    } else {
      setLoading(false);
    }
  }, []);

  return { userRole, loading, isSuperAdmin: userRole === 'super_admin' };
};