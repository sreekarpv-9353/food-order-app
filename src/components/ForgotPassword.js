// src/components/ForgotPassword.js
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { resetPassword, clearError, clearSuccess } from '../redux/slices/authSlice';

const ForgotPassword = ({ onClose, showLogin }) => {
  const [email, setEmail] = useState('');
  const { loading, error, success } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(resetPassword(email)).unwrap();
    } catch (error) {
      console.error('Password reset failed:', error);
    }
  };

  const handleClose = () => {
    dispatch(clearError());
    dispatch(clearSuccess());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg work-sans-semibold text-gray-900">Reset Password</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl work-sans-medium text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl work-sans-medium text-sm">
              {success}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm work-sans-medium text-gray-700 mb-2">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent work-sans-medium text-sm"
              placeholder="Enter your email"
            />
            <p className="text-xs text-gray-500 mt-2 work-sans-medium">
              We'll send you a link to reset your password
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-sm work-sans-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm work-sans-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Sending...
                </div>
              ) : (
                'Reset Password'
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={showLogin}
            className="text-orange-600 hover:text-orange-500 work-sans-medium text-sm transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;