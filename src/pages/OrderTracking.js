// src/pages/OrderTracking.js
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Helmet } from 'react-helmet';
import { refreshUserOrders } from '../redux/slices/orderSlice';

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { orders } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.auth);
  
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch order data from Firebase in real-time
  const fetchOrderData = useCallback(async () => {
    if (!orderId || !user) return;

    try {
      setLoading(true);
      setError(null);

      // First, try to get from Redux store
      const existingOrder = orders.find(o => o.id === orderId);
      if (existingOrder) {
        setCurrentOrder(existingOrder);
        setLoading(false);
      }

      // Set up real-time listener to Firestore
      const orderDocRef = doc(db, 'orders', orderId);
      const unsubscribe = onSnapshot(
        orderDocRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const orderData = {
              id: docSnapshot.id,
              ...docSnapshot.data(),
              // Ensure timestamps are properly handled
              createdAt: docSnapshot.data().createdAt?.toDate?.() || docSnapshot.data().createdAt,
              updatedAt: docSnapshot.data().updatedAt?.toDate?.() || docSnapshot.data().updatedAt,
            };
            
            setCurrentOrder(orderData);
            setLastUpdated(new Date());
            
            // Update driver location if available
            if (orderData.driverLocation) {
              setDriverLocation(orderData.driverLocation);
            }
          } else {
            setError('Order not found in database');
          }
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching order:', error);
          setError('Failed to load order details');
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up order listener:', error);
      setError('Failed to load order tracking');
      setLoading(false);
    }
  }, [orderId, user, orders]);

  useEffect(() => {
    let unsubscribe;

    const setupOrderTracking = async () => {
      unsubscribe = await fetchOrderData();
    };

    setupOrderTracking();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [fetchOrderData]);

  // Refresh order data
  const handleRefresh = async () => {
    if (!user) return;
    
    setRefreshing(true);
    try {
      await dispatch(refreshUserOrders(user.uid)).unwrap();
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing order:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Corrected status steps with proper order
  const getStatusSteps = (orderType = 'food') => {
    const baseSteps = [
      { 
        key: 'pending', 
        label: 'Order Placed', 
        icon: '📝', 
        description: 'Your order has been received',
        estimatedTime: '2-5 min'
      },
      { 
        key: 'confirmed', 
        label: 'Order Confirmed', 
        icon: '✅', 
        description: 'Restaurant has confirmed your order',
        estimatedTime: '5-10 min'
      },
      { 
        key: 'preparing', 
        label: orderType === 'grocery' ? 'Packing' : 'Preparing', 
        icon: orderType === 'grocery' ? '📦' : '👨‍🍳', 
        description: orderType === 'grocery' ? 'Packing your items with care' : 'Chef is preparing your food',
        estimatedTime: orderType === 'grocery' ? '10-15 min' : '15-25 min'
      },
      { 
        key: 'ready', 
        label: 'Ready for Pickup', 
        icon: '📦', 
        description: orderType === 'grocery' ? 'Items packed and quality checked' : 'Food ready for delivery',
        estimatedTime: '5 min'
      },
      { 
        key: 'out-for-delivery', 
        label: 'Out for Delivery', 
        icon: '🚚', 
        description: 'On the way to your location',
        estimatedTime: '15-30 min'
      },
      { 
        key: 'delivered', 
        label: 'Delivered', 
        icon: '🎉', 
        description: 'Order successfully delivered',
        estimatedTime: 'Completed'
      }
    ];
    return baseSteps;
  };

  // Corrected status mapping and step index calculation
  const getCurrentStepIndex = (status) => {
    const steps = getStatusSteps(currentOrder?.type);
    
    // Map status to step index
    const statusToIndex = {
      'pending': 0,
      'confirmed': 1,
      'preparing': 2,
      'ready': 3,
      'out-for-delivery': 4,
      'delivered': 5,
      'cancelled': -1
    };

    return statusToIndex[status] || 0;
  };

  // Enhanced status color mapping
  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': 
        return 'bg-emerald-500 text-white border-emerald-600';
      case 'out-for-delivery': 
        return 'bg-blue-500 text-white border-blue-600';
      case 'ready': 
        return 'bg-purple-500 text-white border-purple-600';
      case 'preparing': 
        return 'bg-orange-500 text-white border-orange-600';
      case 'confirmed': 
        return 'bg-green-500 text-white border-green-600';
      case 'pending':
        return 'bg-gray-500 text-white border-gray-600';
      case 'cancelled':
        return 'bg-red-500 text-white border-red-600';
      default: 
        return 'bg-gray-500 text-white border-gray-600';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'delivered': 
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'out-for-delivery': 
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ready': 
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'preparing': 
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'confirmed': 
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default: 
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Enhanced estimated delivery time based on current status
  const getEstimatedDeliveryTime = () => {
    if (!currentOrder) return '30-45 min';
    
    const status = currentOrder.status;
    const statusTimes = {
      'pending': '40-55 min',
      'confirmed': '35-50 min',
      'preparing': '25-40 min',
      'ready': '20-35 min',
      'out-for-delivery': '10-25 min',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    
    return statusTimes[status] || currentOrder.deliveryTime || '30-45 min';
  };

  // Enhanced progress percentage calculation
  const getProgressPercentage = () => {
    const statusProgress = {
      'pending': 16,      // 1/6 steps
      'confirmed': 33,    // 2/6 steps
      'preparing': 50,    // 3/6 steps
      'ready': 66,        // 4/6 steps
      'out-for-delivery': 83, // 5/6 steps
      'delivered': 100,   // 6/6 steps
      'cancelled': 0
    };
    return statusProgress[currentOrder?.status] || 0;
  };

  const formatAddress = (address) => {
    if (!address) return 'No address provided';
    
    if (typeof address === 'string') {
      return address;
    }
    
    if (typeof address === 'object') {
      const parts = [
        address.street,
        address.villageTown,
        address.city,
        address.state,
        address.zipCode
      ].filter(part => part && part.trim() !== '');
      
      return parts.join(', ');
    }
    
    return 'Address not available';
  };

  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Get status display text
  const getStatusDisplayText = (status) => {
    const statusMap = {
      'pending': 'Order Placed',
      'confirmed': 'Confirmed',
      'preparing': 'Preparing',
      'ready': 'Ready',
      'out-for-delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    
    return statusMap[status] || status?.charAt(0)?.toUpperCase() + status?.slice(1) || 'Pending';
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 safe-area-bottom work-sans">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-6"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            <h3 className="text-xl work-sans-bold text-gray-900 mb-3">Loading Order Details</h3>
            <p className="text-gray-600 text-sm work-sans-medium text-center max-w-sm">
              Fetching real-time tracking information for your order...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !currentOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 safe-area-bottom work-sans">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="bg-red-100 p-6 rounded-2xl mb-6">
              <span className="text-6xl">❌</span>
            </div>
            <h2 className="text-2xl work-sans-bold text-gray-900 mb-3">Order Not Found</h2>
            <p className="text-gray-600 text-sm mb-8 work-sans-medium max-w-md">
              {error || "We couldn't find the order you're looking for. It may have been cancelled or doesn't exist."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/my-orders')}
                className="bg-orange-500 text-white px-8 py-4 rounded-xl hover:bg-orange-600 transition-colors work-sans-semibold text-lg"
              >
                View All Orders
              </button>
              <button
                onClick={handleRefresh}
                className="bg-white border border-gray-300 text-gray-700 px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors work-sans-semibold text-lg"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusSteps = getStatusSteps(currentOrder.type);
  const currentStepIndex = getCurrentStepIndex(currentOrder.status);
  const progressPercentage = getProgressPercentage();
  const estimatedDelivery = getEstimatedDeliveryTime();

  return (
    <>
      <Helmet>
        <title>Track Order #{currentOrder.id?.slice(-8)} | Food Delivery</title>
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
          `}
        </style>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 safe-area-bottom work-sans">
        {/* Enhanced Header */}
        <div className="bg-white/90 backdrop-blur-lg border-b border-gray-200/60 sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors active:scale-95 flex-shrink-0"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl work-sans-bold text-gray-900 truncate">Track Order</h1>
                  <p className="text-sm text-gray-500 work-sans-medium truncate">
                    #{currentOrder.id?.slice(-8).toUpperCase()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-white border border-gray-200 p-3 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 work-sans-medium flex-shrink-0"
                >
                  {refreshing ? (
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </button>
                
                <div className={`px-3 py-1.5 rounded-full text-xs work-sans-semibold border ${getStatusBadgeColor(currentOrder.status)}`}>
                  {getStatusDisplayText(currentOrder.status)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 pb-24">
          {/* Enhanced Order Summary Card */}
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4 flex-1 min-w-0">
                <div className={`p-4 rounded-2xl ${
                  currentOrder.type === 'grocery' 
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' 
                    : 'bg-gradient-to-br from-orange-500 to-orange-600'
                }`}>
                  <span className="text-2xl text-white">
                    {currentOrder.type === 'grocery' ? '🛒' : '🍽️'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="work-sans-bold text-gray-900 text-lg">
                      {currentOrder.type === 'grocery' ? 'Grocery Order' : 'Food Order'}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs work-sans-semibold ${
                      currentOrder.type === 'grocery' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-orange-50 text-orange-700 border border-orange-200'
                    }`}>
                      {currentOrder.type === 'grocery' ? 'Grocery' : 'Food'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm work-sans-medium">
                    {currentOrder.items?.length || 0} {currentOrder.items?.length === 1 ? 'item' : 'items'} • 
                    ₹{currentOrder.pricing?.grandTotal?.toFixed(2) || '0.00'}
                  </p>
                  
                  {/* Restaurant Info for Food Orders */}
                  {currentOrder.restaurant && (
                    <div className="flex items-center space-x-2 mt-3">
                      <div className="bg-blue-50 px-3 py-1.5 rounded-lg flex items-center space-x-2">
                        <span className="text-blue-600 text-sm">🏪</span>
                        <span className="text-blue-700 text-sm work-sans-medium truncate max-w-[140px]">
                          {currentOrder.restaurant.name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm work-sans-medium mb-2">
                <span className="text-gray-600">Order Progress</span>
                <span className="text-gray-900">{progressPercentage}% • Step {currentStepIndex + 1} of {statusSteps.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-blue-500/25"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Enhanced Estimated Time */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <span className="text-xl">⏱️</span>
                  </div>
                  <div>
                    <p className="work-sans-semibold text-white/90 text-sm">Estimated Delivery</p>
                    <p className="work-sans-bold text-xl">{estimatedDelivery}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="work-sans-semibold text-white/90 text-sm">Current Status</p>
                  <p className="work-sans-bold text-lg">
                    {getStatusDisplayText(currentOrder.status)}
                  </p>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            {lastUpdated && (
              <div className="mt-3 text-center">
                <p className="text-gray-500 text-xs work-sans-medium">
                  🔄 Updated {formatTime(lastUpdated)}
                </p>
              </div>
            )}
          </div>

          {/* Enhanced Tracking Timeline */}
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="work-sans-bold text-gray-900 text-xl">Order Journey</h3>
              <div className="text-right">
                <p className="text-gray-500 text-sm work-sans-medium">
                  {currentStepIndex + 1} of {statusSteps.length} steps completed
                </p>
              </div>
            </div>
            
            <div className="relative">
              {/* Vertical Timeline Line */}
              <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-gray-200 transform -translate-x-1/2 z-0"></div>
              
              <div className="space-y-8 relative z-10">
                {statusSteps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const isUpcoming = index > currentStepIndex;

                  return (
                    <div key={step.key} className="flex items-start space-x-4">
                      {/* Step Indicator */}
                      <div className={`relative flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-lg ${
                        isCompleted
                          ? 'bg-gradient-to-br from-green-500 to-green-600 border-green-600 text-white scale-110'
                          : isCurrent
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-600 text-white scale-110 animate-pulse shadow-xl shadow-blue-500/50'
                          : 'bg-white border-gray-300 text-gray-400'
                      }`}>
                        {isCompleted ? (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-xl">{step.icon}</span>
                        )}
                        
                        {/* Step Number */}
                        <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs work-sans-bold flex items-center justify-center ${
                          isCompleted || isCurrent 
                            ? 'bg-white text-blue-600' 
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                      </div>

                      {/* Step Content */}
                      <div className="flex-1 min-w-0 pt-1">
                        <div className={`transition-all duration-500 ${
                          isCompleted || isCurrent ? 'opacity-100' : 'opacity-60'
                        }`}>
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className={`work-sans-bold text-lg ${
                              isCompleted ? 'text-green-700' : 
                              isCurrent ? 'text-blue-700' : 
                              'text-gray-500'
                            }`}>
                              {step.label}
                            </h4>
                            {isCurrent && (
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs work-sans-semibold animate-pulse">
                                Current
                              </span>
                            )}
                          </div>
                          
                          <p className={`text-sm work-sans-medium mb-2 ${
                            isCompleted ? 'text-green-600' : 
                            isCurrent ? 'text-blue-600' : 
                            'text-gray-400'
                          }`}>
                            {step.description}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-xs work-sans-medium">
                            <span className={`px-2 py-1 rounded-lg ${
                              isCompleted ? 'bg-green-100 text-green-700' :
                              isCurrent ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-500'
                            }`}>
                              ⏱️ {step.estimatedTime}
                            </span>
                            
                            {isCurrent && currentOrder.status === 'out-for-delivery' && driverLocation && (
                              <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-lg">
                                📍 {driverLocation.distance || 'Nearby'}
                              </span>
                            )}
                          </div>

                          {/* Current Status Additional Info */}
                          {isCurrent && (
                            <div className={`mt-3 p-3 rounded-xl border ${
                              currentOrder.status === 'out-for-delivery' 
                                ? 'bg-blue-50 border-blue-200' 
                                : currentOrder.status === 'pending'
                                ? 'bg-gray-50 border-gray-200'
                                : 'bg-orange-50 border-orange-200'
                            }`}>
                              <p className={`text-sm work-sans-medium ${
                                currentOrder.status === 'out-for-delivery' 
                                  ? 'text-blue-700' 
                                  : currentOrder.status === 'pending'
                                  ? 'text-gray-700'
                                  : 'text-orange-700'
                              }`}>
                                {currentOrder.status === 'pending' 
                                  ? `📝 Your order has been placed successfully. Waiting for restaurant confirmation.`
                                  : currentOrder.status === 'out-for-delivery' 
                                  ? `🚚 Your order is on the way! Expected to arrive in ${estimatedDelivery}.`
                                  : currentOrder.status === 'preparing'
                                  ? `👨‍🍳 Your ${currentOrder.type === 'grocery' ? 'items are being packed' : 'food is being prepared'} with care.`
                                  : `✅ ${step.description}`
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Enhanced Order Details */}
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/60 p-6 mb-6">
            <h3 className="work-sans-bold text-gray-900 text-xl mb-6">Order Information</h3>
            
            <div className="grid gap-4">
              {/* Order Items */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="work-sans-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <span>📋</span>
                  <span>Order Items ({currentOrder.items?.length || 0})</span>
                </h4>
                <div className="space-y-2">
                  {currentOrder.items?.map((item, index) => (
                    <div key={item.id || index} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="bg-orange-100 text-orange-600 p-2 rounded-lg flex-shrink-0">
                          <span className="text-sm work-sans-semibold">×{item.quantity}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="work-sans-semibold text-gray-900 text-sm truncate">{item.name}</p>
                          {item.category && (
                            <p className="text-gray-500 text-xs mt-1 work-sans-medium">
                              {item.category}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="work-sans-bold text-gray-900 text-sm">
                          ₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Information */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="work-sans-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <span>📍</span>
                  <span>Delivery Details</span>
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 work-sans-medium">Delivery Address</span>
                    <span className="work-sans-semibold text-gray-900 text-sm text-right max-w-[200px]">
                      {formatAddress(currentOrder.deliveryAddress)}
                    </span>
                  </div>
                  
                  {currentOrder.deliveryZone && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 work-sans-medium">Delivery Zone</span>
                      <span className="work-sans-semibold bg-gray-100 px-3 py-1 rounded-lg text-sm">{currentOrder.deliveryZone}</span>
                    </div>
                  )}
                  
                  {currentOrder.deliveryAddress?.phone && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 work-sans-medium">Contact Phone</span>
                      <span className="work-sans-semibold text-gray-900">{currentOrder.deliveryAddress.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200">
                <h4 className="work-sans-semibold text-purple-900 mb-3 flex items-center space-x-2">
                  <span>💳</span>
                  <span>Payment Summary</span>
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between py-1 work-sans-medium">
                    <span className="text-purple-700">Items Total</span>
                    <span className="work-sans-semibold">₹{currentOrder.pricing?.itemsTotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between py-1 work-sans-medium">
                    <span className="text-purple-700">Delivery Fee</span>
                    <span className="work-sans-semibold">₹{currentOrder.pricing?.deliveryFee?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between py-1 work-sans-medium">
                    <span className="text-purple-700">Tax ({currentOrder.pricing?.taxPercentage || 5}%)</span>
                    <span className="work-sans-semibold">₹{currentOrder.pricing?.taxAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between work-sans-bold text-purple-900 border-t border-purple-300 pt-2 mt-2 text-lg">
                    <span>Total Amount</span>
                    <span className="text-orange-600">₹{currentOrder.pricing?.grandTotal?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Support Section */}
          {/* <div className="text-center">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/60 p-6">
              <h3 className="work-sans-semibold text-gray-900 mb-3">Need Help?</h3>
              <p className="text-gray-600 text-sm work-sans-medium mb-4">
                Our support team is here to help you with any questions about your order.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors work-sans-semibold text-sm flex items-center justify-center space-x-2">
                  <span>📞</span>
                  <span>Call Support</span>
                </button>
                <button className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors work-sans-semibold text-sm flex items-center justify-center space-x-2">
                  <span>💬</span>
                  <span>Live Chat</span>
                </button>
              </div>
            </div>
          </div> */}

          {/* Last Updated Footer */}
          {lastUpdated && (
            <div className="text-center mt-6">
              <p className="text-gray-500 text-xs work-sans-medium bg-white/80 backdrop-blur-lg inline-block px-4 py-2 rounded-full border border-gray-200/60">
                🔄 Live tracking updated {formatTime(lastUpdated)}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OrderTracking;