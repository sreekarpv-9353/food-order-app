// src/components/Header.js
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { signOutUser } from '../redux/slices/authSlice';
import { Helmet } from 'react-helmet';

const Header = () => {
  const { user } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();
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
      
      <header className="bg-orange-500 text-white shadow-lg sticky top-0 z-50 work-sans">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="text-2xl work-sans-bold flex items-center" onClick={closeMobileMenu}>
              🍔 FlashFood
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6 work-sans-medium">
              <Link to="/" className="hover:text-orange-200 transition-colors text-sm">
                Home
              </Link>
              {user ? (
                <>
                  <Link to="/my-orders" className="hover:text-orange-200 transition-colors text-sm">
                    My Orders
                  </Link>
                  <Link to="/addresses" className="hover:text-orange-200 transition-colors text-sm">
                    Addresses
                  </Link>
                  <Link to="/cart" className="hover:text-orange-200 relative transition-colors text-sm">
                    Cart
                    {cartItemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center work-sans-bold">
                        {cartItemCount}
                      </span>
                    )}
                  </Link>
                  <div className="flex items-center space-x-4 pl-4 border-l border-orange-400">
                    <span className="text-sm work-sans-medium">Hello, {user.name}</span>
                    <button 
                      onClick={handleSignOut}
                      className="bg-orange-600 px-4 py-2 rounded hover:bg-orange-700 transition-colors text-sm work-sans-semibold"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex space-x-4">
                  <Link to="/login" className="hover:text-orange-200 transition-colors text-sm">
                    Login
                  </Link>
                  <Link to="/signup" className="bg-orange-600 px-4 py-2 rounded hover:bg-orange-700 transition-colors text-sm work-sans-semibold">
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden focus:outline-none p-2 hover:bg-orange-600 rounded transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                // Close Icon
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                // Hamburger Icon
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          <div
            className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out work-sans ${
              mobileMenuOpen ? 'max-h-screen opacity-100 mt-4' : 'max-h-0 opacity-0'
            }`}
          >
            <nav className="flex flex-col space-y-3 pb-4">
              <Link 
                to="/" 
                className="hover:bg-orange-600 px-4 py-2 rounded transition-colors work-sans-medium text-sm"
                onClick={closeMobileMenu}
              >
                🏠 Home
              </Link>
              
              {user ? (
                <>
                  <Link 
                    to="/my-orders" 
                    className="hover:bg-orange-600 px-4 py-2 rounded transition-colors work-sans-medium text-sm"
                    onClick={closeMobileMenu}
                  >
                    📦 My Orders
                  </Link>
                  <Link 
                    to="/addresses" 
                    className="hover:bg-orange-600 px-4 py-2 rounded transition-colors work-sans-medium text-sm"
                    onClick={closeMobileMenu}
                  >
                    📍 Addresses
                  </Link>
                  <Link 
                    to="/cart" 
                    className="hover:bg-orange-600 px-4 py-2 rounded transition-colors flex items-center justify-between work-sans-medium text-sm"
                    onClick={closeMobileMenu}
                  >
                    <span>🛒 Cart</span>
                    {cartItemCount > 0 && (
                      <span className="bg-red-500 text-white rounded-full px-2 py-1 text-xs work-sans-bold">
                        {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
                      </span>
                    )}
                  </Link>
                  
                  <div className="border-t border-orange-400 pt-3 mt-2">
                    <div className="px-4 py-2 text-sm text-orange-100 work-sans-medium">
                      👤 {user.name}
                    </div>
                    <button 
                      onClick={handleSignOut}
                      className="w-full text-left hover:bg-orange-600 px-4 py-2 rounded transition-colors work-sans-medium text-sm"
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="hover:bg-orange-600 px-4 py-2 rounded transition-colors work-sans-medium text-sm"
                    onClick={closeMobileMenu}
                  >
                    🔑 Login
                  </Link>
                  <Link 
                    to="/signup" 
                    className="bg-orange-600 px-4 py-2 rounded hover:bg-orange-700 transition-colors text-center work-sans-semibold text-sm"
                    onClick={closeMobileMenu}
                  >
                    ✨ Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;