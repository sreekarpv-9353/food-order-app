// src/pages/Login.js
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { signInUser, signInWithGoogle, clearError } from '../redux/slices/authSlice';
import { Helmet } from 'react-helmet';
import ForgotPassword from '../components/ForgotPassword';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const { loading, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) dispatch(clearError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(signInUser(formData)).unwrap();
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await dispatch(signInWithGoogle()).unwrap();
      navigate('/');
    } catch (error) {
      console.error('Google sign in failed:', error);
    }
  };

  return (
    <>
      <Helmet>
        <link
          href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style>
          {`
            .work-sans {
              font-family: 'Work Sans', sans-serif;
            }
            .work-sans-medium {
              font-family: 'Work Sans', sans-serif;
              font-weight: 500;
            }
            .work-sans-semibold {
              font-family: 'Work Sans', sans-serif;
              font-weight: 600;
            }
            .work-sans-bold {
              font-family: 'Work Sans', sans-serif;
              font-weight: 700;
            }
          `}
        </style>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 flex flex-col justify-center py-8 sm:py-12 sm:px-6 lg:px-8 work-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <span className="text-xl text-white">🔑</span>
            </div>
            <h2 className="text-xl sm:text-2xl work-sans-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Welcome Back
            </h2>
            <p className="text-gray-600 text-xs sm:text-sm mt-1 work-sans-medium">
              Sign in to your FlashFood account
            </p>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white/80 backdrop-blur-lg py-6 px-4 sm:px-6 shadow-lg sm:rounded-2xl rounded-xl border border-gray-200/60">
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg work-sans-medium text-xs">
                  {error}
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-xs sm:text-sm work-sans-medium text-gray-700 mb-1">
                  Email address
                </label>
                <div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent work-sans-medium text-sm"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs sm:text-sm work-sans-medium text-gray-700 mb-1">
                  Password
                </label>
                <div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent work-sans-medium text-sm"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs sm:text-sm work-sans-medium text-orange-600 hover:text-orange-500 transition-colors"
                >
                  Forgot your password?
                </button>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 sm:py-3 px-4 border border-transparent rounded-lg sm:rounded-xl shadow-sm text-sm work-sans-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-all duration-200 hover:shadow active:scale-95"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in to FlashFood'
                  )}
                </button>
              </div>

              {/* <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs sm:text-sm">
                  <span className="px-2 bg-white/80 text-gray-500 work-sans-medium">Or continue with</span>
                </div>
              </div> */}

              {/* <div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center py-2 sm:py-3 px-4 border border-gray-300 rounded-lg sm:rounded-xl shadow-sm text-sm work-sans-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-all duration-200 hover:shadow active:scale-95"
                >
                  <img 
                    src="https://www.google.com/favicon.ico" 
                    alt="Google" 
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                  />
                  Sign in with Google
                </button>
              </div> */}

              <div className="text-center">
                <p className="text-gray-600 text-xs sm:text-sm work-sans-medium">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-orange-600 hover:text-orange-500 work-sans-semibold transition-colors">
                    Sign up now
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showForgotPassword && (
        <ForgotPassword 
          onClose={() => setShowForgotPassword(false)}
          showLogin={() => setShowForgotPassword(false)}
        />
      )}
    </>
  );
};

export default Login;