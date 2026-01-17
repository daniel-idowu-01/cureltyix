import { useState } from 'react';
import { Button } from './Button';
import { X, Settings as SettingsIcon, Bell, Lock, Palette } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { theme, toggleTheme } = useTheme();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [consultationReminders, setConsultationReminders] = useState(true);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
              <SettingsIcon className="text-teal-600 dark:text-teal-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage your preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Appearance */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Palette className="text-gray-600 dark:text-gray-400" size={20} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h3>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Theme</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Choose your preferred color scheme
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleTheme}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      theme === 'light'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Light
                  </button>
                  <button
                    onClick={toggleTheme}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      theme === 'dark'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Dark
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Bell className="text-gray-600 dark:text-gray-400" size={20} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive updates via email
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
                </label>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive push notifications on this device
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pushNotifications}
                    onChange={(e) => setPushNotifications(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
                </label>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Consultation Reminders</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get reminders about upcoming consultations
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consultationReminders}
                    onChange={(e) => setConsultationReminders(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Privacy & Security */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="text-gray-600 dark:text-gray-400" size={20} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy & Security</h3>
            </div>
            <div className="space-y-3">
              <Button variant="secondary" className="w-full justify-start">
                Change Password
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                Two-Factor Authentication
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                Privacy Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}