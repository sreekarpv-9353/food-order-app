// src/pages/MyOrders.js
import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchUserOrders, refreshUserOrders } from '../redux/slices/orderSlice';
import { Helmet } from 'react-helmet';

const MyOrders = () => {
  const { orders, loading, error, lastRefreshed } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showStatusFilters, setShowStatusFilters] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const loadOrders = useCallback(async () => {
    if (!user) return;
    
    try {
      await dispatch(fetchUserOrders(user.uid)).unwrap();
    } catch (error) {
      console.error('❌ [loadOrders] Error loading orders:', error);
    }
  }, [user, dispatch]);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user, loadOrders]);

  const handleRefresh = async () => {
    if (!user) return;
    
    setRefreshing(true);
    try {
      await dispatch(refreshUserOrders(user.uid)).unwrap();
    } catch (error) {
      console.error('❌ [handleRefresh] Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const statusMatch = filter === 'all' || 
      (filter === 'pending' ? (order.status === 'pending' || order.status === 'New') : order.status === filter);
    
    let typeMatch = true;
    if (orderTypeFilter === 'food') {
      typeMatch = order.orderType === 'food' || order.type === 'food' || (!order.orderType && !order.type);
    } else if (orderTypeFilter === 'grocery') {
      typeMatch = order.orderType === 'grocery' || order.type === 'grocery';
    }
    
    return statusMatch && typeMatch;
  });

  // Count orders by type
  const foodOrdersCount = orders.filter(o => 
    o.orderType === 'food' || o.type === 'food' || (!o.orderType && !o.type)
  ).length;
  
  const groceryOrdersCount = orders.filter(o => 
    o.orderType === 'grocery' || o.type === 'grocery'
  ).length;

  const getStatusColor = (status) => {
    const normalizedStatus = status === 'New' ? 'pending' : status;
    
    switch (normalizedStatus) {
      case 'completed': 
      case 'delivered': 
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'pending': 
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'cancelled': 
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'preparing':
      case 'ready':
      case 'out-for-delivery':
      case 'in-progress': 
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      default: 
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    const normalizedStatus = status === 'New' ? 'pending' : status;
    
    switch (normalizedStatus) {
      case 'delivered': return '✅';
      case 'pending': return '⏳';
      case 'cancelled': return '❌';
      case 'preparing': return '👨‍🍳';
      case 'ready': return '📦';
      case 'out-for-delivery': return '🚚';
      default: return '📋';
    }
  };

  const getOrderTypeIcon = (order) => {
    const orderType = order.orderType || order.type;
    return orderType === 'grocery' ? '🛒' : '🍽️';
  };

  const getOrderTypeBadge = (order) => {
    const orderType = order.orderType || order.type || 'food';
    return orderType === 'grocery' 
      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
      : 'bg-orange-50 text-orange-700 border border-orange-200';
  };

  const getOrderTypeLabel = (order) => {
    const orderType = order.orderType || order.type || 'food';
    return orderType === 'grocery' ? 'Grocery' : 'Food';
  };

  // Enhanced payment method display - Always show COD
  const getPaymentMethodDisplay = (order) => {
    // Always default to COD if no payment method is specified
    const paymentMethod = order.paymentMethod || 'COD';
    
    return {
      method: paymentMethod,
      displayText: 'Cash on Delivery',
      badgeClass: 'bg-purple-50 text-purple-700 border border-purple-200',
      icon: '💰'
    };
  };

  const formatAddress = (address) => {
    if (!address) return 'No address provided';
    
    if (typeof address === 'string') {
      return address.length > 30 ? `${address.substring(0, 30)}...` : address;
    }
    
    if (typeof address === 'object') {
      const parts = [
        address.street,
        address.city,
        address.state,
        address.zipCode
      ].filter(part => part && part.trim() !== '');
      
      const fullAddress = parts.join(', ');
      return fullAddress.length > 30 ? `${fullAddress.substring(0, 30)}...` : fullAddress;
    }
    
    return 'Address not available';
  };

  const getStatusDisplayText = (status) => {
    const normalizedStatus = status === 'New' ? 'pending' : status;
    
    const statusMap = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'preparing': 'Preparing',
      'ready': 'Ready',
      'out-for-delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
      'in-progress': 'In Progress',
      'New': 'New'
    };
    
    return statusMap[normalizedStatus] || status?.charAt(0)?.toUpperCase() + status?.slice(1) || 'Unknown';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const getProgressPercentage = (status) => {
    const statusProgress = {
      'pending': 20,
      'confirmed': 40,
      'preparing': 60,
      'ready': 80,
      'out-for-delivery': 90,
      'delivered': 100,
      'cancelled': 0
    };
    return statusProgress[status] || 20;
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
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 safe-area-bottom work-sans">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/60 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl work-sans-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    My Orders
                  </h1>
                  <p className="text-sm text-gray-500 mt-0.5 work-sans-medium">
                    {filteredOrders.length} of {orders.length} orders
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="bg-white border border-gray-200 p-3 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 work-sans-medium"
              >
                {refreshing ? (
                  <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-4 pb-32">
          {/* Order Type Tabs - Enhanced with better mobile UX */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-1.5 mb-4 shadow-lg border border-gray-200/50">
            <div className="flex">
              {[
                { key: 'all', label: 'All', count: orders.length, emoji: '📦' },
                { key: 'food', label: 'Food', count: foodOrdersCount, emoji: '🍽️' },
                { key: 'grocery', label: 'Grocery', count: groceryOrdersCount, emoji: '🛒' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  className={`flex-1 py-3 px-2 rounded-xl transition-all duration-300 flex flex-col items-center space-y-1 text-sm work-sans-semibold ${
                    orderTypeFilter === tab.key
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                      : 'text-gray-600 hover:bg-gray-50/80'
                  }`}
                  onClick={() => setOrderTypeFilter(tab.key)}
                >
                  <span className="text-base">{tab.emoji}</span>
                  <span>{tab.label}</span>
                  <span className={`px-2 py-1 rounded-full text-xs work-sans-medium ${
                    orderTypeFilter === tab.key 
                      ? 'bg-white/20 text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter - Improved Mobile Design */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 mb-4 shadow-lg border border-gray-200/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <h3 className="work-sans-semibold text-gray-900 text-sm">Filter by Status</h3>
              </div>
              <button
                onClick={() => setShowStatusFilters(!showStatusFilters)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1.5 rounded-lg text-xs work-sans-semibold transition-all duration-200 hover:shadow-lg active:scale-95"
              >
                {showStatusFilters ? 'Hide' : 'Show'}
              </button>
            </div>
            
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
              showStatusFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { key: 'all', label: 'All', icon: '📋' },
                  { key: 'pending', label: 'Pending', icon: '⏳' },
                  { key: 'confirmed', label: 'Confirmed', icon: '✅' },
                  { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
                  { key: 'ready', label: 'Ready', icon: '📦' },
                  { key: 'out-for-delivery', label: 'Out for Delivery', icon: '🚚' },
                  { key: 'delivered', label: 'Delivered', icon: '🎉' },
                  { key: 'cancelled', label: 'Cancelled', icon: '❌' }
                ].map((status) => (
                  <button
                    key={status.key}
                    className={`p-3 rounded-xl transition-all duration-300 flex flex-col items-center space-y-2 text-xs border-2 work-sans-medium ${
                      filter === status.key
                        ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300 text-orange-700 shadow-md'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-orange-200 hover:bg-orange-50/50'
                    }`}
                    onClick={() => {
                      setFilter(status.key);
                      setShowStatusFilters(false);
                    }}
                  >
                    <span className="text-lg">{status.icon}</span>
                    <span>{status.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Loading State - Enhanced */}
          {(loading && orders.length === 0) && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full animate-pulse"></div>
                </div>
              </div>
              <p className="text-gray-600 text-sm work-sans-medium mt-4">Loading your orders...</p>
              <p className="text-gray-400 text-xs mt-1 work-sans-medium">Getting everything ready for you</p>
            </div>
          )}

          {/* Error State - Enhanced */}
          {error && (
            <div className="bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200 rounded-2xl p-4 mb-4 shadow-lg">
              <div className="flex items-start space-x-3">
                <div className="bg-red-100 p-2 rounded-lg flex-shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-red-800 work-sans-semibold text-sm">Failed to load orders</p>
                  <p className="text-red-600 text-xs mt-1 work-sans-medium">{error}</p>
                  <button
                    onClick={handleRefresh}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs work-sans-semibold mt-3 transition-all duration-200 hover:bg-red-700 active:scale-95"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Orders List - Enhanced with better mobile cards */}
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const paymentInfo = getPaymentMethodDisplay(order);
              const canTrackOrder = order.status !== 'delivered' && order.status !== 'cancelled';
              
              return (
                <div
                  key={order.id}
                  className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden transition-all duration-300 hover:shadow-xl"
                >
                  {/* Order Header - Enhanced */}
                  <div className="p-4 border-b border-gray-200/60">
                    {/* Top Row: Order Info and Track Button */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-xl ${
                          (order.orderType || order.type) === 'grocery' 
                            ? 'bg-emerald-100 text-emerald-600' 
                            : 'bg-orange-100 text-orange-600'
                        }`}>
                          <span className="text-lg">{getOrderTypeIcon(order)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="work-sans-bold text-gray-900 text-sm truncate">
                              Order #{order.id?.slice(-8) || 'N/A'}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs work-sans-semibold ${getOrderTypeBadge(order)}`}>
                              {getOrderTypeLabel(order)}
                            </span>
                          </div>
                          <p className="text-gray-500 text-xs flex items-center space-x-1 work-sans-medium">
                            <span>🕒</span>
                            <span>{formatDate(order.createdAt)}</span>
                          </p>
                        </div>
                      </div>
                      
                      {/* Track Button - Positioned correctly */}
                      {canTrackOrder && (
                        <button
                          onClick={() => navigate(`/order-tracking/${order.id}`)}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl text-xs work-sans-semibold hover:shadow-lg transition-all duration-200 active:scale-95 flex items-center space-x-2 ml-3 flex-shrink-0"
                        >
                          <span>🚚</span>
                          <span>Track</span>
                        </button>
                      )}
                    </div>

                    {/* Restaurant Info for Food Orders */}
                    {order.restaurant && (
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="bg-blue-50 px-2 py-1 rounded-lg flex items-center space-x-1">
                          <span className="text-blue-600 text-xs">🏪</span>
                          <span className="text-blue-700 text-xs work-sans-medium truncate max-w-[120px]">
                            {order.restaurant.name}
                          </span>
                        </div>
                        {order.restaurant.rating && (
                          <div className="bg-amber-50 px-2 py-1 rounded-lg flex items-center space-x-1">
                            <span className="text-amber-600 text-xs">⭐</span>
                            <span className="text-amber-700 text-xs work-sans-medium">
                              {order.restaurant.rating}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Status with Progress */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{getStatusIcon(order.status)}</span>
                        <span className={`px-3 py-1.5 rounded-full text-xs work-sans-semibold ${getStatusColor(order.status)}`}>
                          {getStatusDisplayText(order.status)}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="work-sans-bold text-gray-900 text-lg">
                          ₹{order.pricing?.grandTotal?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>

                    {/* Payment Method Badge - Always Visible */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{paymentInfo.icon}</span>
                        <span className={`px-3 py-1.5 rounded-full text-xs work-sans-semibold ${paymentInfo.badgeClass}`}>
                          {paymentInfo.displayText}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-500 text-xs work-sans-medium">
                          {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {order.status !== 'cancelled' && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-1000 ease-out"
                          style={{ 
                            width: `${getProgressPercentage(order.status)}%` 
                          }}
                        ></div>
                      </div>
                    )}

                    {/* Quick Summary */}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200/60">
                      <div className="text-xs text-gray-600 flex items-center space-x-2 work-sans-medium">
                        {order.deliveryTime && (
                          <span className="work-sans-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-lg">
                            🚚 {order.deliveryTime} min
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-gray-500 text-xs work-sans-medium">
                          {order.deliveryZone || 'Standard Delivery'}
                        </p>
                      </div>
                    </div>
                  </div>
                   
                  {/* Expandable Section */}
                  <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    expandedOrder === order.id ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    {/* Order Items */}
                    <div className="p-4 border-b border-gray-200/60 bg-gray-50/50">
                      <h4 className="work-sans-semibold text-gray-900 text-sm mb-3 flex items-center space-x-2">
                        <span>📋</span>
                        <span>Order Items</span>
                      </h4>
                      <div className="space-y-3">
                        {order.items?.map((item, index) => (
                          <div key={item.id || index} className="flex justify-between items-start bg-white p-3 rounded-xl border border-gray-200/60">
                            <div className="flex items-start space-x-3 flex-1 min-w-0">
                              <div className="bg-orange-100 text-orange-600 p-2 rounded-lg flex-shrink-0">
                                <span className="text-sm work-sans-semibold">×{item.quantity}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="work-sans-semibold text-gray-900 text-sm truncate">{item.name}</p>
                                {item.category && (
                                  <p className="text-gray-500 text-xs mt-1 bg-gray-100 px-2 py-1 rounded-md inline-block work-sans-medium">
                                    {item.category}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              <p className="work-sans-bold text-gray-900 text-sm">
                                ₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                              </p>
                              <p className="text-gray-500 text-xs work-sans-medium">
                                ₹{item.price} each
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Detailed Pricing Breakdown */}
                    <div className="p-4 border-b border-gray-200/60">
                      <h4 className="work-sans-semibold text-gray-900 text-sm mb-3 flex items-center space-x-2">
                        <span>💰</span>
                        <span>Price Breakdown</span>
                      </h4>
                      <div className="space-y-2 text-sm bg-white p-4 rounded-xl border border-gray-200/60">
                        <div className="flex justify-between py-1 work-sans-medium">
                          <span className="text-gray-600">Items Total</span>
                          <span className="work-sans-semibold">₹{order.pricing?.itemsTotal?.toFixed(2) || order.subtotal?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between py-1 work-sans-medium">
                          <span className="text-gray-600">Delivery Fee</span>
                          <span className="work-sans-semibold">₹{order.pricing?.deliveryFee?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between py-1 work-sans-medium">
                          <span className="text-gray-600">Tax ({order.pricing?.taxPercentage || 5}%)</span>
                          <span className="work-sans-semibold">₹{order.pricing?.taxAmount?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between work-sans-bold text-gray-900 border-t border-gray-300 pt-2 mt-2 text-base">
                          <span>Total Amount</span>
                          <span className="text-orange-600">₹{order.pricing?.grandTotal?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Information */}
                    <div className="p-4 border-b border-gray-200/60">
                      <h4 className="work-sans-semibold text-gray-900 text-sm mb-3 flex items-center space-x-2">
                        <span>📍</span>
                        <span>Delivery Info</span>
                      </h4>
                      <div className="space-y-3 text-sm bg-white p-4 rounded-xl border border-gray-200/60">
                        <div className="flex items-start space-x-3">
                          <div className="bg-blue-100 text-blue-600 p-2 rounded-lg flex-shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-800 work-sans-medium">
                              {order.deliveryAddress?.name || 'Customer'}
                            </p>
                            <p className="text-gray-600 text-sm mt-1 work-sans-medium">
                              {formatAddress(order.deliveryAddress)}
                            </p>
                            {order.deliveryAddress?.phone && (
                              <p className="text-gray-500 text-xs mt-2 flex items-center space-x-1 work-sans-medium">
                                <span>📞</span>
                                <span>{order.deliveryAddress.phone}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        {order.deliveryZone && (
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-600 work-sans-medium">Delivery Zone</span>
                            <span className="work-sans-semibold bg-gray-100 px-3 py-1 rounded-lg text-sm">{order.deliveryZone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment Information Section */}
                    <div className="p-4 pb-6">
                      <h4 className="work-sans-semibold text-gray-900 text-sm mb-3 flex items-center space-x-2">
                        <span>💳</span>
                        <span>Payment Information</span>
                      </h4>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 rounded-xl border border-purple-200/60">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-purple-100 text-purple-600 p-2 rounded-lg">
                              <span className="text-lg">💰</span>
                            </div>
                            <div>
                              <p className="work-sans-semibold text-purple-900 text-sm">Payment Method</p>
                              <p className="text-purple-700 text-xs mt-0.5 work-sans-medium">{paymentInfo.displayText}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-purple-900 work-sans-semibold text-sm">Amount Due</p>
                            <p className="text-purple-700 text-lg work-sans-bold">
                              ₹{order.pricing?.grandTotal?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-purple-200/60">
                          <p className="text-purple-600 text-xs work-sans-medium">
                            💡 Pay with cash when your order is delivered
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expand/Collapse Button */}
                  <div className="sticky bottom-0 bg-white border-t border-gray-200/60">
                    <button
                      onClick={() => toggleOrderExpand(order.id)}
                      className="w-full p-4 flex items-center justify-center text-sm work-sans-semibold text-orange-600 hover:bg-orange-50/50 transition-all duration-200 active:bg-orange-100"
                    >
                      {expandedOrder === order.id ? (
                        <>
                          <span>Show Less</span>
                          <svg className="w-4 h-4 ml-2 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </>
                      ) : (
                        <>
                          <span>View Details</span>
                          <svg className="w-4 h-4 ml-2 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State - Enhanced */}
          {filteredOrders.length === 0 && !loading && (
            <div className="text-center py-16 px-4">
              <div className="bg-gradient-to-br from-orange-100 to-orange-200 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-4xl">
                  {orderTypeFilter === 'grocery' ? '🛒' : orderTypeFilter === 'food' ? '🍽️' : '📦'}
                </span>
              </div>
              <h3 className="text-xl work-sans-bold text-gray-900 mb-3">No orders found</h3>
              <p className="text-gray-600 text-sm mb-8 max-w-sm mx-auto leading-relaxed work-sans-medium">
                {filter === 'all' && orderTypeFilter === 'all'
                  ? "You haven't placed any orders yet. Start your culinary journey and your orders will appear here!"
                  : `No ${orderTypeFilter !== 'all' ? orderTypeFilter + ' ' : ''}orders found${filter !== 'all' ? ` with status "${filter}"` : ''}.`
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleRefresh}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3.5 rounded-xl hover:shadow-lg transition-all duration-200 work-sans-semibold text-sm active:scale-95"
                >
                  Check for New Orders
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="bg-white border border-gray-300 text-gray-700 px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-all duration-200 work-sans-semibold text-sm active:scale-95"
                >
                  Start Shopping
                </button>
              </div>
            </div>
          )}

          {/* Last Refreshed Info */}
          {lastRefreshed && filteredOrders.length > 0 && (
            <div className="text-center pt-8 pb-6">
              <p className="text-xs text-gray-500 bg-white/80 backdrop-blur-lg inline-block px-4 py-2 rounded-full border border-gray-200/60 work-sans-medium">
                🔄 Updated {new Date(lastRefreshed).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MyOrders;