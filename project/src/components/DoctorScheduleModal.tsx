import { useState, useEffect } from 'react';
import { X, Calendar, ArrowLeft, Loader2, Video, MapPin, Clock } from 'lucide-react';
import { Button } from './Button';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Appointment {
  id: string;
  date: string;
  time: string;
  type: 'video' | 'in-person';
  location?: string;
  status: string;
  patient: {
    user: {
      full_name: string;
      email: string;
    };
  };
}

interface DoctorScheduleModalProps {
  onClose: () => void;
}

export function DoctorScheduleModal({ onClose }: DoctorScheduleModalProps) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      if (!user) {
        toast.error('User not authenticated');
        setLoading(false);
        return;
      }

      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (doctorError || !doctorData) {
        console.error('Doctor error:', doctorError);
        setAppointments([]);
        setLoading(false);
        return;
      }

      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id, date, time, type, location, status, patient_id')
        .eq('doctor_id', doctorData.id)
        .neq('status', 'cancelled')
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (appointmentsError) {
        console.error('Appointments error:', appointmentsError);
        setAppointments([]);
        setLoading(false);
        return;
      }

      if (!appointmentsData || appointmentsData.length === 0) {
        setAppointments([]);
        setLoading(false);
        return;
      }

      const patientIds = appointmentsData.map(a => a.patient_id);
      const { data: patientsData } = await supabase
        .from('patients')
        .select('id, user_id')
        .in('id', patientIds);

      const userIds = patientsData?.map(p => p.user_id) || [];
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', userIds);

      const enrichedAppointments: Appointment[] = appointmentsData.map(apt => {
        const patient = patientsData?.find(p => p.id === apt.patient_id);
        const userInfo = usersData?.find(u => u.id === patient?.user_id);

        return {
          id: apt.id,
          date: apt.date,
          time: apt.time,
          type: apt.type as 'video' | 'in-person',
          location: apt.location,
          status: apt.status,
          patient: {
            user: {
              full_name: userInfo?.full_name || 'Unknown Patient',
              email: userInfo?.email || 'No email'
            }
          }
        };
      });

      setAppointments(enrichedAppointments);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const isToday = (dateStr: string) => {
    const today = new Date().toDateString();
    const aptDate = new Date(dateStr).toDateString();
    return today === aptDate;
  };

  const todayAppointments = appointments.filter(a => isToday(a.date));
  const upcomingAppointments = appointments.filter(a => !isToday(a.date) && new Date(a.date) > new Date());

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f1420] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="text-teal-400" size={24} />
            <div>
              <h2 className="text-xl font-bold text-white">My Schedule</h2>
              <p className="text-sm text-gray-400">{appointments.length} appointments</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-teal-400" size={40} />
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto text-gray-600 mb-3" size={48} />
              <p className="text-gray-400 mb-2">No appointments scheduled</p>
              <p className="text-sm text-gray-500">Your schedule is clear</p>
            </div>
          ) : (
            <div className="space-y-6">
              {todayAppointments.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Today</h3>
                  <div className="space-y-3">
                    {todayAppointments.map(apt => (
                      <div key={apt.id} className="bg-teal-500/10 border border-teal-500/30 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-white">{apt.patient.user.full_name}</h4>
                            <p className="text-sm text-gray-400">{apt.patient.user.email}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                            apt.type === 'video' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                          }`}>
                            {apt.type === 'video' ? <Video size={14} /> : <MapPin size={14} />}
                            {apt.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-300">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {apt.time}
                          </span>
                          {apt.location && <span>{apt.location}</span>}
                        </div>
                        {apt.type === 'video' && (
                          <Button size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700">
                            Join Call
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {upcomingAppointments.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Upcoming</h3>
                  <div className="space-y-3">
                    {upcomingAppointments.map(apt => (
                      <div key={apt.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-white">{apt.patient.user.full_name}</h4>
                            <p className="text-sm text-gray-400">{apt.patient.user.email}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                            apt.type === 'video' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                          }`}>
                            {apt.type === 'video' ? <Video size={14} /> : <MapPin size={14} />}
                            {apt.type}
                          </span>
                        </div>
                        <div className="text-sm text-gray-300">
                          <p className="mb-1">{formatDate(apt.date)}</p>
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {apt.time}
                            </span>
                            {apt.location && <span>{apt.location}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-800 flex justify-between">
          <div className="text-sm text-gray-400">
            <span className="font-semibold text-white">{todayAppointments.length}</span> today, 
            <span className="font-semibold text-white ml-1">{upcomingAppointments.length}</span> upcoming
          </div>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}