import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Doctor } from '../lib/supabase';
import { Button } from './Button';
import { Input } from './Input';
import { X, UserCircle, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface EditProfileModalProps {
  onClose: () => void;
}

export function EditProfileModal({ onClose }: EditProfileModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  
  // Doctor-specific fields
  const [specialization, setSpecialization] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('0');
  const [bio, setBio] = useState('');
  const [doctorData, setDoctorData] = useState<Doctor | null>(null);

  useEffect(() => {
    if (user?.role === 'doctor') {
      fetchDoctorProfile();
    }
  }, [user]);

  const fetchDoctorProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setDoctorData(data);
        setSpecialization(data.specialization || '');
        setLicenseNumber(data.license_number || '');
        setYearsOfExperience(data.years_of_experience?.toString() || '0');
        setBio(data.bio || '');
      }
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update user profile
      const { error: userError } = await supabase
        .from('users')
        .update({
          full_name: fullName,
        })
        .eq('id', user?.id);

      if (userError) throw userError;

      // Update doctor profile if user is a doctor
      if (user?.role === 'doctor' && doctorData) {
        const { error: doctorError } = await supabase
          .from('doctors')
          .update({
            specialization,
            license_number: licenseNumber,
            years_of_experience: parseInt(yearsOfExperience) || 0,
            bio,
          })
          .eq('id', doctorData.id);

        if (doctorError) throw doctorError;
      }

      toast.success('Profile updated successfully');
      onClose();
      
      // Reload the page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
              <UserCircle className="text-teal-600 dark:text-teal-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Profile</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Update your personal information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
            <div className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <Input
                label="Email Address"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Email cannot be changed. Contact support if you need to update your email.
              </p>
            </div>
          </div>

          {/* Doctor-specific fields */}
          {user?.role === 'doctor' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Professional Information</h3>
              <div className="space-y-4">
                <Input
                  label="Specialization"
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g., Cardiology, General Practice"
                  required
                />
                <Input
                  label="License Number"
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="Your medical license number"
                />
                <Input
                  label="Years of Experience"
                  type="number"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                  min="0"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Tell patients about yourself, your experience, and approach to healthcare..."
                  />
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={loading}>
            <Save size={18} className="mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}