// src/components/BottomBar.js
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOutUser } from '../redux/slices/authSlice';
import { Helmet } from 'react-helmet';

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
            .safe-area-bottom {
              padding-bottom: env(safe-area-inset-bottom);
            }
            .min-h-safe {
              min-height: calc(100vh - env(safe-area-inset-bottom));
            }
          `}
        </style>
      </Helmet>

      {/* Top Header with Profile & Menu - Reduced Height */}
      <header className={`${colors.primary} text-white shadow-lg sticky top-0 z-50 work-sans safe-area-top`}>
        <div className="container mx-auto px-4 py-2">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-white bg-opacity-20 rounded p-1">
                <img 
                  src={require('../assets/homeicon.png')} 
                  alt="FlashFood" 
                  className="w-5 h-5 object-contain rounded"
                />
              </div>
              <div>
                <h1 className="text-base work-sans-bold tracking-tight">FlashFood</h1>
                <p className="text-xs opacity-80 -mt-0.5 work-sans-medium">Quick & Fresh</p>
              </div>
            </Link>

            {/* User Info & Menu Button */}
            <div className="flex items-center space-x-2">
              {user && (
                <div className="hidden xs:flex items-center space-x-1 bg-white bg-opacity-15 rounded-full px-2 py-0.5">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span className="text-xs work-sans-medium">Hi, {user.name?.split(' ')[0]}</span>
                </div>
              )}
              
              <button
                onClick={() => setSideMenuOpen(!sideMenuOpen)}
                className={`p-1.5 rounded-lg transition-all duration-200 ${
                  sideMenuOpen ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-15'
                }`}
                aria-label="Toggle menu"
              >
                <div className="w-5 h-5 flex flex-col justify-center items-center">
                  <div className={`w-4 h-0.5 bg-white transition-all duration-200 ${
                    sideMenuOpen ? 'rotate-45 translate-y-0.5' : '-translate-y-1'
                  }`}></div>
                  <div className={`w-4 h-0.5 bg-white transition-all duration-200 ${
                    sideMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`}></div>
                  <div className={`w-4 h-0.5 bg-white transition-all duration-200 ${
                    sideMenuOpen ? '-rotate-45 -translate-y-0.5' : 'translate-y-1'
                  }`}></div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navigation Bar - Reduced Height */}
      <nav className={`${colors.primary} text-white shadow-2xl fixed bottom-0 left-0 right-0 z-40 border-t border-orange-400 safe-area-bottom work-sans`}>
        <div className="container mx-auto">
          {user ? (
            <div className="flex justify-around items-center py-1 px-1">
              {/* Home */}
              <Link 
                to="/" 
                className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 transform active:scale-95 flex-1 max-w-[20%] ${
                  isActiveRoute('/') 
                    ? `${colors.active} shadow scale-105` 
                    : 'hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <div className={`text-lg mb-0.5 transition-transform ${isActiveRoute('/') ? 'scale-110' : ''}`}>
                  🏠
                </div>
                <span className="text-xs work-sans-medium truncate w-full text-center">Home</span>
              </Link>
              
              {/* Orders */}
              <Link 
                to="/my-orders" 
                className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 transform active:scale-95 flex-1 max-w-[20%] ${
                  isActiveRoute('/my-orders') 
                    ? `${colors.active} shadow scale-105` 
                    : 'hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <div className={`text-lg mb-0.5 transition-transform ${isActiveRoute('/my-orders') ? 'scale-110' : ''}`}>
                  📦
                </div>
                <span className="text-xs work-sans-medium truncate w-full text-center">Orders</span>
              </Link>
              
              {/* Cart with Badge */}
              <Link 
                to="/cart" 
                className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 transform active:scale-95 relative flex-1 max-w-[20%] ${
                  isActiveRoute('/cart') 
                    ? `${colors.active} shadow scale-105` 
                    : 'hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <div className={`text-lg mb-0.5 transition-transform ${isActiveRoute('/cart') ? 'scale-110' : ''}`}>
                  🛒
                </div>
                <span className="text-xs work-sans-medium truncate w-full text-center">Cart</span>
                {cartItemCount > 0 && (
                  <span className={`absolute -top-1 -right-1 ${colors.badge} text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center work-sans-bold shadow animate-pulse`}>
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                )}
              </Link>

              {/* Menu Button */}
              <button
                onClick={() => setSideMenuOpen(true)}
                className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 transform active:scale-95 flex-1 max-w-[20%] ${
                  sideMenuOpen 
                    ? `${colors.active} shadow scale-105` 
                    : 'hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <div className={`text-lg mb-0.5 transition-transform ${sideMenuOpen ? 'scale-110' : ''}`}>
                  ⋮
                </div>
                <span className="text-xs work-sans-medium truncate w-full text-center">Menu</span>
              </button>
            </div>
          ) : (
            <div className="flex justify-around items-center py-1 px-1">
              {/* Home for Guests */}
              <Link 
                to="/" 
                className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 transform active:scale-95 flex-1 max-w-[30%] ${
                  isActiveRoute('/') 
                    ? `${colors.active} shadow scale-105` 
                    : 'hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <div className={`text-lg mb-0.5 transition-transform ${isActiveRoute('/') ? 'scale-110' : ''}`}>
                  🏠
                </div>
                <span className="text-xs work-sans-medium truncate w-full text-center">Home</span>
              </Link>
              
              {/* Login */}
              <Link 
                to="/login" 
                className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 transform active:scale-95 flex-1 max-w-[30%] ${
                  isActiveRoute('/login') 
                    ? `${colors.active} shadow scale-105` 
                    : 'hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <div className={`text-lg mb-0.5 transition-transform ${isActiveRoute('/login') ? 'scale-110' : ''}`}>
                  🔑
                </div>
                <span className="text-xs work-sans-medium truncate w-full text-center">Login</span>
              </Link>
              
              {/* Sign Up */}
              <Link 
                to="/signup" 
                className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 transform active:scale-95 flex-1 max-w-[30%] ${
                  isActiveRoute('/signup') 
                    ? `${colors.active} shadow scale-105` 
                    : 'hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <div className={`text-lg mb-0.5 transition-transform ${isActiveRoute('/signup') ? 'scale-110' : ''}`}>
                  ✨
                </div>
                <span className="text-xs work-sans-medium truncate w-full text-center">Sign Up</span>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Side Menu Overlay - Mobile Optimized */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 work-sans ${
          sideMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeSideMenu}
      >
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${
            sideMenuOpen ? 'opacity-60' : 'opacity-0'
          }`}
          onClick={closeSideMenu}
        ></div>
        
        {/* Side Menu Panel - Mobile Optimized */}
        <div 
          className={`absolute top-0 right-0 h-full w-80 max-w-[90vw] ${colors.menuBg} shadow-2xl transform transition-transform duration-300 ${
            sideMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          {/* <button
            onClick={closeSideMenu}
            className="absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-700 transition-colors z-10"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button> */}

          {/* Menu Header with Profile */}
          <div className={`${colors.primary} text-white p-4 pt-12 safe-area-top`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white work-sans-bold text-base">
                {user ? user.name?.charAt(0)?.toUpperCase() : '👤'}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="work-sans-bold text-sm truncate">
                  {user ? user.name : 'Guest User'}
                </h2>
                <p className="text-orange-100 text-xs truncate work-sans-medium mt-0.5">
                  {user ? user.email : 'Sign in for better experience'}
                </p>
                {user && (
                  <div className="flex items-center space-x-1 mt-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    <span className="text-xs text-orange-100 work-sans-medium">Online</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-3 max-h-[calc(100vh-180px)] overflow-y-auto safe-area-bottom">
            {user ? (
              <>
                {/* Address */}
                <Link 
                  to="/addresses" 
                  className="flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 transition-colors border-l-4 border-transparent hover:border-orange-500"
                  onClick={closeSideMenu}
                >
                  <span className="text-base text-gray-600">📍</span>
                  <div className="flex-1 min-w-0">
                    <p className="work-sans-medium text-gray-900 text-sm">My Addresses</p>
                    <p className="text-gray-500 text-xs work-sans-medium mt-0.5">Manage delivery addresses</p>
                  </div>
                </Link>

                {/* FAQ */}
                <Link 
                  to="/faq" 
                  className="flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 transition-colors border-l-4 border-transparent hover:border-orange-500"
                  onClick={closeSideMenu}
                >
                  <span className="text-base text-gray-600">❓</span>
                  <div className="flex-1 min-w-0">
                    <p className="work-sans-medium text-gray-900 text-sm">Help & FAQ</p>
                    <p className="text-gray-500 text-xs work-sans-medium mt-0.5">Get help and support</p>
                  </div>
                </Link>

                {/* Divider */}
                <div className="border-t border-gray-200 my-1 mx-4"></div>

                {/* Sign Out */}
                <button 
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-red-50 transition-colors border-l-4 border-transparent hover:border-red-500 text-left"
                >
                  <span className="text-base text-red-500">🚪</span>
                  <div className="flex-1 min-w-0">
                    <p className="work-sans-medium text-red-600 text-sm">Sign Out</p>
                    <p className="text-red-400 text-xs work-sans-medium mt-0.5">Logout from your account</p>
                  </div>
                </button>
              </>
            ) : (
              <>
                {/* FAQ for Guests */}
                <Link 
                  to="/faq" 
                  className="flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 transition-colors border-l-4 border-transparent hover:border-orange-500"
                  onClick={closeSideMenu}
                >
                  <span className="text-base text-gray-600">❓</span>
                  <div className="flex-1 min-w-0">
                    <p className="work-sans-medium text-gray-900 text-sm">Help & FAQ</p>
                    <p className="text-gray-500 text-xs work-sans-medium mt-0.5">Get help and support</p>
                  </div>
                </Link>

                {/* Divider */}
                <div className="border-t border-gray-200 my-1 mx-4"></div>

                {/* Auth Buttons for Guests */}
                <div className="px-4 py-3 space-y-2">
                  <Link 
                    to="/login" 
                    className="block w-full text-center bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-2 rounded-lg text-sm work-sans-semibold hover:shadow transition-all duration-200 active:scale-95"
                    onClick={closeSideMenu}
                  >
                    Sign In to Account
                  </Link>
                  <Link 
                    to="/signup" 
                    className="block w-full text-center bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm work-sans-semibold hover:bg-gray-200 transition-all duration-200 active:scale-95"
                    onClick={closeSideMenu}
                  >
                    Create New Account
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* App Version / Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200 bg-white safe-area-bottom">
            <p className="text-center text-xs text-gray-500 work-sans-medium">
              FlashFood v1.0 • Fresh & Fast
            </p>
          </div>
        </div>
      </div>

      {/* Add custom styles for mobile optimization */}
      <style jsx>{`
        @media (max-width: 360px) {
          .text-xs {
            font-size: 0.65rem;
          }
        }
        .safe-area-top {
          padding-top: env(safe-area-inset-top);
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </>
  );
};

export default BottomBar;