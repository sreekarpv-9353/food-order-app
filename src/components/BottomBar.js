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

  return (
    <>
      {/* Top Header - Only Logo */}
      <header className="bg-orange-500 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="text-2xl font-bold flex items-center">
              🍔 FlashFood
            </Link>
            
            {/* User Info & Mobile Menu Button */}
            <div className="flex items-center space-x-4">
              {user && (
                <span className="text-sm hidden sm:block">Hello, {user.name}</span>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="focus:outline-none p-2 hover:bg-orange-600 rounded transition-colors nav-item"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navigation Bar */}
      <nav className="bg-orange-500 text-white shadow-lg fixed bottom-0 left-0 right-0 z-50 border-t border-orange-400 bottom-nav bottom-nav-safe">
        <div className="container mx-auto">
          {user ? (
            <div className="flex justify-around items-center py-2">
              <Link 
                to="/" 
                className={`flex flex-col items-center p-2 rounded-lg transition-colors nav-item ${
                  isActiveRoute('/') ? 'bg-orange-600' : 'hover:bg-orange-600'
                }`}
              >
                <span className="text-lg">🏠</span>
                <span className="text-xs mt-1">Home</span>
              </Link>
              
              <Link 
                to="/my-orders" 
                className={`flex flex-col items-center p-2 rounded-lg transition-colors nav-item ${
                  isActiveRoute('/my-orders') ? 'bg-orange-600' : 'hover:bg-orange-600'
                }`}
              >
                <span className="text-lg">📦</span>
                <span className="text-xs mt-1">Orders</span>
              </Link>
              
              <Link 
                to="/addresses" 
                className={`flex flex-col items-center p-2 rounded-lg transition-colors nav-item ${
                  isActiveRoute('/addresses') ? 'bg-orange-600' : 'hover:bg-orange-600'
                }`}
              >
                <span className="text-lg">📍</span>
                <span className="text-xs mt-1">Address</span>
              </Link>
              
              <Link 
                to="/cart" 
                className={`flex flex-col items-center p-2 rounded-lg transition-colors nav-item relative ${
                  isActiveRoute('/cart') ? 'bg-orange-600' : 'hover:bg-orange-600'
                }`}
              >
                <span className="text-lg">🛒</span>
                <span className="text-xs mt-1">Cart</span>
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold cart-badge">
                    {cartItemCount}
                  </span>
                )}
              </Link>
            </div>
          ) : (
            <div className="flex justify-around items-center py-2">
              <Link 
                to="/" 
                className={`flex flex-col items-center p-2 rounded-lg transition-colors nav-item ${
                  isActiveRoute('/') ? 'bg-orange-600' : 'hover:bg-orange-600'
                }`}
              >
                <span className="text-lg">🏠</span>
                <span className="text-xs mt-1">Home</span>
              </Link>
              
              <Link 
                to="/login" 
                className={`flex flex-col items-center p-2 rounded-lg transition-colors nav-item ${
                  isActiveRoute('/login') ? 'bg-orange-600' : 'hover:bg-orange-600'
                }`}
              >
                <span className="text-lg">🔑</span>
                <span className="text-xs mt-1">Login</span>
              </Link>
              
              <Link 
                to="/signup" 
                className={`flex flex-col items-center p-2 rounded-lg transition-colors nav-item ${
                  isActiveRoute('/signup') ? 'bg-orange-600' : 'hover:bg-orange-600'
                }`}
              >
                <span className="text-lg">✨</span>
                <span className="text-xs mt-1">Sign Up</span>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 swipe-area ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMobileMenu}
      >
        <div 
          className={`absolute top-16 right-4 bg-white rounded-lg shadow-xl py-2 min-w-48 transition-transform duration-300 ${
            mobileMenuOpen ? 'translate-y-0' : '-translate-y-4'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {user ? (
            <>
              <div className="px-4 py-2 border-b border-gray-200">
                <p className="text-sm text-gray-600">Hello,</p>
                <p className="font-medium text-gray-900">{user.name}</p>
              </div>
              <button 
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 transition-colors nav-item"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="px-4 py-2">
              <p className="text-sm text-gray-600">Guest User</p>
              <div className="flex space-x-2 mt-2">
                <Link 
                  to="/login" 
                  className="flex-1 text-center bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 transition-colors nav-item"
                  onClick={closeMobileMenu}
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="flex-1 text-center bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 transition-colors nav-item"
                  onClick={closeMobileMenu}
                >
                  Sign Up
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BottomBar;