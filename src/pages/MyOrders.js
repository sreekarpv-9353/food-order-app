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
  const [showStatusFilters, setShowStatusFilters] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);

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
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'pending': 
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'cancelled': 
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'preparing':
      case 'ready':
      case 'out-for-delivery':
      case 'in-progress': 
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      default: 
        return 'bg-gray-100 text-gray-800 border border-gray-200';
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
            <p className="text-sm text-gray-600 mt-1">
              {filteredOrders.length} of {orders.length} orders
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="bg-orange-500 text-white p-2 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {refreshing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>
        </div>

        {/* Order Type Tabs */}
        <div className="flex bg-white rounded-xl p-1 mb-3 shadow-sm border border-gray-100">
          {[
            { key: 'all', label: 'All', count: orders.length, emoji: '📦' },
            { key: 'food', label: 'Food', count: foodOrdersCount, emoji: '🍽️' },
            { key: 'grocery', label: 'Grocery', count: groceryOrdersCount, emoji: '🛒' }
          ].map((tab) => (
            <button
              key={tab.key}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-1 text-sm ${
                orderTypeFilter === tab.key
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setOrderTypeFilter(tab.key)}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                orderTypeFilter === tab.key 
                  ? 'bg-white text-orange-500' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="bg-white rounded-xl p-3 mb-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 text-sm">Filter by Status</h3>
            <button
              onClick={() => setShowStatusFilters(!showStatusFilters)}
              className="text-orange-500 text-xs font-medium"
            >
              {showStatusFilters ? 'Hide' : 'Show'}
            </button>
          </div>
          
          <div className={`transition-all duration-300 overflow-hidden ${
            showStatusFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="grid grid-cols-3 gap-1">
              {[
                { key: 'all', label: 'All' },
                { key: 'pending', label: 'Pending' },
                { key: 'confirmed', label: 'Confirmed' },
                { key: 'preparing', label: 'Preparing' },
                { key: 'ready', label: 'Ready' },
                { key: 'out-for-delivery', label: 'Out for Delivery' },
                { key: 'delivered', label: 'Delivered' },
                { key: 'cancelled', label: 'Cancelled' }
              ].map((status) => (
                <button
                  key={status.key}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    filter === status.key
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => {
                    setFilter(status.key);
                    setShowStatusFilters(false);
                  }}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {(loading && orders.length === 0) && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-3"></div>
            <p className="text-gray-600 text-sm">Loading your orders...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-red-800 font-medium text-sm">Failed to load orders</p>
                <p className="text-red-600 text-xs mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Order Header - Always Visible */}
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start space-x-2 flex-1">
                    <span className="text-xl mt-0.5">{getOrderTypeIcon(order)}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        Order #{order.id?.slice(-6) || 'N/A'}
                      </h3>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {formatDate(order.createdAt)}
                      </p>
                      
                      {/* Restaurant Info for Food Orders */}
                      {order.restaurant && (
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs font-medium text-gray-700">
                            {order.restaurant.name}
                          </span>
                          <span className="text-yellow-500 text-xs flex items-center">
                            ⭐ {order.restaurant.rating || '4.2'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1 flex-shrink-0 ml-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusDisplayText(order.status)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getOrderTypeBadge(order)}`}>
                      {getOrderTypeLabel(order)}
                    </span>
                  </div>
                </div>

                {/* Quick Summary - Always Visible */}
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">
                      {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-sm">
                      ₹{order.pricing?.grandTotal?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Expandable Section */}
              <div className={`transition-all duration-300 overflow-hidden ${
                expandedOrder === order.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                {/* Order Items */}
                <div className="p-3 border-b border-gray-100">
                  <h4 className="font-semibold text-gray-900 text-sm mb-2">Order Items</h4>
                  <div className="space-y-2">
                    {order.items?.map((item, index) => (
                      <div key={item.id || index} className="flex justify-between items-center text-xs">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <span className="text-gray-400 flex-shrink-0">•</span>
                          <span className="font-medium text-gray-800 truncate">{item.name}</span>
                          <span className="text-gray-500 flex-shrink-0">×{item.quantity}</span>
                        </div>
                        <div className="flex flex-col items-end text-right">
                          <span className="font-semibold text-gray-900 text-xs">
                            ₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                          </span>
                          <span className="text-gray-500 text-xs">
                            ₹{item.price} each
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detailed Pricing Breakdown */}
                <div className="p-3 border-b border-gray-100">
                  <h4 className="font-semibold text-gray-900 text-sm mb-2">Price Breakdown</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items Total</span>
                      <span className="font-medium">₹{order.pricing?.itemsTotal?.toFixed(2) || order.subtotal?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Fee</span>
                      <span className="font-medium">₹{order.pricing?.deliveryFee.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax ({order.pricing?.taxPercentage || 5}%)</span>
                      <span className="font-medium">₹{order.pricing?.taxAmount?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1 mt-1">
                      <span>Total Amount</span>
                      <span>₹{order.pricing?.grandTotal.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="p-3 border-b border-gray-100">
                  <h4 className="font-semibold text-gray-900 text-sm mb-2">Delivery Info</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-start space-x-2">
                      <svg className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-600">
                          {formatAddress(order.deliveryAddress)}
                        </p>
                        {order.deliveryAddress?.phone && (
                          <p className="text-gray-500 mt-0.5">
                            📞 {order.deliveryAddress.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    {order.deliveryZone && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery Zone</span>
                        <span className="font-medium">{order.deliveryZone}</span>
                      </div>
                    )}
                    {order.deliveryTime && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Estimated Delivery</span>
                        <span className="font-medium">{`${order.deliveryTime} minutes`}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Information */}
                <div className="p-3">
                  <h4 className="font-semibold text-gray-900 text-sm mb-2">Payment</h4>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-medium bg-gray-100 px-2 py-1 rounded">
                      {order.paymentMethod || 'COD'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expand/Collapse Button */}
              <button
                onClick={() => toggleOrderExpand(order.id)}
                className="w-full p-3 border-t border-gray-100 flex items-center justify-center text-xs text-orange-500 font-medium hover:bg-gray-50 transition-colors"
              >
                {expandedOrder === order.id ? (
                  <>
                    <span>Show Less</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </>
                ) : (
                  <>
                    <span>View Details</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredOrders.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-300 text-5xl mb-3">
              {orderTypeFilter === 'grocery' ? '🛒' : orderTypeFilter === 'food' ? '🍽️' : '📦'}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600 text-sm mb-6 max-w-xs mx-auto">
              {filter === 'all' && orderTypeFilter === 'all'
                ? "You haven't placed any orders yet. Start shopping to see your orders here!"
                : `No ${orderTypeFilter !== 'all' ? orderTypeFilter + ' ' : ''}orders found${filter !== 'all' ? ` with status "${filter}"` : ''}.`
              }
            </p>
            <button
              onClick={handleRefresh}
              className="bg-orange-500 text-white px-6 py-2.5 rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm"
            >
              Check for New Orders
            </button>
          </div>
        )}

        {/* Last Refreshed Info */}
        {lastRefreshed && filteredOrders.length > 0 && (
          <div className="text-center pt-6 pb-2">
            <p className="text-xs text-gray-500">
              Updated: {new Date(lastRefreshed).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;