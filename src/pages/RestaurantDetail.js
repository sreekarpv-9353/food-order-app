// src/pages/RestaurantDetail.js
import { useSelector, useDispatch } from 'react-redux';
import { addToCart, updateQuantity, removeFromCart } from '../redux/slices/cartSlice';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useState, useEffect, useRef } from 'react';

const RestaurantDetail = () => {
  const { id } = useParams();
  const { restaurants, menuItems } = useSelector((state) => state.restaurant);
  const { items, restaurantId: cartRestaurantId, type: cartType } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const passedImage = location.state?.image || null;

  // State to track if we should show compact view cart
  const [showCompactCart, setShowCompactCart] = useState(false);
  const contentRef = useRef(null);
  const lastScrollY = useRef(0);

  // Find restaurant by ID
  const restaurant = restaurants.find(r => r.id === id || r.restaurantid === id);

  // Calculate total cart items and price - ONLY for items from this restaurant
  const currentRestaurantItems = items.filter(item => 
    item.restaurantId === id || item.restaurantId === restaurant?.restaurantid
  );
  
  const cartItemCount = currentRestaurantItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = currentRestaurantItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Only show View Cart if there are items from THIS restaurant and cart type is food
  const showViewCartButton = cartItemCount > 0 && cartType === 'food' && cartRestaurantId === restaurant?.id;

  // Handle scroll to show/hide compact cart
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;

      const currentScrollY = window.scrollY;
      const scrollThreshold = 100; // pixels scrolled down to show compact

      if (currentScrollY > scrollThreshold && currentScrollY > lastScrollY.current) {
        // Scrolling down - show compact
        setShowCompactCart(true);
      } else if (currentScrollY <= scrollThreshold || currentScrollY < lastScrollY.current) {
        // Scrolling up or at top - show full
        setShowCompactCart(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 work-sans">
        <div className="text-center">
          <div className="text-gray-300 text-6xl mb-4">🍽️</div>
          <h2 className="text-xl work-sans-bold text-gray-900 mb-2">Restaurant not found</h2>
          <p className="text-gray-600 text-sm work-sans-medium mb-4">The restaurant you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 work-sans-semibold transition-all hover:scale-105"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Find menu items for this restaurant
  const restaurantMenuItems = menuItems.filter(item => 
    item.restaurantId === id || item.restaurantId === restaurant.restaurantid
  );

  // Group menu items by category
  const menuByCategory = restaurantMenuItems.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  const handleAddToCart = (item) => {
    dispatch(addToCart({
      item,
      restaurantId: restaurant.id,
      type: 'food'
    }));
  };

  const handleUpdateQuantity = (itemId, quantity) => {
    if (quantity === 0) {
      dispatch(removeFromCart(itemId));
    } else {
      dispatch(updateQuantity({ itemId, quantity }));
    }
  };

  const getItemQuantity = (itemId) => {
    const cartItem = items.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const handleViewCart = () => {
    navigate('/cart');
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Check if we're adding from a different restaurant
  const isDifferentRestaurant = cartRestaurantId && cartRestaurantId !== restaurant.id;

  // Check if restaurant is currently open
  const isRestaurantOpen = () => {
    if (!restaurant.currentlyAcceptingOrders) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const currentDay = now.getDay();
    
    if (!restaurant.workingDays || !restaurant.workingDays.includes(currentDay)) {
      return false;
    }
    
    const [openHour, openMinute] = (restaurant.openingTime || '09:00').split(':').map(Number);
    const [closeHour, closeMinute] = (restaurant.closingTime || '23:00').split(':').map(Number);
    
    const openingTime = openHour * 60 + openMinute;
    const closingTime = closeHour * 60 + closeMinute;
    
    return currentTime >= openingTime && currentTime <= closingTime;
  };

  const isOpen = isRestaurantOpen();

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
            .safe-area-bottom {
              padding-bottom: env(safe-area-inset-bottom);
            }
            .safe-area-top {
              padding-top: env(safe-area-inset-top);
            }
            .image-container {
              position: relative;
              width: 100%;
              height: 0;
              padding-bottom: 75%;
              overflow: hidden;
              border-radius: 0.5rem;
            }
            .image-container img {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              object-fit: cover;
              background-color: #f9fafb;
            }
            .image-placeholder {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            }
            .menu-item-card {
              transition: all 0.3s ease;
            }
            .menu-item-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            }
            .status-badge {
              position: absolute;
              top: 12px;
              right: 12px;
              z-index: 2;
              padding: 6px 12px;
              border-radius: 12px;
              font-size: 0.75rem;
              font-weight: 600;
              background: rgba(239, 68, 68, 0.95);
              color: white;
              backdrop-filter: blur(10px);
            }
            .featured-badge {
              position: absolute;
              top: 12px;
              left: 12px;
              z-index: 2;
              padding: 6px 12px;
              border-radius: 12px;
              font-size: 0.75rem;
              font-weight: 600;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .verified-badge {
              display: inline-flex;
              align-items: center;
              background: #10b981;
              color: white;
              padding: 4px 8px;
              border-radius: 8px;
              font-size: 0.7rem;
              margin-left: 6px;
            }
            .service-badge {
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 0.7rem;
              font-weight: 500;
            }
            .compact-cart {
              transition: all 0.3s ease;
            }
            .compact-cart.hidden {
              transform: translateY(100%);
              opacity: 0;
            }
            .compact-cart.visible {
              transform: translateY(0);
              opacity: 1;
            }
          `}
        </style>
      </Helmet>
      
      <div className="min-h-screen bg-white work-sans" ref={contentRef}>
        {/* Restaurant Header with Back Button */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 safe-area-top">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="work-sans-medium text-sm">Back</span>
              </button>
              <h1 className="text-lg work-sans-bold text-gray-900 flex-1 text-center px-4">
                {restaurant.name}
              </h1>
              <div className="w-9"></div> {/* Spacer for balance */}
            </div>
          </div>
        </div>

        {/* Main Content with FIXED bottom padding */}
        <div className={`container mx-auto px-4 py-4 ${showViewCartButton ? 'pb-32' : 'pb-24'} safe-area-bottom`}>
          {/* Restaurant Header Card */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6 border border-gray-100 relative">
            {/* Restaurant Image */}
            {passedImage && (
              <div className="w-full h-48 bg-gray-100 relative">
                <img
                  src={passedImage}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const nextSibling = e.target.nextElementSibling;
                    if (nextSibling) {
                      nextSibling.style.display = 'flex';
                    }
                  }}
                />
                {/* Placeholder for failed images */}
                <div className="image-placeholder" style={{ display: 'none' }}>
                  <span className="text-4xl">🍽️</span>
                </div>
                
                {/* Status Badge */}
                {!isOpen && (
                  <div className="status-badge">
                    🔒 Closed
                  </div>
                )}
                
                {/* Featured Badge */}
                {restaurant.featured && (
                  <div className="featured-badge">
                    ⭐ Featured
                  </div>
                )}
              </div>
            )}
            
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h1 className="text-2xl work-sans-bold mb-1 text-gray-900">{restaurant.name}</h1>
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <p className="text-gray-600 text-base work-sans-medium">{restaurant.cuisine || 'Various Cuisine'}</p>
                    {restaurant.verified && (
                      <span className="verified-badge" title="Verified Restaurant">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Rating and Info Row */}
              <div className="flex items-center justify-between text-sm text-gray-600 mb-4 work-sans-medium">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center text-yellow-500 work-sans-semibold">
                    ⭐ {restaurant.rating || '4.0'}
                    {restaurant.totalRatings > 0 && (
                      <span className="text-gray-500 ml-1">
                        ({restaurant.totalRatings})
                      </span>
                    )}
                  </span>
                  <span>⏱️ {restaurant.preparationTime || '25-30 min'}</span>
                </div>
              </div>
              
              {/* Service Availability */}
              <div className="flex items-center gap-2 mb-4">
                {restaurant.deliveryAvailable && (
                  <span className="service-badge bg-green-100 text-green-700">🚚 Delivery</span>
                )}
                {restaurant.takeawayAvailable && (
                  <span className="service-badge bg-blue-100 text-blue-700">📦 Takeaway</span>
                )}
                {restaurant.dineInAvailable && (
                  <span className="service-badge bg-purple-100 text-purple-700">🍽️ Dine-in</span>
                )}
              </div>

              {/* Pricing Info */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                {restaurant.deliveryFee > 0 ? (
                  <p className="text-sm text-gray-600 work-sans-medium">
                    Delivery: <strong className="text-gray-800">₹{restaurant.deliveryFee}</strong>
                  </p>
                ) : (
                  <p className="text-sm text-green-600 work-sans-medium">
                    🎉 Free Delivery
                  </p>
                )}
                {restaurant.packagingFee > 0 && (
                  <p className="text-sm text-gray-600 work-sans-medium">
                    Packaging: <strong className="text-gray-800">₹{restaurant.packagingFee}</strong>
                  </p>
                )}
              </div>

              {/* Warning Messages */}
              {!isOpen && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-800 text-sm work-sans-medium text-center">
                    🚫 This restaurant is currently closed. Orders will be accepted during business hours.
                  </p>
                </div>
              )}

              {isDifferentRestaurant && items.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-yellow-800 text-sm work-sans-medium">
                    ⚠️ You have items from another restaurant. Adding items here will clear your current cart.
                  </p>
                </div>
              )}

              {/* Show current restaurant cart info */}
              {cartItemCount > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-green-800 text-sm work-sans-medium">
                    ✅ You have {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} from this restaurant in your cart
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Menu Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl work-sans-bold text-gray-900">Menu</h2>
                <p className="text-gray-600 text-sm mt-1 work-sans-medium">
                  {restaurantMenuItems.length} {restaurantMenuItems.length === 1 ? 'delicious item' : 'delicious items'} available
                </p>
              </div>
              {cartItemCount > 0 && (
                <div className="bg-orange-500 text-white px-3 py-1 rounded-full work-sans-semibold text-sm">
                  {cartItemCount} in cart
                </div>
              )}
            </div>
          </div>
          
          {restaurantMenuItems.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(menuByCategory).map(([category, items]) => (
                <div key={category} className="space-y-4">
                  {/* Category Header */}
                  <div className="border-b border-gray-200 pb-2">
                    <h3 className="text-lg work-sans-bold text-gray-900">{category}</h3>
                    <p className="text-gray-500 text-sm work-sans-medium">
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="space-y-4">
                    {items.map(item => {
                      const quantity = getItemQuantity(item.id);
                      const totalPrice = (item.price * quantity).toFixed(2);
                      const hasImage = item.imageUrl && item.imageUrl.trim() !== '';
                      const displayImage = item.image || '🍽️';
                      
                      return (
                        <div 
                          key={item.id} 
                          className={`bg-white rounded-2xl shadow-sm p-4 border border-gray-100 menu-item-card ${
                            !item.available ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="flex gap-4">
                            {/* Menu Item Image */}
                            <div className="flex-shrink-0 w-20 h-20">
                              <div className="image-container">
                                {hasImage ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      const nextSibling = e.target.nextElementSibling;
                                      if (nextSibling) {
                                        nextSibling.style.display = 'flex';
                                      }
                                    }}
                                  />
                                ) : null}
                                {(!hasImage || !item.available) && (
                                  <div className={`image-placeholder ${!item.available ? 'grayscale' : ''}`}>
                                    <span className="text-2xl">{displayImage}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1 mr-3">
                                  <h3 className="text-base work-sans-semibold text-gray-900 mb-1">{item.name}</h3>
                                  <p className="text-orange-600 work-sans-bold text-lg">₹{item.price}</p>
                                  {item.description && (
                                    <p className="text-sm text-gray-600 mt-2 work-sans-medium leading-relaxed">{item.description}</p>
                                  )}
                                </div>
                                
                                {/* Add to Cart / Quantity Controls */}
                                <div className="flex flex-col items-end">
                                  {!item.available ? (
                                    <span className="bg-gray-200 text-gray-500 px-3 py-2 rounded-xl text-sm work-sans-semibold">
                                      Unavailable
                                    </span>
                                  ) : quantity > 0 ? (
                                    <>
                                      <div className="flex items-center space-x-2 bg-orange-50 px-3 py-2 rounded-xl mb-2">
                                        <button
                                          onClick={() => handleUpdateQuantity(item.id, quantity - 1)}
                                          className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm hover:bg-gray-50 transition-all border border-gray-200 work-sans-bold hover:scale-105"
                                        >
                                          <span className="text-sm text-gray-600">−</span>
                                        </button>
                                        <span className="work-sans-bold text-gray-800 min-w-6 text-center text-base">{quantity}</span>
                                        <button
                                          onClick={() => handleUpdateQuantity(item.id, quantity + 1)}
                                          className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm hover:bg-gray-50 transition-all border border-gray-200 work-sans-bold hover:scale-105"
                                        >
                                          <span className="text-sm text-gray-600">+</span>
                                        </button>
                                      </div>
                                      <div className="flex items-center space-x-3">
                                        <span className="text-green-600 work-sans-semibold text-sm">
                                          ₹{totalPrice}
                                        </span>
                                        <button
                                          onClick={() => handleUpdateQuantity(item.id, 0)}
                                          className="text-red-500 hover:text-red-700 text-xs work-sans-medium transition-colors"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => handleAddToCart(item)}
                                      disabled={!isOpen}
                                      className={`px-4 py-3 rounded-xl transition-all work-sans-semibold text-sm shadow-sm min-w-[90px] ${
                                        !isOpen 
                                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                          : 'bg-orange-500 text-white hover:bg-orange-600 hover:scale-105'
                                      }`}
                                    >
                                      {!isOpen ? 'Closed' : 'Add +'}
                                    </button>
                                  )}
                                </div>
                              </div>
                              
                              {/* Item Tags */}
                              {item.vegetarian !== undefined && (
                                <div className="flex items-center space-x-2 mt-2">
                                  {item.vegetarian && (
                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs work-sans-medium">
                                      🌱 Vegetarian
                                    </span>
                                  )}
                                  {item.spicyLevel > 0 && (
                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs work-sans-medium">
                                      {item.spicyLevel === 1 ? '🌶️ Mild' : 
                                       item.spicyLevel === 2 ? '🌶️🌶️ Medium' : 
                                       item.spicyLevel === 3 ? '🌶️🌶️🌶️ Hot' : '🌶️🌶️🌶️🌶️ Very Hot'}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
               {showViewCartButton && (
      <div className="h-32"></div>
    )}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-gray-300 text-6xl mb-4">📋</div>
              <h3 className="text-lg work-sans-bold text-gray-900 mb-2">No menu items available</h3>
              <p className="text-gray-500 text-sm work-sans-medium">Check back later for menu updates</p>
            </div>
          )}
        </div>

        {/* Enhanced View Cart Button - FIXED POSITIONING */}
        {showViewCartButton && (
          <>
            {/* Full View Cart Button - Shown when at top of page */}
            {!showCompactCart && (
              <div className="fixed bottom-24 left-0 right-0 z-30 px-4">
                <div className="container mx-auto">
                  <button
                    onClick={handleViewCart}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 px-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 work-sans-semibold flex justify-between items-center hover:scale-[1.02]"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="bg-white bg-opacity-20 rounded-full p-2">
                        <span className="text-lg">🛒</span>
                      </span>
                      <div className="text-left">
                        <p className="text-base work-sans-semibold">{cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}</p>
                        <p className="text-sm opacity-90 work-sans-medium">View Cart & Checkout</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base work-sans-bold">₹{cartTotal.toFixed(2)}</p>
                      <p className="text-sm opacity-90 work-sans-medium">Total</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Compact View Cart Button - Shown when scrolling down */}
            <div className={`fixed bottom-24 left-0 right-0 z-30 px-4 compact-cart ${showCompactCart ? 'visible' : 'hidden'}`}>
              <div className="container mx-auto">
                <button
                  onClick={handleViewCart}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 work-sans-semibold flex justify-between items-center hover:scale-[1.02]"
                >
                  <div className="flex items-center space-x-2">
                    <span className="bg-white bg-opacity-20 rounded-full p-1">
                      <span className="text-sm">🛒</span>
                    </span>
                    <div className="text-left">
                      <p className="text-sm work-sans-semibold">{cartItemCount} items • ₹{cartTotal.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm work-sans-bold bg-white bg-opacity-20 px-3 py-1 rounded-lg">
                      View Cart
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default RestaurantDetail;