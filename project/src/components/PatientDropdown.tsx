import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  LogOut, 
  ChevronDown,
  FileText,
  Calendar,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PatientDropdownProps {
  onViewProfile?: () => void;
}

export function PatientDropdown({ 
  onViewProfile
}: PatientDropdownProps) {
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
          {user?.full_name ? getInitials(user.full_name) : 'P'}
        </div>
        <ChevronDown 
          size={16} 
          className={`text-gray-400 dark:text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user?.full_name || 'Patient'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {/* Profile */}
            <button
              onClick={() => {
                onViewProfile?.();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors text-left"
            >
              <User size={18} className="text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Profile</span>
            </button>

            {/* Medical History */}
            <button
              onClick={() => {
                toast.success('Medical History feature coming soon!');
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors text-left"
            >
              <FileText size={18} className="text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Medical History</span>
            </button>

            {/* My Appointments */}
            <button
              onClick={() => {
                toast.success('My Appointments feature coming soon!');
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors text-left"
            >
              <Calendar size={18} className="text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">My Appointments</span>
            </button>

            {/* My Doctors */}
            <button
              onClick={() => {
                toast.success('My Doctors feature coming soon!');
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors text-left"
            >
              <Users size={18} className="text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">My Doctors</span>
            </button>
          </div>

          {/* Sign Out */}
          <div className="py-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left group"
            >
              <LogOut size={18} className="text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-600 dark:text-red-400">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}