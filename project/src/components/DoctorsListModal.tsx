import { useState, useEffect } from 'react';
import { supabase, Doctor, User } from '../lib/supabase';
import { Button } from './Button';
import { X, UserCheck, Stethoscope, Clock, CheckCircle } from 'lucide-react';

interface DoctorWithUser extends Doctor {
  user: User;
}

interface DoctorsListModalProps {
  onClose: () => void;
}

export function DoctorsListModal({ onClose }: DoctorsListModalProps) {
  const [doctors, setDoctors] = useState<DoctorWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'verified'>('all');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          *,
          user:users(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDoctors(data as DoctorWithUser[] || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = filter === 'verified' 
    ? doctors.filter(d => d.is_verified) 
    : doctors;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
              <Stethoscope className="text-teal-600 dark:text-teal-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Doctors Directory</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredDoctors.length} {filter === 'verified' ? 'verified' : 'total'} doctors
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Filter */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All Doctors
            </button>
            <button
              onClick={() => setFilter('verified')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'verified'
                  ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Verified Only
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading doctors...</p>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 dark:text-gray-400">
                {filter === 'verified' ? 'No verified doctors found' : 'No doctors found'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDoctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:border-teal-500 dark:hover:border-teal-500 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-lg font-semibold">
                        {doctor.user.full_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          Dr. {doctor.user.full_name}
                        </h3>
                        {doctor.is_verified && (
                          <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0" size={16} />
                        )}
                      </div>
                      <p className="text-sm text-teal-600 dark:text-teal-400 mb-2">
                        {doctor.specialization}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mb-2">
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{doctor.years_of_experience} years</span>
                        </div>
                        {doctor.license_number && (
                          <div className="truncate">
                            License: {doctor.license_number}
                          </div>
                        )}
                      </div>
                      {doctor.bio && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {doctor.bio}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        {doctor.user.email}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose} className="w-full md:w-auto">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}