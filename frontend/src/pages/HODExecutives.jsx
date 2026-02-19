import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import HODLayout from '../components/layout/HODLayout';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Phone, MagnifyingGlass, MapPin, Globe } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HODExecutives = () => {
  const { getAuthHeader } = useAuth();
  const [executives, setExecutives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchExecutives = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/hod/sales-executives`, { headers: getAuthHeader() });
      setExecutives(response.data);
    } catch (error) {
      console.error('Failed to fetch executives:', error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchExecutives();
  }, [fetchExecutives]);

  const getStatus = (exec) => {
    if (exec.is_in_market) return 'active';
    if (exec.last_location_update) {
      const lastUpdate = new Date(exec.last_location_update);
      const now = new Date();
      const diffMinutes = (now - lastUpdate) / (1000 * 60);
      if (diffMinutes < 30) return 'idle';
    }
    return 'offline';
  };

  const filteredExecutives = executives.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.employee_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <HODLayout title="My Team">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              My Team
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Sales executives assigned to you</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Search by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-0 bg-gradient-to-br from-purple-400 to-purple-500 text-white shadow-md">
            <CardContent className="p-3">
              <span className="text-xs font-medium text-white/90">Total Team</span>
              <div className="text-lg font-bold font-mono mt-1">{executives.length}</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-md">
            <CardContent className="p-3">
              <span className="text-xs font-medium text-white/90">Active Now</span>
              <div className="text-lg font-bold font-mono mt-1">{executives.filter(e => e.is_in_market).length}</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-md">
            <CardContent className="p-3">
              <span className="text-xs font-medium text-white/90">Idle</span>
              <div className="text-lg font-bold font-mono mt-1">{executives.filter(e => getStatus(e) === 'idle').length}</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-gray-400 to-gray-500 text-white shadow-md">
            <CardContent className="p-3">
              <span className="text-xs font-medium text-white/90">Offline</span>
              <div className="text-lg font-bold font-mono mt-1">{executives.filter(e => getStatus(e) === 'offline').length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Executives Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner" />
          </div>
        ) : filteredExecutives.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-slate-500">
              {searchTerm ? 'No executives match your search' : 'No sales executives assigned to you yet.'}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredExecutives.map((exec) => {
              const status = getStatus(exec);
              return (
                <Card key={exec.id} className="border-0 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-300">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          status === 'active' ? 'bg-emerald-500' : status === 'idle' ? 'bg-amber-500' : 'bg-slate-400'
                        }`}>
                          {exec.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{exec.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{exec.employee_code}</p>
                        </div>
                      </div>
                      <Badge className={
                        status === 'active' ? 'status-active' : status === 'idle' ? 'status-idle' : 'status-offline'
                      }>
                        {status}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Phone size={12} />
                        <span>{exec.mobile}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500">
                        {exec.is_live_tracking ? (
                          <><Globe size={12} className="text-emerald-500" /> <span>Live Tracking (All Cities)</span></>
                        ) : (
                          <><MapPin size={12} className="text-amber-500" /> <span>{exec.assigned_city || 'No City'}, {exec.assigned_state}</span></>
                        )}
                      </div>
                      {exec.daily_sales_target && (
                        <div className="text-gray-500">
                          Target: {exec.daily_sales_target} visits/day
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </HODLayout>
  );
};

export default HODExecutives;
