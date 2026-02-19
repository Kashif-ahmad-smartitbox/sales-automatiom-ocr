import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../components/layout/AdminLayout';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { UserCircleGear, ChartBar, Users, CheckCircle, CurrencyDollar, Storefront } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HODReports = () => {
  const { getAuthHeader } = useAuth();
  const [hodPerformance, setHODPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHODPerformance = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/reports/hod-performance`, { headers: getAuthHeader() });
      setHODPerformance(response.data);
    } catch (error) {
      console.error('Failed to fetch HOD performance:', error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchHODPerformance();
  }, [fetchHODPerformance]);

  if (loading) {
    return (
      <AdminLayout title="HOD Reports">
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="HOD Reports">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">
            HOD Performance Reports
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Track performance of all Head of Departments</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-0 bg-gradient-to-br from-purple-400 to-indigo-500 text-white shadow-md">
            <CardContent className="p-3">
              <span className="text-xs font-medium text-white/90">Total HODs</span>
              <div className="text-lg font-bold font-mono mt-1">{hodPerformance.length}</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-md">
            <CardContent className="p-3">
              <span className="text-xs font-medium text-white/90">Total Executives</span>
              <div className="text-lg font-bold font-mono mt-1">
                {hodPerformance.reduce((sum, hod) => sum + hod.assigned_executives_count, 0)}
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-primary-400 to-primary-500 text-white shadow-md">
            <CardContent className="p-3">
              <span className="text-xs font-medium text-white/90">Total Visits</span>
              <div className="text-lg font-bold font-mono mt-1">
                {hodPerformance.reduce((sum, hod) => sum + hod.total_visits, 0)}
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
            <CardContent className="p-3">
              <span className="text-xs font-medium text-white/90">Total Orders</span>
              <div className="text-lg font-bold font-mono mt-1">
                ₹{hodPerformance.reduce((sum, hod) => sum + hod.total_order_value, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* HOD Performance Cards */}
        {hodPerformance.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-slate-500">
              No HOD performance data available
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {hodPerformance.map((hod) => (
              <Card key={hod.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-4">
                  {/* HOD Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold bg-gradient-to-br from-purple-500 to-indigo-600">
                        {hod.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-800">{hod.name}</h3>
                        <p className="text-xs text-gray-500">
                          {hod.employee_code} • {hod.email}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                      <UserCircleGear size={12} className="mr-1" />
                      HOD
                    </Badge>
                  </div>

                  {/* Performance Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-3 rounded-lg border border-emerald-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Users size={14} className="text-emerald-600" />
                        <p className="text-[10px] text-emerald-700 uppercase tracking-wider font-semibold">Team Size</p>
                      </div>
                      <p className="text-xl font-bold font-mono text-emerald-800">{hod.assigned_executives_count}</p>
                      <p className="text-[9px] text-emerald-600 mt-0.5">
                        {hod.active_executives} active now
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-3 rounded-lg border border-primary-200">
                      <div className="flex items-center gap-2 mb-1">
                        <ChartBar size={14} className="text-primary-600" />
                        <p className="text-[10px] text-primary-700 uppercase tracking-wider font-semibold">Total Visits</p>
                      </div>
                      <p className="text-xl font-bold font-mono text-primary-800">{hod.total_visits}</p>
                      <p className="text-[9px] text-primary-600 mt-0.5">
                        {hod.today_visits} today
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle size={14} className="text-green-600" />
                        <p className="text-[10px] text-green-700 uppercase tracking-wider font-semibold">Completed</p>
                      </div>
                      <p className="text-xl font-bold font-mono text-green-800">{hod.completed_visits}</p>
                      <p className="text-[9px] text-green-600 mt-0.5">
                        {hod.total_visits > 0 ? Math.round((hod.completed_visits / hod.total_visits) * 100) : 0}% rate
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 rounded-lg border border-amber-200">
                      <div className="flex items-center gap-2 mb-1">
                        <CurrencyDollar size={14} className="text-amber-600" />
                        <p className="text-[10px] text-amber-700 uppercase tracking-wider font-semibold">Order Value</p>
                      </div>
                      <p className="text-lg font-bold font-mono text-amber-800">
                        ₹{(hod.total_order_value / 1000).toFixed(1)}K
                      </p>
                      <p className="text-[9px] text-amber-600 mt-0.5">total orders</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Storefront size={14} className="text-purple-600" />
                        <p className="text-[10px] text-purple-700 uppercase tracking-wider font-semibold">Dealers</p>
                      </div>
                      <p className="text-xl font-bold font-mono text-purple-800">{hod.dealers_visited}</p>
                      <p className="text-[9px] text-purple-600 mt-0.5">unique outlets</p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <ChartBar size={14} className="text-blue-600" />
                        <p className="text-[10px] text-blue-700 uppercase tracking-wider font-semibold">Avg/Person</p>
                      </div>
                      <p className="text-xl font-bold font-mono text-blue-800">
                        {hod.assigned_executives_count > 0 
                          ? Math.round(hod.total_visits / hod.assigned_executives_count)
                          : 0}
                      </p>
                      <p className="text-[9px] text-blue-600 mt-0.5">visits per exec</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs text-gray-600 font-medium">Visit Completion Rate</p>
                      <p className="text-xs font-bold text-primary-600">
                        {hod.total_visits > 0 
                          ? Math.round((hod.completed_visits / hod.total_visits) * 100)
                          : 0}%
                      </p>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary-500 to-orange-500 transition-all duration-500"
                        style={{
                          width: `${hod.total_visits > 0 
                            ? Math.round((hod.completed_visits / hod.total_visits) * 100)
                            : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default HODReports;
