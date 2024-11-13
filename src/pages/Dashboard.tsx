import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [data, setData] = useState({
    totalProducts: 0,
    activeLoans: 0,
    weatherAlerts: 0,
    monthlyRevenue: 0,
    recentProducts: [],
    recentLoans: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Total Products</h3>
            <span className="text-green-500">+{data.totalProducts > 0 ? '↑' : '↓'}</span>
          </div>
          <p className="text-3xl font-bold mt-2">{data.totalProducts}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Active Loans</h3>
            <span className="text-green-500">
              ₹{data.activeLoans.toLocaleString()}
            </span>
          </div>
          <p className="text-3xl font-bold mt-2">
            ₹{(data.activeLoans/1000).toFixed(1)}K
          </p>
        </div>

        {/* Similar blocks for Weather Alerts and Monthly Revenue */}
      </div>

      {/* Recent Products and Loans sections */}
    </div>
  );
}