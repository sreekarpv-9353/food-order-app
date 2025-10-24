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
  const [sideMenuOpen, setSideMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await dispatch(signOutUser()).unwrap();
      setSideMenuOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const closeSideMenu = () => {
    setSideMenuOpen(false);
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
      {/* Top Header with Profile & Menu */}
      <header className={`${colors.primary} text-white shadow-xl sticky top-0 z-50`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-white bg-opacity-20 rounded-lg p-1">
                <span className="text-xl">🍔</span>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">FlashFood</h1>
                <p className="text-xs opacity-80 -mt-1">Quick & Fresh</p>
              </div>
            </Link>
            
            {/* User Info & Menu Button */}
            <div className="flex items-center space-x-3">
              {user && (
                <div className="hidden sm:flex items-center space-x-2 bg-white bg-opacity-15 rounded-full px-3 py-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm font-medium">Hi, {user.name?.split(' ')[0]}</span>
                </div>
              )}
              
              <button
                onClick={() => setSideMenuOpen(!sideMenuOpen)}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  sideMenuOpen ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-15'
                }`}
                aria-label="Toggle menu"
              >
                <div className="w-6 h-6 flex flex-col justify-center items-center">
                  <div className={`w-5 h-0.5 bg-white transition-all duration-200 ${
                    sideMenuOpen ? 'rotate-45 translate-y-0.5' : '-translate-y-1'
                  }`}></div>
                  <div className={`w-5 h-0.5 bg-white transition-all duration-200 ${
                    sideMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`}></div>
                  <div className={`w-5 h-0.5 bg-white transition-all duration-200 ${
                    sideMenuOpen ? '-rotate-45 -translate-y-0.5' : 'translate-y-1'
                  }`}></div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navigation Bar - Simplified */}
      <nav className={`${colors.primary} text-white shadow-2xl fixed bottom-0 left-0 right-0 z-40 border-t border-orange-400 pb-safe`}>
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
              >
                <div className={`text-xl mb-1 transition-transform ${isActiveRoute('/my-orders') ? 'scale-110' : ''}`}>
                  📦
                </div>
                <span className="text-xs font-medium tracking-wide">Orders</span>
              </Link>
              
              {/* Cart with Badge */}
              <Link 
                to="/cart" 
                className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-200 transform active:scale-95 relative ${
                  isActiveRoute('/cart') 
                    ? `${colors.active} shadow-lg scale-105` 
                    : 'hover:bg-white hover:bg-opacity-10'
                }`}
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

              {/* Menu Button */}
              <button
                onClick={() => setSideMenuOpen(true)}
                className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-200 transform active:scale-95 ${
                  sideMenuOpen 
                    ? `${colors.active} shadow-lg scale-105` 
                    : 'hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <div className={`text-xl mb-1 transition-transform ${sideMenuOpen ? 'scale-110' : ''}`}>
                  ⋮
                </div>
                <span className="text-xs font-medium tracking-wide">Menu</span>
              </button>
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
              >
                <div className={`text-xl mb-1 transition-transform ${isActiveRoute('/signup') ? 'scale-110' : ''}`}>
                  ✨
                </div>
                <span className="text-xs font-medium tracking-wide">Sign Up</span>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Side Menu Overlay */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${
          sideMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeSideMenu}
      >
        {/* Backdrop */}
        <div className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          sideMenuOpen ? 'opacity-60' : 'opacity-0'
        }`}></div>
        
        {/* Side Menu Panel */}
        <div 
          className={`absolute top-0 right-0 h-full w-80 max-w-full ${colors.menuBg} shadow-2xl transform transition-transform duration-300 ${
            sideMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Menu Header with Profile */}
          <div className={`${colors.primary} text-white p-6`}>
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {user ? user.name?.charAt(0)?.toUpperCase() : '👤'}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-lg truncate">
                  {user ? user.name : 'Guest User'}
                </h2>
                <p className="text-orange-100 text-sm truncate">
                  {user ? user.email : 'Sign in for better experience'}
                </p>
                {user && (
                  <div className="flex items-center space-x-1 mt-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-xs text-orange-100">Online</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-4">
            {user ? (
              <>
                {/* Address */}
                <Link 
                  to="/addresses" 
                  className="flex items-center space-x-4 px-6 py-4 hover:bg-gray-50 transition-colors border-l-4 border-transparent hover:border-orange-500"
                  onClick={closeSideMenu}
                >
                  <span className="text-xl text-gray-600">📍</span>
                  <div>
                    <p className="font-medium text-gray-900">My Addresses</p>
                    <p className="text-sm text-gray-500">Manage delivery addresses</p>
                  </div>
                </Link>

                {/* FAQ */}
                <Link 
                  to="/faq" 
                  className="flex items-center space-x-4 px-6 py-4 hover:bg-gray-50 transition-colors border-l-4 border-transparent hover:border-orange-500"
                  onClick={closeSideMenu}
                >
                  <span className="text-xl text-gray-600">❓</span>
                  <div>
                    <p className="font-medium text-gray-900">Help & FAQ</p>
                    <p className="text-sm text-gray-500">Get help and support</p>
                  </div>
                </Link>

                {/* Divider */}
                <div className="border-t border-gray-200 my-2"></div>

                {/* Sign Out */}
                <button 
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-4 px-6 py-4 hover:bg-red-50 transition-colors border-l-4 border-transparent hover:border-red-500 text-left"
                >
                  <span className="text-xl text-red-500">🚪</span>
                  <div>
                    <p className="font-medium text-red-600">Sign Out</p>
                    <p className="text-sm text-red-400">Logout from your account</p>
                  </div>
                </button>
              </>
            ) : (
              <>
                {/* FAQ for Guests */}
                <Link 
                  to="/faq" 
                  className="flex items-center space-x-4 px-6 py-4 hover:bg-gray-50 transition-colors border-l-4 border-transparent hover:border-orange-500"
                  onClick={closeSideMenu}
                >
                  <span className="text-xl text-gray-600">❓</span>
                  <div>
                    <p className="font-medium text-gray-900">Help & FAQ</p>
                    <p className="text-sm text-gray-500">Get help and support</p>
                  </div>
                </Link>

                {/* Divider */}
                <div className="border-t border-gray-200 my-2"></div>

                {/* Auth Buttons for Guests */}
                <div className="px-6 py-4 space-y-3">
                  <Link 
                    to="/login" 
                    className="block w-full text-center bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
                    onClick={closeSideMenu}
                  >
                    Sign In to Account
                  </Link>
                  <Link 
                    to="/signup" 
                    className="block w-full text-center bg-gray-100 text-gray-700 px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all duration-200 transform hover:scale-105 active:scale-95"
                    onClick={closeSideMenu}
                  >
                    Create New Account
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* App Version / Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            <p className="text-center text-xs text-gray-500">
              FlashFood v1.0 • Fresh & Fast
            </p>
          </div>
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