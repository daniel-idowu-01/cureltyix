import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Calendar,
  FileText,
  Eye
} from 'lucide-react';

interface DoctorDropdownProps {
  onViewSettings?: () => void;
  onViewProfile?: () => void;
  onViewSchedule?: () => void;
}

export function DoctorDropdown({ onViewSettings, onViewProfile, onViewSchedule }: DoctorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
          {user?.full_name ? getInitials(user.full_name) : 'DR'}
        </div>
        <ChevronDown 
          size={16} 
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-[#0f1420] border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50">
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-gray-800 bg-gray-800/30">
            <p className="text-sm font-medium text-white truncate">
              Dr. {user?.full_name || 'Doctor'}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {/* My Profile */}
            <button
              onClick={() => {
                onViewProfile?.();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-800/50 transition-colors text-left"
            >
              <User size={18} className="text-gray-400" />
              <span className="text-sm text-gray-300">My Profile</span>
            </button>

            {/* My Schedule */}
            <button
              onClick={() => {
                onViewSchedule?.();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-800/50 transition-colors text-left"
            >
              <Calendar size={18} className="text-gray-400" />
              <span className="text-sm text-gray-300">My Schedule</span>
            </button>

            {/* Clinical Notes */}
            <button
              onClick={() => setIsOpen(false)}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-800/50 transition-colors text-left"
            >
              <FileText size={18} className="text-gray-400" />
              <span className="text-sm text-gray-300">Clinical Notes</span>
            </button>

            {/* Settings */}
            <button
              onClick={() => {
                onViewSettings?.();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-800/50 transition-colors text-left"
            >
              <Settings size={18} className="text-gray-400" />
              <span className="text-sm text-gray-300">Settings</span>
            </button>
          </div>

          {/* Switch View Section (Optional - only for doctors) */}
          {user?.role === 'doctor' && (
            <div className="py-2 border-t border-gray-800">
              <div className="px-4 py-1">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Switch View</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-800/50 transition-colors text-left"
              >
                <Eye size={18} className="text-teal-400" />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm text-gray-300">Doctor View</span>
                  <span className="text-teal-400">✓</span>
                </div>
              </button>
            </div>
          )}

          {/* Sign Out */}
          <div className="py-2 border-t border-gray-800">
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-500/10 transition-colors text-left group"
            >
              <LogOut size={18} className="text-red-400" />
              <span className="text-sm text-red-400">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}