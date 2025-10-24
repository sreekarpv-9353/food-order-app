// src/App.js
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase/config';
import { setUser } from './redux/slices/authSlice';
import { fetchRestaurants } from './redux/slices/restaurantSlice';
import { fetchUserAddresses } from './redux/slices/addressSlice';
import Addresses from './pages/Addresses';

import BottomBar from './components/BottomBar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import RestaurantDetail from './pages/RestaurantDetail';
import Cart from './pages/Cart';
import MyOrders from './pages/MyOrders';
import FAQ from './pages/FAQ';

import './App.css';

function App() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          
          dispatch(setUser({
            uid: user.uid,
            email: user.email,
            name: userData?.name
          }));

          dispatch(fetchRestaurants());
          dispatch(fetchUserAddresses(user.uid));
           setAuthChecked(true);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        dispatch(setUser(null));
      }
     
    });

    return () => unsubscribe();
  }, [dispatch]);

  // Show loading while checking authentication
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Conditionally render BottomBar only when user is logged in */}
        {user && <BottomBar />}
        
        <main className={user ? "pb-16" : ""}> {/* Only add padding if user is logged in */}
          <Routes>
            {/* Public routes - no bottom bar */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/faq" element={<FAQ />} />
            
            {/* Protected routes - with bottom bar (handled by condition above) */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/restaurant/:id"
              element={
                <ProtectedRoute>
                  <RestaurantDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-orders"
              element={
                <ProtectedRoute>
                  <MyOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/addresses"
              element={
                <ProtectedRoute>
                  <Addresses />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;