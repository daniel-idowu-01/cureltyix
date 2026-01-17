import { X, Video, MapPin, Calendar, Clock, Phone, Mail, ArrowLeft } from 'lucide-react';
import { Button } from './Button';
import { useEffect } from 'react';

interface Appointment {
  id: string;
  doctor_name: string;
  specialty: string;
  date: string;
  time: string;
  type: 'video' | 'in-person';
  location?: string;
}

interface AppointmentDetailsModalProps {
  appointment: Appointment;
  onClose: () => void;
  onJoinCall?: () => void;
}

export function AppointmentDetailsModal({ appointment, onClose, onJoinCall }: AppointmentDetailsModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    // Save current scroll position
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    // Cleanup: restore scroll when modal closes
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  const handleJoinCall = () => {
    if (appointment.type === 'video') {
      // Replace with actual video call URL
      window.open('https://meet.google.com/your-meeting-id', '_blank');
      if (onJoinCall) onJoinCall();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#0f1420] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        {/* Header with Back Button */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title="Go Back"
            >
              <ArrowLeft size={20} className="text-gray-400" />
            </button>
            {appointment.type === 'video' ? (
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Video className="text-purple-400" size={24} />
              </div>
            ) : (
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <MapPin className="text-blue-400" size={24} />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-white">Appointment Details</h2>
              <p className="text-sm text-gray-400">
                {appointment.type === 'video' ? 'Video Consultation' : 'In-Person Visit'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Close"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Doctor Information */}
          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {appointment.doctor_name.split(' ')[1]?.[0] || 'D'}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{appointment.doctor_name}</h3>
                <p className="text-sm text-gray-400">{appointment.specialty}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Phone size={16} />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Mail size={16} />
                <span>doctor@clinic.com</span>
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white">Appointment Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Calendar size={16} />
                  <span className="text-xs uppercase font-medium">Date</span>
                </div>
                <p className="text-white font-medium">{appointment.date}</p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Clock size={16} />
                  <span className="text-xs uppercase font-medium">Time</span>
                </div>
                <p className="text-white font-medium">{appointment.time}</p>
              </div>
            </div>

            {appointment.type === 'video' ? (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-purple-400 mb-2">
                  <Video size={16} />
                  <span className="text-xs uppercase font-medium">Video Consultation</span>
                </div>
                <p className="text-sm text-gray-300">
                  Join the video call 5 minutes before your appointment time. Make sure your camera and microphone are working.
                </p>
              </div>
            ) : (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <MapPin size={16} />
                  <span className="text-xs uppercase font-medium">Location</span>
                </div>
                <p className="text-white font-medium">{appointment.location}</p>
                <p className="text-sm text-gray-400 mt-2">
                  Please arrive 10 minutes early for check-in.
                </p>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-4">
            <h4 className="font-medium text-teal-400 mb-2">Before Your Appointment</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-1">•</span>
                <span>Prepare a list of your current medications</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-1">•</span>
                <span>Have your medical history and recent test results ready</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-1">•</span>
                <span>Write down any questions you want to ask</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Actions - Fixed at bottom */}
        <div className="px-6 py-4 border-t border-gray-800 flex justify-between gap-3 bg-[#0f1420]">
          <Button variant="ghost" onClick={onClose}>
            <ArrowLeft size={18} className="mr-2" />
            Back
          </Button>
          <div className="flex gap-3">
            <Button variant="secondary">
              Reschedule
            </Button>
            {appointment.type === 'video' ? (
              <Button onClick={handleJoinCall} className="bg-purple-600 hover:bg-purple-700">
                <Video size={18} className="mr-2" />
                Join Video Call
              </Button>
            ) : (
              <Button className="bg-teal-600 hover:bg-teal-700">
                <MapPin size={18} className="mr-2" />
                Get Directions
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}