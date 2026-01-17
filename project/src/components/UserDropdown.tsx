import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Settings, UserCircle, Users, LogOut, Shield } from 'lucide-react';

interface UserDropdownProps {
  onViewDoctors?: () => void;
  onViewSettings?: () => void;
  onViewProfile?: () => void;
  onSwitchToDoctor?: () => void;
  onSwitchToPatient?: () => void;
}

export function UserDropdown({
  onViewDoctors,
  onViewSettings,
  onViewProfile,
  onSwitchToDoctor,
  onSwitchToPatient,
}: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
  };

  const handleMenuClick = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  const getInitials = () => {
    return user?.full_name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-semibold hover:shadow-lg hover:shadow-teal-500/30 transition-all"
      >
        {getInitials()}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-[#0f1420] border border-gray-800 rounded-xl shadow-2xl py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-sm font-semibold text-white mb-1">My Account</p>
            <p className="text-xs text-gray-400">{user?.email}</p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {onViewProfile && (
              <button
                onClick={() => handleMenuClick(onViewProfile)}
                className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-800/50 flex items-center gap-3 transition-colors"
              >
                <UserCircle size={18} />
                <span>Profile</span>
              </button>
            )}

            <button
              className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-800/50 flex items-center gap-3 transition-colors"
            >
              <User size={18} />
              <span>Medical History</span>
            </button>

            {onViewSettings && (
              <button
                onClick={() => handleMenuClick(onViewSettings)}
                className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-800/50 flex items-center gap-3 transition-colors"
              >
                <Settings size={18} />
                <span>Settings</span>
              </button>
            )}
          </div>

          {/* Switch Role Section for Admin */}
          {user?.role === 'admin' && (
            <>
              <div className="my-2 border-t border-gray-800"></div>
              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Switch Role
                </p>
              </div>
              {onSwitchToPatient && (
                <button
                  onClick={() => handleMenuClick(onSwitchToPatient)}
                  className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-800/50 flex items-center gap-3 transition-colors"
                >
                  <User size={18} className="text-teal-400" />
                  <span>Patient View</span>
                </button>
              )}
              {onSwitchToDoctor && (
                <button
                  onClick={() => handleMenuClick(onSwitchToDoctor)}
                  className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-800/50 flex items-center gap-3 transition-colors"
                >
                  <Shield size={18} className="text-blue-400" />
                  <span>Admin View</span>
                  {user?.role === 'admin' && (
                    <span className="ml-auto text-blue-400">✓</span>
                  )}
                </button>
              )}
            </>
          )}

          {/* Sign Out */}
          <div className="border-t border-gray-800 mt-2 py-2">
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-gray-800/50 flex items-center gap-3 transition-colors"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}