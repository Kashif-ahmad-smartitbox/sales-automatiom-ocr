import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../components/layout/AdminLayout';
import { Card, CardContent } from '../components/ui/card';
import { 
  CalendarBlank, 
  Users, 
  ChartBar, 
  CurrencyDollar, 
  Trophy, 
  TrendDown,
  X,
  Funnel
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HODReports = () => {
  const { getAuthHeader } = useAuth();
  const [hodData, setHodData] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [underperformers, setUnderperformers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  
  // Modal state
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedHOD, setSelectedHOD] = useState(null);
  const [teamDetails, setTeamDetails] = useState([]);
  const [modalFilters, setModalFilters] = useState({
    executive_id: '',
    status: ''
  });

  const fetchHODDashboard = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/reports/hod-dashboard`, {
        headers: getAuthHeader(),
        params: dateRange
      });
      setHodData(response.data);
    } catch (error) {
      console.error('Failed to fetch HOD dashboard:', error);
    }
  }, [getAuthHeader, dateRange]);

  const fetchTopPerformers = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/reports/hod-top-performers`, {
        headers: getAuthHeader(),
        params: { ...dateRange, limit: 5 }
      });
      setTopPerformers(response.data);
    } catch (error) {
      console.error('Failed to fetch top performers:', error);
    }
  }, [getAuthHeader, dateRange]);

  const fetchUnderperformers = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/reports/hod-underperformers`, {
        headers: getAuthHeader(),
        params: { ...dateRange, limit: 5 }
      });
      setUnderperformers(response.data);
    } catch (error) {
      console.error('Failed to fetch underperformers:', error);
    }
  }, [getAuthHeader, dateRange]);

  const fetchTeamDetails = useCallback(async (hodId) => {
    try {
      const response = await axios.get(`${API}/reports/hod-team-details/${hodId}`, {
        headers: getAuthHeader(),
        params: { ...dateRange, ...modalFilters }
      });
      setTeamDetails(response.data.team_details || []);
    } catch (error) {
      console.error('Failed to fetch team details:', error);
    }
  }, [getAuthHeader, dateRange, modalFilters]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchHODDashboard(),
        fetchTopPerformers(),
        fetchUnderperformers()
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchHODDashboard, fetchTopPerformers, fetchUnderperformers]);

  useEffect(() => {
    if (selectedHOD) {
      fetchTeamDetails(selectedHOD.id);
    }
  }, [selectedHOD, modalFilters, fetchTeamDetails]);

  const handleTeamSizeClick = (hod) => {
    setSelectedHOD(hod);
    setShowTeamModal(true);
    setModalFilters({ executive_id: '', status: '' });
  };

  if (loading) {
    return (
      <AdminLayout title="HOD Reports">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="HOD Reports">
      <div className="space-y-4">
        {/* Header with Date Range Selector */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">HOD Performance Report</h1>
            <p className="text-xs text-gray-500 mt-0.5">Track HOD and team performance metrics</p>
          </div>
          
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
            <CalendarBlank size={16} className="text-gray-500" />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
                className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <span className="text-xs text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
                className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>
        </div>

        {/* Main HOD Data Table */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <h2 className="text-sm font-bold text-gray-900 mb-3">HOD Overview</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">HOD Name</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-gray-700">Team Size</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-gray-700">Total Visit</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700">Order Value</th>
                  </tr>
                </thead>
                <tbody>
                  {hodData.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-6 text-gray-500 text-xs">
                        No data available for selected date range
                      </td>
                    </tr>
                  ) : (
                    hodData.map((hod) => (
                      <tr key={hod.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-2 px-3 text-xs font-medium text-gray-900">{hod.name}</td>
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => handleTeamSizeClick(hod)}
                            className="inline-flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-600 font-bold rounded-lg hover:bg-orange-200 transition-colors cursor-pointer text-xs"
                          >
                            {hod.team_size}
                          </button>
                        </td>
                        <td className="py-2 px-3 text-center text-xs font-mono text-gray-700">{hod.total_visits}</td>
                        <td className="py-2 px-3 text-right text-xs font-mono text-gray-900">
                          ₹{hod.order_value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 italic">
              <strong>Note:</strong> Click on Team Size to view detailed team data with filters
            </p>
          </CardContent>
        </Card>

        {/* Performance Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Top Performers */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={20} className="text-green-600" weight="fill" />
                <h2 className="text-sm font-bold text-green-900">Top Performers of the Day</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-green-200 bg-green-100">
                      <th className="text-left py-1.5 px-2 text-[10px] font-semibold text-green-800">HOD Name</th>
                      <th className="text-left py-1.5 px-2 text-[10px] font-semibold text-green-800">Executive</th>
                      <th className="text-center py-1.5 px-2 text-[10px] font-semibold text-green-800">Visit</th>
                      <th className="text-right py-1.5 px-2 text-[10px] font-semibold text-green-800">Order Value</th>
                      <th className="text-center py-1.5 px-2 text-[10px] font-semibold text-green-800">Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPerformers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-gray-600 text-xs">
                          No performer data available
                        </td>
                      </tr>
                    ) : (
                      topPerformers.map((performer, index) => (
                        <tr key={`${performer.executive_id}-${index}`} className="border-b border-green-100 bg-white">
                          <td className="py-1.5 px-2 text-xs text-gray-900">{performer.hod_name}</td>
                          <td className="py-1.5 px-2 text-xs text-gray-900">{performer.executive_name}</td>
                          <td className="py-1.5 px-2 text-center text-xs font-mono text-gray-700">{performer.visits}</td>
                          <td className="py-1.5 px-2 text-right text-xs font-mono text-gray-900">
                            {performer.order_value.toLocaleString('en-IN')}
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded ${
                              index === 0 ? 'bg-yellow-400 text-yellow-900' :
                              index === 1 ? 'bg-gray-300 text-gray-800' :
                              index === 2 ? 'bg-orange-300 text-orange-900' :
                              'bg-green-200 text-green-800'
                            }`}>
                              {performer.position_label}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Top Underperformers */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-amber-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <TrendDown size={20} className="text-amber-600" weight="fill" />
                <h2 className="text-sm font-bold text-amber-900">Top Underperformers of the Day</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-amber-200 bg-amber-100">
                      <th className="text-left py-1.5 px-2 text-[10px] font-semibold text-amber-800">HOD Name</th>
                      <th className="text-left py-1.5 px-2 text-[10px] font-semibold text-amber-800">Executive</th>
                      <th className="text-center py-1.5 px-2 text-[10px] font-semibold text-amber-800">Visit</th>
                      <th className="text-right py-1.5 px-2 text-[10px] font-semibold text-amber-800">Order Value</th>
                      <th className="text-center py-1.5 px-2 text-[10px] font-semibold text-amber-800">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {underperformers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-gray-600 text-xs">
                          No underperformer data available
                        </td>
                      </tr>
                    ) : (
                      underperformers.map((performer, index) => (
                        <tr key={`${performer.executive_id}-${index}`} className="border-b border-amber-100 bg-white">
                          <td className="py-1.5 px-2 text-xs text-gray-900">{performer.hod_name}</td>
                          <td className="py-1.5 px-2 text-xs text-gray-900">{performer.executive_name}</td>
                          <td className="py-1.5 px-2 text-center text-xs font-mono text-gray-700">{performer.visits}</td>
                          <td className="py-1.5 px-2 text-right text-xs font-mono text-gray-900">
                            {performer.order_value.toLocaleString('en-IN')}
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded bg-amber-200 text-amber-900">
                              {performer.type}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Details Modal */}
        {showTeamModal && selectedHOD && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-orange-600">
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedHOD.name}'s Team Details</h2>
                  <p className="text-xs text-white/80 mt-0.5">
                    Team Size: {selectedHOD.team_size} | Total Visits: {selectedHOD.total_visits}
                  </p>
                </div>
                <button
                  onClick={() => setShowTeamModal(false)}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>

              {/* Filters */}
              <div className="p-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Funnel size={14} className="text-gray-500" />
                    <span className="text-xs font-medium text-gray-700">Filters:</span>
                  </div>
                  
                  <select
                    value={modalFilters.status}
                    onChange={(e) => setModalFilters({ ...modalFilters, status: e.target.value })}
                    className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    <option value="">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-100">
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Executive Name</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Employee Code</th>
                        <th className="text-center py-2 px-3 text-xs font-semibold text-gray-700">Total Visits</th>
                        <th className="text-center py-2 px-3 text-xs font-semibold text-gray-700">Completed</th>
                        <th className="text-center py-2 px-3 text-xs font-semibold text-gray-700">Pending</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700">Order Value</th>
                        <th className="text-center py-2 px-3 text-xs font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamDetails.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-6 text-gray-500 text-xs">
                            No team data available
                          </td>
                        </tr>
                      ) : (
                        teamDetails.map((member) => (
                          <tr key={member.executive_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-2 px-3 text-xs font-medium text-gray-900">{member.executive_name}</td>
                            <td className="py-2 px-3 text-xs text-gray-700">{member.employee_code}</td>
                            <td className="py-2 px-3 text-center text-xs font-mono text-gray-700">{member.total_visits}</td>
                            <td className="py-2 px-3 text-center text-xs font-mono text-green-600">{member.completed_visits}</td>
                            <td className="py-2 px-3 text-center text-xs font-mono text-orange-600">{member.pending_visits}</td>
                            <td className="py-2 px-3 text-right text-xs font-mono text-gray-900">
                              ₹{member.order_value.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded ${
                                member.is_in_market 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {member.is_in_market ? 'In Market' : 'Offline'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-end">
                <button
                  onClick={() => setShowTeamModal(false)}
                  className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default HODReports;
