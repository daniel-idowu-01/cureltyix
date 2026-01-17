import { useState, useEffect } from 'react';
import { X, Users, Search, ArrowLeft, Loader2, Shield, Stethoscope, UserCircle, Check, XCircle } from 'lucide-react';
import { Button } from './Button';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface UserData {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'doctor' | 'patient';
  created_at: string;
  doctor?: {
    is_verified: boolean;
    specialization?: string;
  };
  patient?: {
    date_of_birth?: string;
  };
}

interface UserManagementModalProps {
  onClose: () => void;
}

export function UserManagementModal({ onClose }: UserManagementModalProps) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'doctor' | 'patient'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    loadUsers();

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, filterRole, users]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Get all users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name, role, created_at')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Get doctor info for doctors
      const { data: doctorsData } = await supabase
        .from('doctors')
        .select('user_id, is_verified, specialization');

      // Get patient info for patients
      const { data: patientsData } = await supabase
        .from('patients')
        .select('user_id, date_of_birth');

      // Combine data
      const enrichedUsers = usersData?.map(user => {
        const doctor = doctorsData?.find(d => d.user_id === user.id);
        const patient = patientsData?.find(p => p.user_id === user.id);

        return {
          ...user,
          doctor: doctor ? {
            is_verified: doctor.is_verified,
            specialization: doctor.specialization
          } : undefined,
          patient: patient ? {
            date_of_birth: patient.date_of_birth
          } : undefined
        };
      });

      setUsers(enrichedUsers || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by role
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const handleVerifyDoctor = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('doctors')
        .update({ is_verified: true })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Doctor verified successfully!');
      loadUsers();
    } catch (error) {
      console.error('Error verifying doctor:', error);
      toast.error('Failed to verify doctor');
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast.success('User deleted successfully');
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield size={16} className="text-purple-400" />;
      case 'doctor': return <Stethoscope size={16} className="text-teal-400" />;
      case 'patient': return <UserCircle size={16} className="text-blue-400" />;
      default: return null;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'doctor': return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      case 'patient': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    doctors: users.filter(u => u.role === 'doctor').length,
    patients: users.filter(u => u.role === 'patient').length,
    unverifiedDoctors: users.filter(u => u.role === 'doctor' && !u.doctor?.is_verified).length,
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
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Users className="text-purple-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">User Management</h2>
              <p className="text-sm text-gray-400">{stats.total} total users</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="px-6 py-4 border-b border-gray-800 flex-shrink-0">
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-gray-800/30 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-gray-400 mt-1">Total Users</p>
            </div>
            <div className="bg-purple-500/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-400">{stats.admins}</p>
              <p className="text-xs text-gray-400 mt-1">Admins</p>
            </div>
            <div className="bg-teal-500/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-teal-400">{stats.doctors}</p>
              <p className="text-xs text-gray-400 mt-1">Doctors</p>
            </div>
            <div className="bg-blue-500/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-400">{stats.patients}</p>
              <p className="text-xs text-gray-400 mt-1">Patients</p>
            </div>
            <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-400">{stats.unverifiedDoctors}</p>
              <p className="text-xs text-gray-400 mt-1">Pending Verification</p>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="px-6 py-4 border-b border-gray-800 flex gap-4 flex-shrink-0">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterRole('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterRole === 'all' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterRole('admin')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterRole === 'admin' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Admins
            </button>
            <button
              onClick={() => setFilterRole('doctor')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterRole === 'doctor' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Doctors
            </button>
            <button
              onClick={() => setFilterRole('patient')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterRole === 'patient' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Patients
            </button>
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-purple-400" size={40} />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-gray-800/50 rounded-lg p-12 text-center">
              <Users className="mx-auto text-gray-600 mb-3" size={48} />
              <p className="text-gray-400 mb-2">No users found</p>
              <p className="text-sm text-gray-500">
                {searchTerm ? 'Try a different search term' : 'No users match the selected filter'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div key={user.id} className="bg-gray-800/50 rounded-xl p-4 hover:bg-gray-800/70 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {user.full_name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">{user.full_name}</h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full border flex items-center gap-1 ${getRoleBadgeColor(user.role)}`}>
                            {getRoleIcon(user.role)}
                            {user.role}
                          </span>
                          {user.role === 'doctor' && (
                            user.doctor?.is_verified ? (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1">
                                <Check size={12} />
                                Verified
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center gap-1">
                                <XCircle size={12} />
                                Pending
                              </span>
                            )
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{user.email}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Joined: {formatDate(user.created_at)}</span>
                          {user.doctor?.specialization && (
                            <span>• {user.doctor.specialization}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {user.role === 'doctor' && !user.doctor?.is_verified && (
                        <Button
                          size="sm"
                          onClick={() => handleVerifyDoctor(user.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Verify
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        className="text-red-400 hover:bg-red-500/10"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex justify-between items-center flex-shrink-0 bg-[#0f1420]">
          <p className="text-sm text-gray-400">
            Showing {filteredUsers.length} of {users.length} users
          </p>
          <Button variant="ghost" onClick={onClose}>
            <ArrowLeft size={18} className="mr-2" />
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}