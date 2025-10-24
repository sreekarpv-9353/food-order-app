// src/components/BottomBar.js
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOutUser } from '../redux/slices/authSlice';

const BottomBar = () => {
  const { user } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await dispatch(signOutUser()).unwrap();
      setMobileMenuOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  // Enhanced color scheme
  const colors = {
    primary: 'bg-gradient-to-r from-orange-500 to-orange-600',
    primaryHover: 'bg-orange-600',
    active: 'bg-white bg-opacity-20',
    text: 'text-white',
    textMuted: 'text-orange-100',
    badge: 'bg-red-500',
    menuBg: 'bg-white',
    menuText: 'text-gray-900',
    menuBorder: 'border-orange-200'
  };

  return (
    <>
      {/* Top Header - Modern Design */}
      <header className={`${colors.primary} text-white shadow-xl sticky top-0 z-50`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Logo with better typography */}
            <Link to="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
              <div className="bg-white bg-opacity-20 rounded-lg p-1">
                <span className="text-xl">🍔</span>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">FlashFood</h1>
                <p className="text-xs opacity-80 -mt-1">Quick & Fresh</p>
              </div>
            </Link>
            
            {/* User Info & Mobile Menu Button */}
            <div className="flex items-center space-x-3">
              {user && (
                <div className="hidden sm:flex items-center space-x-2 bg-white bg-opacity-15 rounded-full px-3 py-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm font-medium">Hi, {user.name?.split(' ')[0]}</span>
                </div>
              )}
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  mobileMenuOpen ? 'bg-white bg-opacity-20 rotate-90' : 'hover:bg-white hover:bg-opacity-15'
                }`}
                aria-label="Toggle menu"
              >
                <div className="w-6 h-6 flex flex-col justify-center items-center">
                  <div className={`w-5 h-0.5 bg-white transition-all duration-200 ${
                    mobileMenuOpen ? 'rotate-45 translate-y-0.5' : '-translate-y-1'
                  }`}></div>
                  <div className={`w-5 h-0.5 bg-white transition-all duration-200 ${
                    mobileMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`}></div>
                  <div className={`w-5 h-0.5 bg-white transition-all duration-200 ${
                    mobileMenuOpen ? '-rotate-45 -translate-y-0.5' : 'translate-y-1'
                  }`}></div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navigation Bar - Enhanced Design */}
      <nav className={`${colors.primary} text-white shadow-2xl fixed bottom-0 left-0 right-0 z-50 border-t border-orange-400 pb-safe`}>
        <div className="container mx-auto">
          {user ? (
            <div className="flex justify-around items-center py-2 px-1">
              {/* Home */}
              <Link 
                to="/" 
                className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-200 transform active:scale-95 ${
                  isActiveRoute('/') 
                    ? `${colors.active} shadow-lg scale-105` 
                    : 'hover:bg-white hover:bg-opacity-10'
                }`}
                onClick={closeMobileMenu}
              >
                <div className={`text-xl mb-1 transition-transform ${isActiveRoute('/') ? 'scale-110' : ''}`}>
                  🏠
                </div>
                <span className="text-xs font-medium tracking-wide">Home</span>
              </Link>
              
              {/* Orders */}
              <Link 
                to="/my-orders" 
                className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-200 transform active:scale-95 ${
                  isActiveRoute('/my-orders') 
                    ? `${colors.active} shadow-lg scale-105` 
                    : 'hover:bg-white hover:bg-opacity-10'
                }`}
                onClick={closeMobileMenu}
              >
                <div className={`text-xl mb-1 transition-transform ${isActiveRoute('/my-orders') ? 'scale-110' : ''}`}>
                  📦
                </div>
                <span className="text-xs font-medium tracking-wide">Orders</span>
              </Link>
              
              {/* Address */}
              <Link 
                to="/addresses" 
                className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-200 transform active:scale-95 ${
                  isActiveRoute('/addresses') 
                    ? `${colors.active} shadow-lg scale-105` 
                    : 'hover:bg-white hover:bg-opacity-10'
                }`}
                onClick={closeMobileMenu}
              >
                <div className={`text-xl mb-1 transition-transform ${isActiveRoute('/addresses') ? 'scale-110' : ''}`}>
                  📍
                </div>
                <span className="text-xs font-medium tracking-wide">Address</span>
              </Link>
              
              {/* Cart with Badge */}
              <Link 
                to="/cart" 
                className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-200 transform active:scale-95 relative ${
                  isActiveRoute('/cart') 
                    ? `${colors.active} shadow-lg scale-105` 
                    : 'hover:bg-white hover:bg-opacity-10'
                }`}
                onClick={closeMobileMenu}
              >
                <div className={`text-xl mb-1 transition-transform ${isActiveRoute('/cart') ? 'scale-110' : ''}`}>
                  🛒
                </div>
                <span className="text-xs font-medium tracking-wide">Cart</span>
                {cartItemCount > 0 && (
                  <span className={`absolute -top-1 -right-1 ${colors.badge} text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold shadow-lg animate-pulse`}>
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                )}
              </Link>
            </div>
          ) : (
            <div className="flex justify-around items-center py-2 px-1">
              {/* Home for Guests */}
              <Link 
                to="/" 
                className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-200 transform active:scale-95 ${
                  isActiveRoute('/') 
                    ? `${colors.active} shadow-lg scale-105` 
                    : 'hover:bg-white hover:bg-opacity-10'
                }`}
                onClick={closeMobileMenu}
              >
                <div className={`text-xl mb-1 transition-transform ${isActiveRoute('/') ? 'scale-110' : ''}`}>
                  🏠
                </div>
                <span className="text-xs font-medium tracking-wide">Home</span>
              </Link>
              
              {/* Login */}
              <Link 
                to="/login" 
                className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-200 transform active:scale-95 ${
                  isActiveRoute('/login') 
                    ? `${colors.active} shadow-lg scale-105` 
                    : 'hover:bg-white hover:bg-opacity-10'
                }`}
                onClick={closeMobileMenu}
              >
                <div className={`text-xl mb-1 transition-transform ${isActiveRoute('/login') ? 'scale-110' : ''}`}>
                  🔑
                </div>
                <span className="text-xs font-medium tracking-wide">Login</span>
              </Link>
              
              {/* Sign Up */}
              <Link 
                to="/signup" 
                className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-200 transform active:scale-95 ${
                  isActiveRoute('/signup') 
                    ? `${colors.active} shadow-lg scale-105` 
                    : 'hover:bg-white hover:bg-opacity-10'
                }`}
                onClick={closeMobileMenu}
              >
                <div className={`text-xl mb-1 transition-transform ${isActiveRoute('/signup') ? 'scale-110' : ''}`}>
                  ✨
                </div>
                <span className="text-xs font-medium tracking-wide">Sign Up</span>
              </Link>
              
              {/* FAQ for Guests */}
              <Link 
                to="/faq" 
                className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-200 transform active:scale-95 ${
                  isActiveRoute('/faq') 
                    ? `${colors.active} shadow-lg scale-105` 
                    : 'hover:bg-white hover:bg-opacity-10'
                }`}
                onClick={closeMobileMenu}
              >
                <div className={`text-xl mb-1 transition-transform ${isActiveRoute('/faq') ? 'scale-110' : ''}`}>
                  ❓
                </div>
                <span className="text-xs font-medium tracking-wide">Help</span>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Enhanced Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-60 z-50 transition-all duration-300 ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMobileMenu}
      >
        <div 
          className={`absolute top-20 right-4 ${colors.menuBg} rounded-2xl shadow-2xl py-3 min-w-56 transition-all duration-300 ${
            mobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {user ? (
            <>
              {/* User Info Section */}
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
                    <p className="text-gray-500 text-xs">{user.email}</p>
                  </div>
                </div>
              </div>
              
              {/* Menu Items */}
              <div className="py-2">
                <button 
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 px-5 py-3 text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <span className="text-lg">🚪</span>
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            <div className="px-5 py-4">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl">👤</span>
                </div>
                <p className="text-gray-600 text-sm">Guest User</p>
                <p className="text-gray-400 text-xs">Sign in for better experience</p>
              </div>
              
              <div className="flex space-x-2">
                <Link 
                  to="/login" 
                  className="flex-1 text-center bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
                  onClick={closeMobileMenu}
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="flex-1 text-center bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all duration-200 transform hover:scale-105 active:scale-95"
                  onClick={closeMobileMenu}
                >
                  Sign Up
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add custom styles for safe areas */}
      <style jsx>{`
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </>
  );
};

export default BottomBar;