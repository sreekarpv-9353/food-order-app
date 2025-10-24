// src/pages/MyOrders.js
import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserOrders, refreshUserOrders } from '../redux/slices/orderSlice';

const MyOrders = () => {
  const { orders, loading, error, lastRefreshed } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [filter, setFilter] = useState('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!user) {
      console.log('❌ [loadOrders] No user found');
      return;
    }
    
    console.log('🚀 [loadOrders] Loading orders for user:', user.uid);
    
    try {
      await dispatch(fetchUserOrders(user.uid)).unwrap();
      console.log('✅ [loadOrders] Orders loaded successfully');
    } catch (error) {
      console.error('❌ [loadOrders] Error loading orders:', error);
    }
  }, [user, dispatch]);

  useEffect(() => {
    if (user) {
      console.log('🎯 [useEffect] User detected, loading orders...');
      loadOrders();
    }
  }, [user, loadOrders]);

  const handleRefresh = async () => {
    if (!user) {
      console.log('❌ [handleRefresh] No user found');
      return;
    }
    
    setRefreshing(true);
    console.log('🔄 [handleRefresh] Force refreshing orders from Firebase...');
    
    try {
      await dispatch(refreshUserOrders(user.uid)).unwrap();
      console.log('✅ [handleRefresh] Orders force refreshed successfully');
    } catch (error) {
      console.error('❌ [handleRefresh] Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Filter by both status and order type
  const filteredOrders = orders.filter(order => {
    const statusMatch = filter === 'all' || order.status === filter;
    
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

  const debugOrders = () => {
    console.log('🐛 [debugOrders] Full orders data:', orders);
    console.log('🐛 [debugOrders] User ID:', user?.uid);
    console.log('🐛 [debugOrders] Last refreshed:', lastRefreshed);
  };

  const getStatusColor = (status) => {
    const normalizedStatus = status === 'New' ? 'pending' : status;
    
    switch (normalizedStatus) {
      case 'completed': 
      case 'delivered': 
        return 'bg-green-100 text-green-800';
      case 'pending': 
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': 
        return 'bg-red-100 text-red-800';
      case 'preparing':
      case 'ready':
      case 'out-for-delivery':
      case 'in-progress': 
        return 'bg-blue-100 text-blue-800';
      default: 
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderTypeIcon = (order) => {
    const orderType = order.orderType || order.type;
    return orderType === 'grocery' ? '🛒' : '🍽️';
  };

  const getOrderTypeBadge = (order) => {
    const orderType = order.orderType || order.type || 'food';
    return orderType === 'grocery' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-orange-100 text-orange-800';
  };

  const getOrderTypeLabel = (order) => {
    const orderType = order.orderType || order.type || 'food';
    return orderType === 'grocery' ? 'Grocery' : 'Food';
  };

  const formatAddress = (address) => {
    if (!address) return 'No address provided';
    
    if (typeof address === 'string') {
      // Truncate long addresses for mobile
      return address.length > 40 ? address.substring(0, 40) + '...' : address;
    }
    
    if (typeof address === 'object') {
      const parts = [
        address.street,
        address.city,
        address.state,
        address.zipCode
      ].filter(part => part && part.trim() !== '');
      
      const fullAddress = parts.join(', ');
      return fullAddress.length > 40 ? fullAddress.substring(0, 40) + '...' : fullAddress;
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

  return (
    <div className="container mx-auto px-3 py-4 max-w-full">
      {/* Debug Header - Hidden by default, show on tap */}
      {/* <details className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <summary className="cursor-pointer font-semibold text-blue-800 text-sm">
          Orders Information
        </summary>
        <div className="mt-2 text-xs text-blue-600 space-y-1">
          <p>Showing {filteredOrders.length} of {orders.length} orders</p>
          {lastRefreshed && <p>Last refreshed: {new Date(lastRefreshed).toLocaleTimeString()}</p>}
          <p>Food: {foodOrdersCount} | Grocery: {groceryOrdersCount}</p>
          {error && <p className="text-red-600">Error: {error}</p>}
          <button
            onClick={debugOrders}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 mt-1"
          >
            Debug Console
          </button>
        </div>
      </details> */}

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">My Orders</h2>
        <div className="flex items-center space-x-2">
          {/* Filters Toggle Button for Mobile */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-gray-200 p-2 rounded-lg md:hidden"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="bg-orange-500 text-white px-3 py-2 rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
          >
            {refreshing ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Refreshing</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">Refresh</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Order Type Filter Tabs - Mobile Optimized */}
      <div className="flex overflow-x-auto scrollbar-hide mb-4 pb-1 -mx-3 px-3">
        <div className="flex space-x-1 min-w-max">
          <button
            className={`py-2 px-4 font-medium border-b-2 transition-colors whitespace-nowrap text-sm ${
              orderTypeFilter === 'all'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setOrderTypeFilter('all')}
          >
            All
            <span className="ml-1 bg-gray-100 px-1.5 py-0.5 rounded-full text-xs">
              {orders.length}
            </span>
          </button>
          <button
            className={`py-2 px-4 font-medium border-b-2 transition-colors flex items-center whitespace-nowrap text-sm ${
              orderTypeFilter === 'food'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setOrderTypeFilter('food')}
          >
            <span className="mr-1">🍽️</span>
            Food
            <span className="ml-1 bg-orange-100 px-1.5 py-0.5 rounded-full text-xs">
              {foodOrdersCount}
            </span>
          </button>
          <button
            className={`py-2 px-4 font-medium border-b-2 transition-colors flex items-center whitespace-nowrap text-sm ${
              orderTypeFilter === 'grocery'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setOrderTypeFilter('grocery')}
          >
            <span className="mr-1">🛒</span>
            Grocery
            <span className="ml-1 bg-green-100 px-1.5 py-0.5 rounded-full text-xs">
              {groceryOrdersCount}
            </span>
          </button>
        </div>
      </div>
      
      {/* Status Filters - Collapsible on Mobile */}
      <div className={`${showFilters ? 'block' : 'hidden'} md:block mb-4`}>
        <div className="flex flex-wrap gap-1">
          {['all', 'pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled'].map(status => (
            <button
              key={status}
              className={`px-3 py-1.5 rounded capitalize transition-colors text-xs ${
                filter === status 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
              onClick={() => {
                setFilter(status);
                setShowFilters(false);
              }}
            >
              {status.replace('-', ' ')}
              {status !== 'all' && (
                <span className="ml-1 bg-white bg-opacity-20 px-1 py-0.5 rounded-full text-xs">
                  {orders.filter(order => {
                    const statusMatch = status === 'pending' ? (order.status === 'pending' || order.status === 'New') : order.status === status;
                    
                    let typeMatch = true;
                    if (orderTypeFilter === 'food') {
                      typeMatch = order.orderType === 'food' || order.type === 'food' || (!order.orderType && !order.type);
                    } else if (orderTypeFilter === 'grocery') {
                      typeMatch = order.orderType === 'grocery' || order.type === 'grocery';
                    }
                    
                    return statusMatch && typeMatch;
                  }).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {(loading && orders.length === 0) && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600">Loading orders...</span>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.map(order => (
          <div 
            key={order.id} 
            className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow border-l-4"
            style={{
              borderLeftColor: (order.orderType || order.type) === 'grocery' ? '#10b981' : '#f97316'
            }}
          >
            {/* Order Header */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-1 flex-wrap gap-1">
                  <span className="text-xl mr-1">{getOrderTypeIcon(order)}</span>
                  <h3 className="text-base font-semibold truncate">
                    Order #{order.id?.slice(-6) || 'N/A'}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getOrderTypeBadge(order)}`}>
                    {getOrderTypeLabel(order)}
                  </span>
                </div>
                <p className="text-gray-600 text-xs">
                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Date not available'}
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${getStatusColor(order.status)}`}>
                {getStatusDisplayText(order.status)}
              </span>
            </div>
            
            {/* Order Items */}
            <div className="mb-3">
              <h4 className="font-semibold mb-2 text-gray-800 text-sm">Items:</h4>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {order.items?.slice(0, 3).map((item, index) => (
                  <div key={item.id || index} className="flex justify-between items-center text-xs">
                    <div className="flex-1 truncate">
                      <span className="font-medium truncate">{item.name}</span>
                      <span className="text-gray-600 ml-1">× {item.quantity}</span>
                    </div>
                    <span className="font-medium text-gray-800 ml-2 flex-shrink-0">
                      ₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                    </span>
                  </div>
                ))}
                {order.items?.length > 3 && (
                  <div className="text-xs text-gray-500 text-center pt-1">
                    +{order.items.length - 3} more items
                  </div>
                )}
              </div>
            </div>

            {/* Order Charges Breakdown */}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Subtotal:</span>
                <span>₹{order.subtotal?.toFixed(2) || order.totalAmount?.toFixed(2)}</span>
              </div>
              {order.deliveryFee > 0 && (
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Delivery:</span>
                  <span>₹{order.deliveryFee?.toFixed(2)}</span>
                </div>
              )}
              {order.taxAmount > 0 && (
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Tax ({order.taxPercentage || 5}%):</span>
                  <span>₹{order.taxAmount?.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="flex justify-between border-t pt-3 mt-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 mb-1 truncate">
                  <strong>To:</strong> {formatAddress(order.deliveryAddress)}
                </p>
                {order.deliveryAddress?.phone && (
                  <p className="text-xs text-gray-600 truncate">
                    <strong>Phone:</strong> {order.deliveryAddress.phone}
                  </p>
                )}
              </div>
              <div className="text-right ml-2 flex-shrink-0">
                <p className="font-semibold text-base text-gray-900">
                  ₹{order.totalAmount?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-gray-600">
                  {order.paymentMethod || 'COD'}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {filteredOrders.length === 0 && !loading && (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <div className="text-gray-400 text-4xl mb-3">
              {orderTypeFilter === 'grocery' ? '🛒' : orderTypeFilter === 'food' ? '🍽️' : '📦'}
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No orders found</h3>
            <p className="text-gray-600 text-sm mb-3 px-4">
              {filter === 'all' && orderTypeFilter === 'all'
                ? "You haven't placed any orders yet." 
                : `No ${orderTypeFilter !== 'all' ? orderTypeFilter + ' ' : ''}${filter !== 'all' ? filter + ' ' : ''}orders found.`
              }
            </p>
            <button
              onClick={handleRefresh}
              className="bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600"
            >
              Check for New Orders
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;