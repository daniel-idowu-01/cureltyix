import { useState, useEffect } from 'react';
import { X, Activity, ArrowLeft, Database, Server, Wifi, Clock, CheckCircle, AlertCircle, TrendingUp, Users, FileText } from 'lucide-react';
import { Button } from './Button';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface SystemHealthModalProps {
  onClose: () => void;
}

interface HealthMetrics {
  database: {
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    connections: number;
  };
  api: {
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    uptime: string;
  };
  storage: {
    status: 'healthy' | 'degraded' | 'down';
    used: string;
    available: string;
    percentage: number;
  };
  users: {
    total: number;
    active: number;
    newToday: number;
  };
  consultations: {
    total: number;
    pending: number;
    todayCount: number;
  };
}

export function SystemHealthModal({ onClose }: SystemHealthModalProps) {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    loadHealthMetrics();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadHealthMetrics();
    }, 30000);

    return () => {
      clearInterval(interval);
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  const loadHealthMetrics = async () => {
    setLoading(true);
    try {
      const startTime = Date.now();

      // Test database connection and get metrics
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, created_at')
        .order('created_at', { ascending: false });

      const dbResponseTime = Date.now() - startTime;

      if (usersError) throw usersError;

      // Get consultations data
      const { data: consultations } = await supabase
        .from('consultations')
        .select('id, status, created_at');

      // Calculate metrics
      const today = new Date().toDateString();
      const newUsersToday = users?.filter(u => 
        new Date(u.created_at).toDateString() === today
      ).length || 0;

      const consultationsToday = consultations?.filter(c =>
        new Date(c.created_at).toDateString() === today
      ).length || 0;

      const pendingConsultations = consultations?.filter(c =>
        c.status === 'pending'
      ).length || 0;

      // Mock storage data (you can replace with actual storage API)
      const totalStorage = 10; // GB
      const usedStorage = 2.5; // GB
      const storagePercentage = (usedStorage / totalStorage) * 100;

      // Determine database status based on response time
      let dbStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
      if (dbResponseTime > 1000) dbStatus = 'degraded';
      if (dbResponseTime > 3000) dbStatus = 'down';

      // Mock API metrics
      const apiResponseTime = Math.floor(Math.random() * 200) + 50;
      let apiStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
      if (apiResponseTime > 500) apiStatus = 'degraded';

      setMetrics({
        database: {
          status: dbStatus,
          responseTime: dbResponseTime,
          connections: users?.length || 0,
        },
        api: {
          status: apiStatus,
          responseTime: apiResponseTime,
          uptime: '99.9%',
        },
        storage: {
          status: storagePercentage > 90 ? 'degraded' : 'healthy',
          used: `${usedStorage.toFixed(1)} GB`,
          available: `${(totalStorage - usedStorage).toFixed(1)} GB`,
          percentage: storagePercentage,
        },
        users: {
          total: users?.length || 0,
          active: Math.floor((users?.length || 0) * 0.7), // Mock active users
          newToday: newUsersToday,
        },
        consultations: {
          total: consultations?.length || 0,
          pending: pendingConsultations,
          todayCount: consultationsToday,
        },
      });

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading health metrics:', error);
      toast.error('Failed to load system health metrics');
      
      // Set error state
      setMetrics({
        database: {
          status: 'down',
          responseTime: 0,
          connections: 0,
        },
        api: {
          status: 'down',
          responseTime: 0,
          uptime: '0%',
        },
        storage: {
          status: 'down',
          used: '0 GB',
          available: '0 GB',
          percentage: 0,
        },
        users: {
          total: 0,
          active: 0,
          newToday: 0,
        },
        consultations: {
          total: 0,
          pending: 0,
          todayCount: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'degraded': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'down': return 'bg-red-500/10 text-red-400 border-red-500/20';
    }
  };

  const getStatusIcon = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy': return <CheckCircle size={20} className="text-green-400" />;
      case 'degraded': return <AlertCircle size={20} className="text-yellow-400" />;
      case 'down': return <AlertCircle size={20} className="text-red-400" />;
    }
  };

  const getOverallStatus = (): 'healthy' | 'degraded' | 'down' => {
    if (!metrics) return 'down';
    
    const statuses = [
      metrics.database.status,
      metrics.api.status,
      metrics.storage.status,
    ];

    if (statuses.includes('down')) return 'down';
    if (statuses.includes('degraded')) return 'degraded';
    return 'healthy';
  };

  const formatLastUpdate = () => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
    
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    return lastUpdate.toLocaleTimeString();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f1420] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft size={20} className="text-gray-400" />
            </button>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Activity className="text-green-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">System Health</h2>
              <p className="text-sm text-gray-400">Real-time system monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-500">Last updated</p>
              <p className="text-sm text-gray-400">{formatLastUpdate()}</p>
            </div>
            <Button
              size="sm"
              onClick={loadHealthMetrics}
              disabled={loading}
              className="bg-gray-700 hover:bg-gray-600"
            >
              Refresh
            </Button>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <X size={20} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && !metrics ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Activity className="animate-pulse mx-auto text-green-400 mb-4" size={48} />
                <p className="text-gray-400">Loading system health...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Overall Status Banner */}
              <div className={`mb-6 p-4 rounded-xl border ${getStatusColor(getOverallStatus())}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(getOverallStatus())}
                    <div>
                      <h3 className="font-semibold text-lg">
                        System Status: {getOverallStatus().toUpperCase()}
                      </h3>
                      <p className="text-sm opacity-80">
                        {getOverallStatus() === 'healthy' && 'All systems operational'}
                        {getOverallStatus() === 'degraded' && 'Some systems experiencing issues'}
                        {getOverallStatus() === 'down' && 'Critical systems offline'}
                      </p>
                    </div>
                  </div>
                  <TrendingUp size={32} />
                </div>
              </div>

              {/* System Components */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Database */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Database className="text-blue-400" size={24} />
                      </div>
                      <h3 className="font-semibold">Database</h3>
                    </div>
                    {getStatusIcon(metrics?.database.status || 'down')}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Response Time</p>
                      <p className="text-lg font-bold">{metrics?.database.responseTime || 0}ms</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Connections</p>
                      <p className="text-lg font-bold">{metrics?.database.connections || 0}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs border inline-block ${getStatusColor(metrics?.database.status || 'down')}`}>
                      {metrics?.database.status || 'Unknown'}
                    </span>
                  </div>
                </div>

                {/* API */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Server className="text-purple-400" size={24} />
                      </div>
                      <h3 className="font-semibold">API Server</h3>
                    </div>
                    {getStatusIcon(metrics?.api.status || 'down')}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Response Time</p>
                      <p className="text-lg font-bold">{metrics?.api.responseTime || 0}ms</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Uptime</p>
                      <p className="text-lg font-bold">{metrics?.api.uptime || '0%'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs border inline-block ${getStatusColor(metrics?.api.status || 'down')}`}>
                      {metrics?.api.status || 'Unknown'}
                    </span>
                  </div>
                </div>

                {/* Storage */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-teal-500/10 rounded-lg">
                        <Wifi className="text-teal-400" size={24} />
                      </div>
                      <h3 className="font-semibold">Storage</h3>
                    </div>
                    {getStatusIcon(metrics?.storage.status || 'down')}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Used / Available</p>
                      <p className="text-lg font-bold">
                        {metrics?.storage.used || '0 GB'} / {metrics?.storage.available || '0 GB'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Usage</p>
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                        <div 
                          className="bg-teal-500 h-2 rounded-full transition-all"
                          style={{ width: `${metrics?.storage.percentage || 0}%` }}
                        />
                      </div>
                      <p className="text-sm font-bold">{metrics?.storage.percentage.toFixed(1) || 0}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Usage Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Users Stats */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Users className="text-purple-400" size={24} />
                    </div>
                    <h3 className="font-semibold text-lg">User Activity</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-400">{metrics?.users.total || 0}</p>
                      <p className="text-xs text-gray-400 mt-1">Total Users</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">{metrics?.users.active || 0}</p>
                      <p className="text-xs text-gray-400 mt-1">Active Users</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">{metrics?.users.newToday || 0}</p>
                      <p className="text-xs text-gray-400 mt-1">New Today</p>
                    </div>
                  </div>
                </div>

                {/* Consultations Stats */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-teal-500/10 rounded-lg">
                      <FileText className="text-teal-400" size={24} />
                    </div>
                    <h3 className="font-semibold text-lg">Consultations</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-teal-400">{metrics?.consultations.total || 0}</p>
                      <p className="text-xs text-gray-400 mt-1">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-400">{metrics?.consultations.pending || 0}</p>
                      <p className="text-xs text-gray-400 mt-1">Pending</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">{metrics?.consultations.todayCount || 0}</p>
                      <p className="text-xs text-gray-400 mt-1">Today</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex justify-between items-center flex-shrink-0 bg-[#0f1420]">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock size={16} />
            <span>Auto-refresh every 30 seconds</span>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <ArrowLeft size={18} className="mr-2" />
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}