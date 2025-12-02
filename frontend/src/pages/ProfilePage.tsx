import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Fade, Slide } from 'react-awesome-reveal';
import { authApi } from '../services/authApi';
import { useAuthStore } from '../store/authStore';
import { Avatar } from '../components/common/Avatar';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, setAuth, logout } = useAuthStore();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadUserData();
  }, [user, navigate]);

  const loadUserData = async () => {
    try {
      const currentUser = await authApi.getCurrentUser();
      setFormData({
        name: currentUser.name,
        email: currentUser.email,
      });
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setUpdating(true);

    try {
      const updatedUser = await authApi.updateProfile({
        name: formData.name,
      });
      const accessToken = localStorage.getItem('accessToken') || '';
      const refreshToken = localStorage.getItem('refreshToken') || '';
      setAuth(updatedUser, accessToken, refreshToken);
      setMessage('Profile updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Fade>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                <p className="text-gray-600 mt-2">Manage your account information</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back to Dashboard
              </motion.button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
              >
                {error}
              </motion.div>
            )}

            {message && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6"
              >
                {message}
              </motion.div>
            )}

            <Slide>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                {/* Avatar Section */}
                <div className="text-center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="mb-4 flex justify-center"
                  >
                    <Avatar size="xl" />
                  </motion.div>
                  <h2 className="text-xl font-semibold text-gray-900">{formData.name}</h2>
                  <p className="text-gray-500">{formData.email}</p>
                </div>

                {/* Form Section */}
                <div className="md:col-span-2">
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    <div className="flex gap-3 justify-end">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={updating}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      {updating ? 'Updating...' : 'Update Profile'}
                    </motion.button>
                  <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                        className="px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                  >
                    Logout
                  </motion.button>
                    </div>
                  </form>
                </div>
              </div>
            </Slide>
          </motion.div>
        </Fade>
      </div>
    </div>
  );
};

export default ProfilePage;

