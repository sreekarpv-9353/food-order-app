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
  const [searchQuery, setSearchQuery] = useState('');
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
          <div className="text-gray-300 text-5xl mb-3">🍽️</div>
          <h2 className="text-lg work-sans-bold text-gray-900 mb-2">Restaurant not found</h2>
          <p className="text-gray-600 text-xs work-sans-medium mb-4">The restaurant you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 work-sans-semibold transition-all hover:scale-105 text-sm"
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

  // Filter menu items based on search query
  const filteredMenuItems = restaurantMenuItems.filter(item => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query)
    );
  });

  // Group menu items by category
  const menuByCategory = filteredMenuItems.reduce((acc, item) => {
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

  const handleClearSearch = () => {
    setSearchQuery('');
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
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            .status-badge {
              position: absolute;
              top: 8px;
              right: 8px;
              z-index: 2;
              padding: 4px 8px;
              border-radius: 10px;
              font-size: 0.65rem;
              font-weight: 600;
              background: rgba(239, 68, 68, 0.95);
              color: white;
              backdrop-filter: blur(10px);
            }
            .featured-badge {
              position: absolute;
              top: 8px;
              left: 8px;
              z-index: 2;
              padding: 4px 8px;
              border-radius: 10px;
              font-size: 0.65rem;
              font-weight: 600;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .verified-badge {
              display: inline-flex;
              align-items: center;
              background: #10b981;
              color: white;
              padding: 2px 6px;
              border-radius: 6px;
              font-size: 0.6rem;
              margin-left: 4px;
            }
            .service-badge {
              padding: 3px 6px;
              border-radius: 5px;
              font-size: 0.6rem;
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
            .text-balance {
              text-wrap: balance;
            }
            .text-pretty {
              text-wrap: pretty;
            }
            .line-clamp-2 {
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            .line-clamp-3 {
              display: -webkit-box;
              -webkit-line-clamp: 3;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            /* Mobile-optimized restaurant image */
            .restaurant-image-container {
              position: relative;
              width: 100%;
              height: 0;
              padding-bottom: 45%; /* Reduced from 60% for mobile */
              overflow: hidden;
            }
            .restaurant-image-container img {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
          `}
        </style>
      </Helmet>
      
      <div className="min-h-screen bg-white work-sans" ref={contentRef}>
        {/* Restaurant Header with Back Button - REMOVED RESTAURANT NAME */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 safe-area-top shadow-sm">
          <div className="container mx-auto px-3 py-2">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 transition-colors p-2 -ml-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="work-sans-medium text-xs">Back</span>
              </button>
              {/* REMOVED RESTAURANT NAME FROM HEADER */}
              <div className="flex-1"></div>
              <div className="w-8"></div> {/* Spacer for balance */}
            </div>
          </div>
        </div>

        {/* Main Content with PROPER BOTTOM SPACING FOR BOTTOM BAR */}
        <div className={`container mx-auto px-3 ${showViewCartButton ? 'pb-40' : 'pb-24'} safe-area-bottom`}>
          {/* Restaurant Header Card */}
          <div className="bg-white overflow-hidden border-b border-gray-100 relative">
            {/* Restaurant Image - MOBILE OPTIMIZED SIZE */}
            {passedImage && (
              <div className="w-full bg-gray-100 relative">
                <div className="restaurant-image-container">
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
                    <span className="text-2xl">🍽️</span>
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
              </div>
            )}
            
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  {/* RESTAURANT NAME SHOWN HERE ONLY */}
                  <h1 className="text-lg work-sans-bold mb-1 text-gray-900 text-balance">{restaurant.name}</h1>
                  <div className="flex items-center flex-wrap gap-1 mb-1">
                    <p className="text-gray-600 text-sm work-sans-medium">{restaurant.cuisine || 'Various Cuisine'}</p>
                    {restaurant.verified && (
                      <span className="verified-badge" title="Verified Restaurant">
                        ✓
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Rating and Info Row */}
              <div className="flex items-center justify-between text-xs text-gray-600 mb-3 work-sans-medium">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center text-yellow-500 work-sans-semibold">
                    ⭐ {restaurant.rating || '4.0'}
                    {restaurant.totalRatings > 0 && (
                      <span className="text-gray-500 ml-0.5">
                        ({restaurant.totalRatings})
                      </span>
                    )}
                  </span>
                  <span>⏱️ {restaurant.preparationTime || '25-30 min'}</span>
                </div>
              </div>

              {/* Warning Messages */}
              {!isOpen && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-xs work-sans-medium text-center text-pretty">
                    🚫 Currently closed. Orders accepted during business hours.
                  </p>
                </div>
              )}

              {isDifferentRestaurant && items.length > 0 && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-xs work-sans-medium text-pretty">
                    ⚠️ Items from another restaurant. Adding here clears current cart.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Menu Section with Search */}
          <div className="mb-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base work-sans-bold text-gray-900">Menu Items</h2>
              </div>
            </div>

            {/* Search Bar - Mobile Optimized */}
            <div className="mb-4">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="🔍 Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-3 pl-10 pr-8 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm work-sans-medium bg-gray-50 transition-all"
                />
                {/* Clear Button */}
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Search Results Info */}
              {searchQuery && (
                <div className="mt-2 text-xs text-gray-600 work-sans-medium text-pretty bg-blue-50 px-3 py-1.5 rounded-lg">
                  <span>
                    Found <strong className="text-orange-600">{filteredMenuItems.length}</strong> item(s) matching "<strong>{searchQuery}</strong>"
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {filteredMenuItems.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(menuByCategory).map(([category, items]) => (
                <div key={category} className="space-y-3">
                  {/* Category Header */}
                  <div className="border-b border-gray-200 pb-1">
                    <h3 className="text-sm work-sans-bold text-gray-900">{category}</h3>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="space-y-3">
                    {items.map(item => {
                      const quantity = getItemQuantity(item.id);
                      const totalPrice = (item.price * quantity).toFixed(2);
                      const hasImage = item.imageUrl && item.imageUrl.trim() !== '';
                      const displayImage = item.image || '🍽️';
                      
                      return (
                        <div 
                          key={item.id} 
                          className={`bg-white rounded-xl shadow-sm p-3 border border-gray-100 menu-item-card ${
                            !item.available ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="flex gap-3">
                            {/* Menu Item Image */}
                            <div className="flex-shrink-0 w-16 h-16">
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
                                    <span className="text-xl">{displayImage}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Content Area */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                                {/* Text Content */}
                                <div className="flex-1 min-w-0 mr-2">
                                  <h3 className="text-sm work-sans-semibold text-gray-900 mb-0.5 line-clamp-2">{item.name}</h3>
                                  <p className="text-orange-600 work-sans-bold text-base">₹{item.price}</p>
                                  {item.description && (
                                    <p className="text-xs text-gray-600 mt-1 work-sans-medium leading-relaxed line-clamp-2">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                                
                                {/* Add to Cart / Quantity Controls */}
                                <div className="flex flex-col items-end mt-1">
                                  {!item.available ? (
                                    <span className="bg-gray-200 text-gray-500 px-2 py-1.5 rounded-lg text-xs work-sans-semibold whitespace-nowrap">
                                      Unavailable
                                    </span>
                                  ) : quantity > 0 ? (
                                    <div className="flex flex-col items-end space-y-1 w-full">
                                      {/* Quantity Controls */}
                                      <div className="flex items-center justify-between w-full max-w-[120px] bg-orange-50 px-2 py-1.5 rounded-lg">
                                        <button
                                          onClick={() => handleUpdateQuantity(item.id, quantity - 1)}
                                          className="w-6 h-6 bg-white rounded flex items-center justify-center shadow-sm hover:bg-gray-50 transition-all border border-gray-200 work-sans-bold hover:scale-105 flex-shrink-0"
                                        >
                                          <span className="text-xs text-gray-600">−</span>
                                        </button>
                                        <span className="work-sans-bold text-gray-800 min-w-5 text-center text-sm mx-1">
                                          {quantity}
                                        </span>
                                        <button
                                          onClick={() => handleUpdateQuantity(item.id, quantity + 1)}
                                          className="w-6 h-6 bg-white rounded flex items-center justify-center shadow-sm hover:bg-gray-50 transition-all border border-gray-200 work-sans-bold hover:scale-105 flex-shrink-0"
                                        >
                                          <span className="text-xs text-gray-600">+</span>
                                        </button>
                                      </div>
                                      
                                      {/* Price and Remove */}
                                      <div className="flex items-center justify-between w-full">
                                        <span className="text-green-600 work-sans-semibold text-xs">
                                          ₹{totalPrice}
                                        </span>
                                        <button
                                          onClick={() => handleUpdateQuantity(item.id, 0)}
                                          className="text-red-500 hover:text-red-700 text-xs work-sans-medium transition-colors whitespace-nowrap ml-2"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleAddToCart(item)}
                                      disabled={!isOpen}
                                      className={`px-3 py-2 rounded-lg transition-all work-sans-semibold text-xs shadow-sm min-w-[70px] whitespace-nowrap ${
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
                                <div className="flex items-center space-x-1 mt-2">
                                  {item.vegetarian && (
                                    <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs work-sans-medium">
                                      🌱 Veg
                                    </span>
                                  )}
                                  {item.spicyLevel > 0 && (
                                    <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full text-xs work-sans-medium">
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
              {/* EXTRA BOTTOM SPACING TO ENSURE LAST ITEM IS VISIBLE */}
              <div className="h-24"></div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-300 text-5xl mb-3">
                {searchQuery ? '🔍' : '📋'}
              </div>
              <h3 className="text-base work-sans-bold text-gray-900 mb-1">
                {searchQuery ? 'No items found' : 'No menu items available'}
              </h3>
              <p className="text-gray-500 text-xs work-sans-medium">
                {searchQuery ? 'Try adjusting your search terms' : 'Check back later for menu updates'}
              </p>
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="mt-3 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600 work-sans-semibold transition-all hover:scale-105"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>

        {/* Enhanced View Cart Button - POSITIONED ABOVE BOTTOM BAR */}
        {showViewCartButton && (
          <>
            {/* Full View Cart Button - Shown when at top of page */}
            {!showCompactCart && (
              <div className="fixed bottom-20 left-0 right-0 z-30 px-3">
                <div className="container mx-auto">
                  <button
                    onClick={handleViewCart}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 work-sans-semibold flex justify-between items-center hover:scale-[1.02] border-2 border-white"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="bg-white bg-opacity-20 rounded-full p-1.5">
                        <span className="text-base">🛒</span>
                      </span>
                      <div className="text-left">
                        <p className="text-sm work-sans-semibold">{cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}</p>
                        <p className="text-xs opacity-90 work-sans-medium">View Cart & Checkout</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm work-sans-bold">₹{cartTotal.toFixed(2)}</p>
                      <p className="text-xs opacity-90 work-sans-medium">Total</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Compact View Cart Button - Shown when scrolling down */}
            <div className={`fixed bottom-20 left-0 right-0 z-30 px-3 compact-cart ${showCompactCart ? 'visible' : 'hidden'}`}>
              <div className="container mx-auto">
                <button
                  onClick={handleViewCart}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2.5 px-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 work-sans-semibold flex justify-between items-center hover:scale-[1.02] border-2 border-white"
                >
                  <div className="flex items-center space-x-1.5">
                    <span className="bg-white bg-opacity-20 rounded-full p-1">
                      <span className="text-xs">🛒</span>
                    </span>
                    <div className="text-left">
                      <p className="text-xs work-sans-semibold">{cartItemCount} items • ₹{cartTotal.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs work-sans-bold bg-white bg-opacity-20 px-2 py-1 rounded">
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