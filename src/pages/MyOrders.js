// src/pages/MyOrders.js
import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserOrders, refreshUserOrders } from '../redux/slices/orderSlice';
import { motion, AnimatePresence } from 'framer-motion';

const MyOrders = () => {
  const { orders, loading, error, lastRefreshed } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [filter, setFilter] = useState('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showStatusFilters, setShowStatusFilters] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!user) {
      console.log('❌ [loadOrders] No user found');
      return;
    }
    
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

  // Status counts for filter badges
  const getStatusCount = (status) => {
    return orders.filter(order => {
      const statusMatch = status === 'all' ? true : 
        status === 'pending' ? (order.status === 'pending' || order.status === 'New') : 
        order.status === status;
      
      let typeMatch = true;
      if (orderTypeFilter === 'food') {
        typeMatch = order.orderType === 'food' || order.type === 'food' || (!order.orderType && !order.type);
      } else if (orderTypeFilter === 'grocery') {
        typeMatch = order.orderType === 'grocery' || order.type === 'grocery';
      }
      
      return statusMatch && typeMatch;
    }).length;
  };

  const getStatusColor = (status) => {
    const normalizedStatus = status === 'New' ? 'pending' : status;
    
    switch (normalizedStatus) {
      case 'completed': 
      case 'delivered': 
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': 
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': 
        return 'bg-red-100 text-red-800 border-red-200';
      case 'preparing':
      case 'ready':
      case 'out-for-delivery':
      case 'in-progress': 
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default: 
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOrderTypeIcon = (order) => {
    const orderType = order.orderType || order.type;
    return orderType === 'grocery' ? '🛒' : '🍽️';
  };

  const getOrderTypeBadge = (order) => {
    const orderType = order.orderType || order.type || 'food';
    return orderType === 'grocery' 
      ? 'bg-green-100 text-green-800 border border-green-200' 
      : 'bg-orange-100 text-orange-800 border border-orange-200';
  };

  const getOrderTypeLabel = (order) => {
    const orderType = order.orderType || order.type || 'food';
    return orderType === 'grocery' ? 'Grocery' : 'Food';
  };

  const formatAddress = (address) => {
    if (!address) return 'No address provided';
    
    if (typeof address === 'string') {
      return address.length > 35 ? `${address.substring(0, 35)}...` : address;
    }
    
    if (typeof address === 'object') {
      const parts = [
        address.street,
        address.city,
        address.state,
        address.zipCode
      ].filter(part => part && part.trim() !== '');
      
      const fullAddress = parts.join(', ');
      return fullAddress.length > 35 ? `${fullAddress.substring(0, 35)}...` : fullAddress;
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white sticky top-0 z-40 border-b border-gray-200 px-4 py-4"
      >
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            <p className="text-sm text-gray-600 mt-1">
              {filteredOrders.length} of {orders.length} orders
            </p>
          </div>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="bg-orange-500 text-white p-3 rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {refreshing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </motion.button>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Order Type Tabs - Horizontal Scroll for Mobile */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex overflow-x-auto scrollbar-hide bg-white rounded-2xl p-1 mb-4 shadow-sm border border-gray-100"
        >
          {[
            { key: 'all', label: 'All Orders', count: orders.length, emoji: '📦' },
            { key: 'food', label: 'Food', count: foodOrdersCount, emoji: '🍽️' },
            { key: 'grocery', label: 'Grocery', count: groceryOrdersCount, emoji: '🛒' }
          ].map((tab) => (
            <motion.button
              key={tab.key}
              whileTap={{ scale: 0.95 }}
              className={`flex-shrink-0 px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 mx-1 ${
                orderTypeFilter === tab.key
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setOrderTypeFilter(tab.key)}
            >
              <span className="text-base">{tab.emoji}</span>
              <span className="whitespace-nowrap text-sm">{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                orderTypeFilter === tab.key 
                  ? 'bg-white text-orange-500' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </motion.button>
          ))}
        </motion.div>

        {/* Status Filter - Collapsible for Mobile */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Filter by Status</h3>
            <button
              onClick={() => setShowStatusFilters(!showStatusFilters)}
              className="text-orange-500 text-sm font-medium"
            >
              {showStatusFilters ? 'Hide' : 'Show'}
            </button>
          </div>
          
          <AnimatePresence>
            {showStatusFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'all', label: 'All Status' },
                    { key: 'pending', label: 'Pending' },
                    { key: 'confirmed', label: 'Confirmed' },
                    { key: 'preparing', label: 'Preparing' },
                    { key: 'ready', label: 'Ready' },
                    { key: 'out-for-delivery', label: 'Out for Delivery' },
                    { key: 'delivered', label: 'Delivered' },
                    { key: 'cancelled', label: 'Cancelled' }
                  ].map((status) => (
                    <motion.button
                      key={status.key}
                      whileTap={{ scale: 0.95 }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                        filter === status.key
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => setFilter(status.key)}
                    >
                      <span className="block truncate">{status.label}</span>
                      <span className={`text-xs mt-1 ${
                        filter === status.key ? 'text-orange-100' : 'text-gray-500'
                      }`}>
                        {getStatusCount(status.key)}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Loading State */}
        {(loading && orders.length === 0) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
            <p className="text-gray-600">Loading your orders...</p>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4"
          >
            <div className="flex items-center">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-red-800 font-medium">Failed to load orders</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Orders List */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${filter}-${orderTypeFilter}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {filteredOrders.map((order) => (
              <motion.div
                key={order.id}
                variants={itemVariants}
                layout
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden"
              >
                {/* Order Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getOrderTypeIcon(order)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Order #{order.id?.slice(-8) || 'N/A'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Date not available'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {getStatusDisplayText(order.status)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderTypeBadge(order)}`}>
                        {getOrderTypeLabel(order)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-4 border-b border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">Items</h4>
                  <div className="space-y-2">
                    {order.items?.slice(0, 3).map((item, index) => (
                      <div key={item.id || index} className="flex justify-between items-center text-sm">
                        <div className="flex-1 flex items-center space-x-3">
                          <span className="text-gray-400">•</span>
                          <span className="font-medium text-gray-800 truncate">{item.name}</span>
                          <span className="text-gray-500 text-xs">×{item.quantity}</span>
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">
                          ₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <div className="text-center pt-2">
                        <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                          +{order.items.length - 3} more items
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="p-4">
                  <div className="flex flex-col space-y-3">
                    {/* Delivery Info */}
                    <div className="flex items-start space-x-3">
                      <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-600 truncate">
                          {formatAddress(order.deliveryAddress)}
                        </p>
                        {order.deliveryAddress?.phone && (
                          <p className="text-xs text-gray-500 mt-1">
                            📞 {order.deliveryAddress.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Payment & Total */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="text-sm text-gray-600">
                        Payment: <span className="font-medium">{order.paymentMethod || 'COD'}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-900">
                          ₹{order.totalAmount?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Empty State */}
        {filteredOrders.length === 0 && !loading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4 opacity-20">
              {orderTypeFilter === 'grocery' ? '🛒' : orderTypeFilter === 'food' ? '🍽️' : '📦'}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              {filter === 'all' && orderTypeFilter === 'all'
                ? "You haven't placed any orders yet. Start shopping to see your orders here!"
                : `No ${orderTypeFilter !== 'all' ? orderTypeFilter + ' ' : ''}orders found${filter !== 'all' ? ` with status "${filter}"` : ''}.`
              }
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="bg-orange-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-orange-600 transition-colors shadow-sm"
            >
              Check for New Orders
            </motion.button>
          </motion.div>
        )}

        {/* Last Refreshed Info */}
        {lastRefreshed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center pt-8 pb-4"
          >
            <p className="text-xs text-gray-500">
              Last updated: {new Date(lastRefreshed).toLocaleTimeString()}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;