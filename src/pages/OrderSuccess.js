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

  const handleContactSupport = () => {
    navigate('/faq');
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
              font-weight: 400;
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

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 safe-area-bottom work-sans">
        <div className="container mx-auto px-4 py-6">
          {/* Success Animation */}
          <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
            {/* Animated Checkmark */}
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 animate-bounce">
                <div className="w-18 h-18 bg-white rounded-full flex items-center justify-center">
                  <svg 
                    className="w-12 h-12 text-green-500 animate-scale-in"
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
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full animate-ping"></div>
              <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-orange-400 rounded-full animate-ping animation-delay-1000"></div>
            </div>

            {/* Success Message */}
            <div className="max-w-md w-full mx-auto">
              <h1 className="text-xl work-sans-medium text-gray-900 mb-3">
                Order Placed Successfully!
              </h1>
              
              <div className="bg-white/90 backdrop-blur-lg rounded-xl p-4 shadow-lg border border-green-200/60 mb-4">
                {/* Order Type Badge */}
                <div className="flex items-center justify-center mb-3">
                  <span className="text-lg mr-2">{getOrderTypeIcon()}</span>
                  <span className={`px-3 py-1.5 rounded-full text-xs work-sans-medium ${
                    orderType === 'grocery' 
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-orange-100 text-orange-700 border border-orange-200'
                  }`}>
                    {getOrderTypeLabel()} Order
                  </span>
                </div>

                {/* Order ID */}
                {orderId && (
                  <div className="mb-3">
                    <p className="text-gray-600 text-xs work-sans-medium mb-1">Order ID</p>
                    <p className="text-gray-900 work-sans-medium text-sm">
                      #{orderId.slice(-8).toUpperCase()}
                    </p>
                  </div>
                )}

                {/* Estimated Delivery */}
                <div className="flex items-center justify-center space-x-2 mb-3 p-2 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-green-600 text-base">⏱️</span>
                  <div>
                    <p className="text-green-800 work-sans-medium text-xs">Estimated Delivery</p>
                    <p className="text-green-700 work-sans-medium text-xs">{estimatedTime}</p>
                  </div>
                </div>

                {/* Total Amount */}
                {grandTotal && (
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-gray-600 text-xs work-sans-medium mb-1">Total Amount</p>
                    <p className="text-gray-900 work-sans-medium text-lg">
                      ₹{grandTotal.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              {/* Order Status Timeline */}
              <div className="bg-white/90 backdrop-blur-lg rounded-xl p-4 shadow-lg border border-gray-200/60 mb-4">
                <h3 className="work-sans-medium text-gray-900 mb-3 text-center text-sm">Order Status</h3>
                
                <div className="space-y-3">
                  {/* Current Step - Confirmed */}
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="work-sans-medium text-green-700 text-xs">Order Confirmed</p>
                      <p className="text-green-600 text-xs work-sans-medium">Your order has been received</p>
                    </div>
                    <span className="text-green-500 text-sm">✅</span>
                  </div>

                  {/* Next Steps */}
                  {[
                    { icon: '👨‍🍳', label: 'Preparing', description: orderType === 'grocery' ? 'Packing your items' : 'Cooking in progress' },
                    { icon: '📦', label: 'Ready', description: orderType === 'grocery' ? 'Items packed' : 'Food ready for delivery' },
                    { icon: '🚚', label: 'Out for Delivery', description: 'On the way to you' },
                    { icon: '🎉', label: 'Delivered', description: 'Enjoy your order!' }
                  ].map((step, index) => (
                    <div key={step.label} className="flex items-center space-x-2 opacity-60">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-600 text-xs work-sans-medium">{index + 2}</span>
                      </div>
                      <div className="flex-1">
                        <p className="work-sans-medium text-gray-500 text-xs">{step.label}</p>
                        <p className="text-gray-400 text-xs work-sans-medium">{step.description}</p>
                      </div>
                      <span className="text-gray-400 text-sm">{step.icon}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleTrackOrder}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg hover:shadow-lg transition-all duration-200 work-sans-medium text-sm active:scale-95 flex items-center justify-center space-x-2"
                >
                  <span>🚚</span>
                  <span>Track Your Order</span>
                </button>
                
                <button
                  onClick={handleContinueShopping}
                  className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-all duration-200 work-sans-medium text-sm active:scale-95 flex items-center justify-center space-x-2"
                >
                  <span>🛍️</span>
                  <span>Continue Shopping</span>
                </button>
              </div>

              {/* Help Text */}
              <div className="mt-4 text-center">
                <p className="text-gray-500 text-xs work-sans-medium">
                  Need help?{' '}
                  <button 
                    onClick={handleContactSupport}
                    className="text-green-600 hover:text-green-700 work-sans-medium underline"
                  >
                    Contact Support
                  </button>
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