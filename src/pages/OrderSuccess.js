// src/pages/OrderSuccess.js
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get order details from navigation state
  const orderId = location.state?.orderId;
  const orderType = location.state?.orderType || 'food';
  const grandTotal = location.state?.grandTotal;
  const estimatedTime = location.state?.estimatedTime || '30-45 minutes';

  useEffect(() => {
    // Clear any success state after component unmounts
    return () => {
      if (location.state?.orderSuccess) {
        window.history.replaceState({}, document.title);
      }
    };
  }, [location.state]);

  const handleTrackOrder = () => {
    if (orderId) {
      navigate(`/order-tracking/${orderId}`);
    } else {
      navigate('/my-orders');
    }
  };

  const handleContinueShopping = () => {
    navigate('/');
  };

  const getOrderTypeIcon = () => {
    return orderType === 'grocery' ? '🛒' : '🍽️';
  };

  const getOrderTypeLabel = () => {
    return orderType === 'grocery' ? 'Grocery' : 'Food';
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

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 safe-area-bottom work-sans">
        <div className="container mx-auto px-4 py-8">
          {/* Success Animation */}
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
            {/* Animated Checkmark */}
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 animate-bounce">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                  <svg 
                    className="w-16 h-16 text-green-500 animate-scale-in"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={3} 
                      d="M5 13l4 4L19 7" 
                    />
                  </svg>
                </div>
              </div>
              
              {/* Floating particles */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full animate-ping"></div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-orange-400 rounded-full animate-ping animation-delay-1000"></div>
            </div>

            {/* Success Message */}
            <div className="max-w-md mx-auto">
              <h1 className="text-3xl work-sans-bold text-gray-900 mb-4">
                Order Placed Successfully!
              </h1>
              
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-green-200/60 mb-6">
                {/* Order Type Badge */}
                <div className="flex items-center justify-center mb-4">
                  <span className="text-2xl mr-3">{getOrderTypeIcon()}</span>
                  <span className={`px-4 py-2 rounded-full text-sm work-sans-semibold ${
                    orderType === 'grocery' 
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-orange-100 text-orange-700 border border-orange-200'
                  }`}>
                    {getOrderTypeLabel()} Order
                  </span>
                </div>

                {/* Order ID */}
                {orderId && (
                  <div className="mb-4">
                    <p className="text-gray-600 text-sm work-sans-medium mb-1">Order ID</p>
                    <p className="text-gray-900 work-sans-bold text-lg">
                      #{orderId.slice(-8).toUpperCase()}
                    </p>
                  </div>
                )}

                {/* Estimated Delivery */}
                <div className="flex items-center justify-center space-x-2 mb-4 p-3 bg-green-50 rounded-xl border border-green-200">
                  <span className="text-green-600 text-lg">⏱️</span>
                  <div>
                    <p className="text-green-800 work-sans-semibold text-sm">Estimated Delivery</p>
                    <p className="text-green-700 work-sans-medium text-sm">{estimatedTime} min</p>
                  </div>
                </div>

                {/* Total Amount */}
                {grandTotal && (
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-gray-600 text-sm work-sans-medium mb-1">Total Amount</p>
                    <p className="text-gray-900 work-sans-bold text-2xl">
                      ₹{grandTotal.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              {/* Order Status Timeline */}
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200/60 mb-6">
                <h3 className="work-sans-semibold text-gray-900 mb-4 text-center">Order Status</h3>
                
                <div className="space-y-4">
                  {/* Current Step - Confirmed */}
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="work-sans-semibold text-green-700 text-sm">Order Confirmed</p>
                      <p className="text-green-600 text-xs work-sans-medium">Your order has been received</p>
                    </div>
                    <span className="text-green-500 text-lg">✅</span>
                  </div>

                  {/* Next Steps */}
                  {[
                    { icon: '👨‍🍳', label: 'Preparing', description: orderType === 'grocery' ? 'Packing your items' : 'Cooking in progress' },
                    { icon: '📦', label: 'Ready', description: orderType === 'grocery' ? 'Items packed' : 'Food ready for delivery' },
                    { icon: '🚚', label: 'Out for Delivery', description: 'On the way to you' },
                    { icon: '🎉', label: 'Delivered', description: 'Enjoy your order!' }
                  ].map((step, index) => (
                    <div key={step.label} className="flex items-center space-x-3 opacity-60">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-600 text-sm work-sans-bold">{index + 2}</span>
                      </div>
                      <div className="flex-1">
                        <p className="work-sans-semibold text-gray-500 text-sm">{step.label}</p>
                        <p className="text-gray-400 text-xs work-sans-medium">{step.description}</p>
                      </div>
                      <span className="text-gray-400 text-lg">{step.icon}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleTrackOrder}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl hover:shadow-lg transition-all duration-200 work-sans-semibold text-lg active:scale-95 flex items-center justify-center space-x-2"
                >
                  <span>🚚 Track Your Order</span>
                </button>
                
                <button
                  onClick={handleContinueShopping}
                  className="w-full bg-white border border-gray-300 text-gray-700 py-4 rounded-xl hover:bg-gray-50 transition-all duration-200 work-sans-semibold text-lg active:scale-95 flex items-center justify-center space-x-2"
                >
                  <span>🛍️ Continue Shopping</span>
                </button>
              </div>

              {/* Help Text */}
              <div className="mt-6 text-center">
                <p className="text-gray-500 text-sm work-sans-medium">
                  Need help? <button className="text-green-600 hover:text-green-700 work-sans-semibold">Contact Support</button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderSuccess;