// src/pages/MyOrders.js
import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserOrders, refreshUserOrders } from '../redux/slices/orderSlice';

const MyOrders = () => {
  const { orders, loading, error, lastRefreshed } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [filter, setFilter] = useState('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all'); // New: food/grocery/all
  const [refreshing, setRefreshing] = useState(false);

  // Use useCallback to memoize the loadOrders function
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

  // Handle manual refresh with FORCE RELOAD from Firebase
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
    // Filter by status
    const statusMatch = filter === 'all' || order.status === filter;
    
    // Filter by order type (food/grocery)
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

  // Debug function to check order data
  const debugOrders = () => {
    console.log('🐛 [debugOrders] Full orders data:', orders);
    console.log('🐛 [debugOrders] User ID:', user?.uid);
    console.log('🐛 [debugOrders] Last refreshed:', lastRefreshed);
    
    // Check order types
    const typeCounts = { food: 0, grocery: 0, undefined: 0 };
    orders.forEach(order => {
      const orderType = order.orderType || order.type;
      if (orderType === 'food') typeCounts.food++;
      else if (orderType === 'grocery') typeCounts.grocery++;
      else typeCounts.undefined++;
    });
    console.log('🐛 [debugOrders] Order type counts:', typeCounts);
    
    // Check if there are any orders with different statuses
    const statusCounts = {};
    orders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    console.log('🐛 [debugOrders] Status counts:', statusCounts);
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
    return orderType === 'grocery' ? 'Grocery Order' : 'Food Order';
  };

  const formatAddress = (address) => {
    if (!address) return 'No address provided';
    
    if (typeof address === 'string') return address;
    
    if (typeof address === 'object') {
      const parts = [
        address.street,
        address.city,
        address.state,
        address.zipCode
      ].filter(part => part && part.trim() !== '');
      
      return parts.join(', ');
    }
    
    return 'Address not available';
  };

  const getStatusDisplayText = (status) => {
    const normalizedStatus = status === 'New' ? 'pending' : status;
    
    const statusMap = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'preparing': 'Preparing',
      'ready': 'Ready for Pickup',
      'out-for-delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
      'in-progress': 'In Progress',
      'New': 'New'
    };
    
    return statusMap[normalizedStatus] || status?.charAt(0)?.toUpperCase() + status?.slice(1) || 'Unknown';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Debug Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-blue-800">Orders Information</h3>
            <p className="text-sm text-blue-600">
              Showing {filteredOrders.length} of {orders.length} orders
              {lastRefreshed && ` • Last refreshed: ${new Date(lastRefreshed).toLocaleTimeString()}`}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              Food Orders: {foodOrdersCount} | Grocery Orders: {groceryOrdersCount}
            </p>
            {error && (
              <p className="text-sm text-red-600 mt-1">Error: {error}</p>
            )}
          </div>
          <button
            onClick={debugOrders}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
          >
            Debug Console
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Orders</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {refreshing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Order Type Filter Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          className={`py-3 px-6 font-medium border-b-2 transition-colors ${
            orderTypeFilter === 'all'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setOrderTypeFilter('all')}
        >
          All Orders
          <span className="ml-2 bg-gray-100 px-2 py-1 rounded-full text-xs">
            {orders.length}
          </span>
        </button>
        <button
          className={`py-3 px-6 font-medium border-b-2 transition-colors flex items-center ${
            orderTypeFilter === 'food'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setOrderTypeFilter('food')}
        >
          <span className="mr-2">🍽️</span>
          Food Orders
          <span className="ml-2 bg-orange-100 px-2 py-1 rounded-full text-xs">
            {foodOrdersCount}
          </span>
        </button>
        <button
          className={`py-3 px-6 font-medium border-b-2 transition-colors flex items-center ${
            orderTypeFilter === 'grocery'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setOrderTypeFilter('grocery')}
        >
          <span className="mr-2">🛒</span>
          Grocery Orders
          <span className="ml-2 bg-green-100 px-2 py-1 rounded-full text-xs">
            {groceryOrdersCount}
          </span>
        </button>
      </div>
      
      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled'].map(status => (
          <button
            key={status}
            className={`px-4 py-2 rounded capitalize transition-colors ${
              filter === status 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
            onClick={() => setFilter(status)}
          >
            {status.replace('-', ' ')}
            {status !== 'all' && (
              <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
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

      {/* Loading State */}
      {(loading && orders.length === 0) && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600">Loading orders...</span>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map(order => (
          <div key={order.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4" style={{
            borderLeftColor: (order.orderType || order.type) === 'grocery' ? '#10b981' : '#f97316'
          }}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">{getOrderTypeIcon(order)}</span>
                  <h3 className="text-lg font-semibold">
                    Order #{order.id?.slice(-6) || 'N/A'}
                  </h3>
                  <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getOrderTypeBadge(order)}`}>
                    {getOrderTypeLabel(order)}
                  </span>
                </div>
                <p className="text-gray-600 text-sm">
                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Date not available'}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {getStatusDisplayText(order.status)}
              </span>
            </div>
            
            {/* Order Items */}
            <div className="mb-4">
              <h4 className="font-semibold mb-3 text-gray-800">Order Items:</h4>
              <div className="space-y-2">
                {order.items?.map((item, index) => (
                  <div key={item.id || index} className="flex justify-between items-center text-sm">
                    <div className="flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-gray-600 ml-2">× {item.quantity}</span>
                      {item.category && (
                        <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <span className="font-medium text-gray-800">
                      ₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {/* // In the order summary section, add this after the items list: */}

{/* Order Charges Breakdown */}
<div className="border-t pt-3 mt-3">
  <div className="flex justify-between text-sm text-gray-600 mb-1">
    <span>Subtotal:</span>
    <span>₹{order.subtotal?.toFixed(2) || order.totalAmount?.toFixed(2)}</span>
  </div>
  {order.deliveryFee > 0 && (
    <div className="flex justify-between text-sm text-gray-600 mb-1">
      <span>Delivery Fee:</span>
      <span>₹{order.deliveryFee?.toFixed(2)}</span>
    </div>
  )}
  {order.taxAmount > 0 && (
    <div className="flex justify-between text-sm text-gray-600 mb-1">
      <span>Tax ({order.taxPercentage || 5}%):</span>
      <span>₹{order.taxAmount?.toFixed(2)}</span>
    </div>
  )}
</div>

            {/* Order Summary */}
            <div className="flex justify-between border-t pt-4">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Delivery to:</strong> {formatAddress(order.deliveryAddress)}
                </p>
                {order.deliveryAddress?.phone && (
                  <p className="text-sm text-gray-600">
                    <strong>Phone:</strong> {order.deliveryAddress.phone}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold text-lg text-gray-900">
                  Total: ₹{order.totalAmount?.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-gray-600">
                  Payment: {order.paymentMethod || 'COD'}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {filteredOrders.length === 0 && !loading && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-gray-400 text-6xl mb-4">
              {orderTypeFilter === 'grocery' ? '🛒' : orderTypeFilter === 'food' ? '🍽️' : '📦'}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all' && orderTypeFilter === 'all'
                ? "You haven't placed any orders yet." 
                : `No ${orderTypeFilter !== 'all' ? orderTypeFilter + ' ' : ''}${filter !== 'all' ? filter + ' ' : ''}orders found.`
              }
            </p>
            <button
              onClick={handleRefresh}
              className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600"
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