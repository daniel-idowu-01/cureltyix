import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Shield,
  Users,
  Activity,
  Stethoscope,
  UserCircle
} from 'lucide-react';

interface AdminDropdownProps {
  onViewSettings?: () => void;
  onViewProfile?: () => void;
  onViewUserManagement?: () => void;
  onViewSystemHealth?: () => void;
  onSwitchRole?: (role: 'admin' | 'doctor' | 'patient') => void;
}

export function AdminDropdown({ 
  onViewSettings, 
  onViewProfile, 
  onViewUserManagement,
  onViewSystemHealth,
  onSwitchRole 
}: AdminDropdownProps) {
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

  const handleRoleSwitch = (role: 'admin' | 'doctor' | 'patient') => {
    if (onSwitchRole) {
      onSwitchRole(role);
    } else {
      // Default behavior: navigate to the appropriate dashboard
      if (role === 'doctor') {
        window.location.href = '/doctor-dashboard';
      } else if (role === 'patient') {
        window.location.href = '/patient-dashboard';
      }
    }
    setIsOpen(false);
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
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
          {user?.full_name ? getInitials(user.full_name) : 'A'}
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
              {user?.full_name || 'Admin'}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            <div className="flex items-center gap-1 mt-1">
              <Shield size={12} className="text-purple-400" />
              <span className="text-xs text-purple-400">Administrator</span>
            </div>
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

            {/* User Management */}
            <button
              onClick={() => {
                onViewUserManagement?.();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-800/50 transition-colors text-left"
            >
              <Users size={18} className="text-gray-400" />
              <span className="text-sm text-gray-300">User Management</span>
            </button>

            {/* System Health */}
            <button
              onClick={() => {
                onViewSystemHealth?.();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-800/50 transition-colors text-left"
            >
              <Activity size={18} className="text-gray-400" />
              <span className="text-sm text-gray-300">System Health</span>
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

          {/* Role Switching Section */}
          <div className="py-2 border-t border-gray-800">
            <div className="px-4 py-1">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Switch Role</p>
            </div>
            
            {/* Admin View (Current) */}
            <button
              onClick={() => handleRoleSwitch('admin')}
              className="w-full px-4 py-2.5 flex items-center gap-3 bg-gray-800/30 transition-colors text-left"
            >
              <Shield size={18} className="text-purple-400" />
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm text-gray-300">Admin View</span>
                <span className="text-purple-400">✓</span>
              </div>
            </button>

            {/* Doctor View */}
            <button
              onClick={() => handleRoleSwitch('doctor')}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-800/50 transition-colors text-left"
            >
              <Stethoscope size={18} className="text-teal-400" />
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm text-gray-300">Doctor View</span>
              </div>
            </button>

            {/* Patient View */}
            <button
              onClick={() => handleRoleSwitch('patient')}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-800/50 transition-colors text-left"
            >
              <UserCircle size={18} className="text-blue-400" />
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm text-gray-300">Patient View</span>
              </div>
            </button>
          </div>

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