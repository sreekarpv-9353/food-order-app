import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchRestaurants } from '../redux/slices/restaurantSlice';
import { fetchGroceryItems } from '../redux/slices/grocerySlice';
import { addToCart, updateQuantity, removeFromCart } from '../redux/slices/cartSlice';
import { settingsService } from '../services/settingsService';
import Loader from '../components/Loader';
import { Helmet } from 'react-helmet';

// ✅ Import restaurant images
import rest1 from '../assets/rest1.jpg';
import rest2 from '../assets/rest2.png';
import rest3 from '../assets/rest3.png';

// Grocery categories for filtering
const GROCERY_CATEGORIES = [
  'All',
  'Fruits & Vegetables',
  'Dairy & Eggs',
  'Meat & Poultry',
  'Fish & Seafood',
  'Grains & Pulses',
  'Oils & Ghee',
  'Spices & Masalas',
  'Bakery & Snacks',
  'Beverages',
  'Frozen Foods',
  'Personal Care',
  'Household Items',
  'Other'
];

const Home = () => {
  const [activeTab, setActiveTab] = useState('food');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [minOrderInfo, setMinOrderInfo] = useState({
    food: 0,
    grocery: 0,
    foodEnabled: false,
    groceryEnabled: false
  });
  const [refreshing, setRefreshing] = useState(false);
  
  const { restaurants, loading: restaurantLoading, error: restaurantError } = useSelector((state) => state.restaurant);
  const { items: groceryItems, loading: groceryLoading, error: groceryError } = useSelector((state) => state.grocery);
  const { items, type: cartType } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const restaurantImages = [rest1, rest2, rest3];

  // Create a stable mapping of restaurant IDs to images
  const getRestaurantImage = (restaurant, index) => {
    // Use restaurant logo if available
    if (restaurant.logo && restaurant.logo.trim() !== '') {
      return restaurant.logo;
    }
    
    // Fallback to local images
    if (restaurant.id) {
      const hash = restaurant.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return restaurantImages[hash % restaurantImages.length];
    }
    return restaurantImages[index % restaurantImages.length];
  };

  // Check if restaurant is currently open
  const isRestaurantOpen = (restaurant) => {
    if (!restaurant.currentlyAcceptingOrders) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Check if restaurant is open today
    if (!restaurant.workingDays || !restaurant.workingDays.includes(currentDay)) {
      return false;
    }
    
    // Parse opening and closing times
    const [openHour, openMinute] = (restaurant.openingTime || '09:00').split(':').map(Number);
    const [closeHour, closeMinute] = (restaurant.closingTime || '23:00').split(':').map(Number);
    
    const openingTime = openHour * 60 + openMinute;
    const closingTime = closeHour * 60 + closeMinute;
    
    return currentTime >= openingTime && currentTime <= closingTime;
  };

  // Get next opening time for closed restaurants
  const getNextOpeningTime = (restaurant) => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [openHour, openMinute] = (restaurant.openingTime || '09:00').split(':').map(Number);
    const openingTime = openHour * 60 + openMinute;
    
    // If it's closed for the day, find next open day
    if (!restaurant.workingDays || !restaurant.workingDays.includes(currentDay)) {
      for (let i = 1; i <= 7; i++) {
        const nextDay = (currentDay + i) % 7;
        if (restaurant.workingDays?.includes(nextDay)) {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          return `Opens ${dayNames[nextDay]} at ${restaurant.openingTime || '09:00'}`;
        }
      }
      return 'Closed temporarily';
    }
    
    // If it's before opening time today
    if (currentTime < openingTime) {
      return `Opens today at ${restaurant.openingTime || '09:00'}`;
    }
    
    // If it's after closing time today
    return `Opens tomorrow at ${restaurant.openingTime || '09:00'}`;
  };

  useEffect(() => {
    if (user) {
      if (activeTab === 'food') {
        dispatch(fetchRestaurants());
      } else {
        dispatch(fetchGroceryItems());
      }
    }
  }, [user, dispatch, activeTab]);

  // Clear search when switching tabs
  useEffect(() => {
    setSearchQuery('');
    setSelectedCategory('All');
  }, [activeTab]);

  const loadMinOrderInfo = async () => {
    try {
      const settings = await settingsService.getSettings();
      setMinOrderInfo({
        food: settings.foodMinOrderValue,
        grocery: settings.groceryMinOrderValue,
        foodEnabled: settings.isFoodMinOrderEnabled,
        groceryEnabled: settings.isGroceryMinOrderEnabled
      });
    } catch (error) {
      console.error('Error loading minimum order info:', error);
    }
  };

  // Filter restaurants based on search query and availability
  const foodRestaurants = restaurants
    .filter((restaurant) => {
      // Filter by type and active status
      if (restaurant.type === 'grocery') return false;
      if (restaurant.isActive === false) return false;
      return true;
    })
    .filter((restaurant) => {
      // Apply search filter
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        restaurant.name?.toLowerCase().includes(query) ||
        restaurant.cuisine?.toLowerCase().includes(query) ||
        restaurant.description?.toLowerCase().includes(query) ||
        restaurant.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      // Sort by open restaurants first, then featured, then rating
      const aOpen = isRestaurantOpen(a);
      const bOpen = isRestaurantOpen(b);
      
      if (aOpen && !bOpen) return -1;
      if (!aOpen && bOpen) return 1;
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return (b.rating || 0) - (a.rating || 0);
    });

  // Filter grocery items - only show active items, apply search and category filters
  const filteredGroceryItems = groceryItems
    .filter(item => item.isActive !== false) // Only show active items
    .filter((item) => {
      // Apply category filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      
      // Apply search filter
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        item.name?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    });

  const refreshData = async () => {
    if (refreshing) return; // Prevent multiple clicks
    
    setRefreshing(true);
    try {
      if (activeTab === 'food') {
        await dispatch(fetchRestaurants()).unwrap();
      } else {
        await dispatch(fetchGroceryItems()).unwrap();
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // ✅ Grocery cart handlers
  const handleGroceryAddToCart = (item) => {
    if (item.stock > 0) {
      dispatch(addToCart({
        item,
        restaurantId: 'grocery-store',
        type: 'grocery'
      }));
    }
  };

  const handleGroceryUpdateQuantity = (itemId, quantity) => {
    if (quantity === 0) {
      dispatch(removeFromCart(itemId));
    } else {
      // Check stock before updating quantity
      const item = groceryItems.find(gItem => gItem.id === itemId);
      if (item && quantity <= item.stock) {
        dispatch(updateQuantity({ itemId, quantity }));
      }
    }
  };

  const getGroceryItemQuantity = (itemId) => {
    const cartItem = items.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const isMixedCart = items.length > 0 && (
    (activeTab === 'food' && cartType === 'grocery') ||
    (activeTab === 'grocery' && cartType === 'food')
  );

  const loading = activeTab === 'food' ? restaurantLoading : groceryLoading;
  const error = activeTab === 'food' ? restaurantError : groceryError;

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleViewCart = () => {
    navigate('/cart');
  };

  // Calculate total cart items and price
  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Get current minimum order info
  const currentMinOrder = activeTab === 'food' ? minOrderInfo.food : minOrderInfo.grocery;
  const isMinOrderEnabled = activeTab === 'food' ? minOrderInfo.foodEnabled : minOrderInfo.groceryEnabled;

  // Only show View Cart button when on grocery tab and there are items in cart
  const showViewCartButton = activeTab === 'grocery' && cartItemCount > 0 && cartType === 'grocery';

  // Get available categories from active grocery items
  const availableCategories = ['All', ...new Set(
    groceryItems
      .filter(item => item.isActive !== false)
      .map(item => item.category)
      .filter(Boolean)
  )];

  if (loading && restaurants.length === 0 && groceryItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center work-sans safe-area-bottom">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 work-sans safe-area-bottom">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 work-sans-medium text-xs">
            Error: {error}
          </div>
          <button
            onClick={refreshData}
            className="bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 work-sans-semibold text-xs"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
            .text-balance {
              text-wrap: balance;
            }
            .text-pretty {
              text-wrap: pretty;
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .animate-spin {
              animation: spin 1s linear infinite;
            }
            .category-scroll {
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
            .category-scroll::-webkit-scrollbar {
              display: none;
            }
            /* Improved image container styles */
            .image-container {
              position: relative;
              width: 100%;
              height: 0;
              padding-bottom: 75%; /* 4:3 aspect ratio */
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
            .restaurant-closed {
              filter: blur(1px);
              opacity: 0.8;
            }
            .status-badge {
              position: absolute;
              top: 6px;
              right: 6px;
              z-index: 2;
              padding: 3px 6px;
              border-radius: 10px;
              font-size: 0.6rem;
              font-weight: 600;
              background: rgba(239, 68, 68, 0.95);
              color: white;
              backdrop-filter: blur(10px);
            }
            .featured-badge {
              position: absolute;
              top: 6px;
              left: 6px;
              z-index: 2;
              padding: 3px 6px;
              border-radius: 10px;
              font-size: 0.6rem;
              font-weight: 600;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .verified-badge {
              display: inline-flex;
              align-items: center;
              background: #10b981;
              color: white;
              padding: 1px 4px;
              border-radius: 6px;
              font-size: 0.55rem;
              margin-left: 3px;
            }
            .opening-time {
              position: absolute;
              bottom: 6px;
              right: 6px;
              background: rgba(0, 0, 0, 0.8);
              color: white;
              padding: 3px 6px;
              border-radius: 6px;
              font-size: 0.55rem;
              font-weight: 500;
              backdrop-filter: blur(10px);
              z-index: 2;
            }
            .restaurant-card {
              transition: all 0.3s ease;
            }
            .restaurant-card:hover {
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            .service-badge {
              padding: 2px 5px;
              border-radius: 5px;
              font-size: 0.55rem;
              font-weight: 500;
            }
          `}
        </style>
      </Helmet>
      
      <div className="min-h-screen bg-white safe-area-bottom work-sans">
        {/* Main Content with Dynamic Bottom Padding */}
        <div className={`container mx-auto px-3 pt-4 ${showViewCartButton ? 'pb-28' : 'pb-4'} safe-area-top`}>
          {/* Header with Title and Refresh */}
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-xl work-sans-bold text-gray-900 text-balance">
                {activeTab === 'food' ? 'Food Delivery' : 'Grocery Delivery'}
              </h1>
              <p className="text-gray-500 text-xs work-sans-medium mt-0.5">
                {activeTab === 'food' 
                  ? 'Discover amazing restaurants near you'
                  : 'Fresh groceries delivered to your doorstep'
                }
              </p>
            </div>
            <button
              onClick={refreshData}
              disabled={refreshing}
              className={`bg-orange-500 text-white p-2.5 rounded-full transition-all work-sans-medium flex-shrink-0 ${
                refreshing ? 'opacity-75 cursor-not-allowed' : 'hover:bg-orange-600 hover:scale-105'
              }`}
            >
              {refreshing ? (
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </button>
          </div>

          {/* Tabs - Mobile Optimized */}
          <div className="flex bg-gray-100 rounded-xl p-0.5 mb-4">
            <button
              className={`flex-1 py-2 px-3 rounded-lg transition-all duration-300 flex items-center justify-center space-x-1 work-sans-semibold ${
                activeTab === 'food'
                  ? 'bg-white text-orange-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('food')}
            >
              <span className="text-base">🍽️</span>
              <span className="text-xs">Food</span>
            </button>
            <button
              className={`flex-1 py-2 px-3 rounded-lg transition-all duration-300 flex items-center justify-center space-x-1 work-sans-semibold ${
                activeTab === 'grocery'
                  ? 'bg-white text-orange-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('grocery')}
            >
              <span className="text-base">🛒</span>
              <span className="text-xs">Grocery</span>
            </button>
          </div>

          {/* Search Bar - Mobile Optimized */}
          <div className="mb-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder={
                  activeTab === 'food'
                    ? '🔍 Search restaurants, cuisines...'
                    : '🔍 Search grocery items...'
                }
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
            
            {/* Category Filter for Grocery */}
            {activeTab === 'grocery' && availableCategories.length > 1 && (
              <div className="mt-3">
                <div className="flex space-x-1.5 overflow-x-auto pb-2 category-scroll">
                  {availableCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs work-sans-medium transition-all duration-200 ${
                        selectedCategory === category
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Search Results Info */}
            {searchQuery && (
              <div className="mt-2 text-xs text-gray-600 work-sans-medium text-pretty bg-blue-50 px-3 py-1.5 rounded-lg">
                {activeTab === 'food' ? (
                  <span>
                    Found <strong className="text-orange-600">{foodRestaurants.length}</strong> restaurant(s) matching "<strong>{searchQuery}</strong>"
                  </span>
                ) : (
                  <span>
                    Found <strong className="text-orange-600">{filteredGroceryItems.length}</strong> item(s) matching "<strong>{searchQuery}</strong>"
                    {selectedCategory !== 'All' && ` in ${selectedCategory}`}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Mixed Cart Warning */}
          {isMixedCart && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-xs work-sans-medium text-pretty leading-relaxed flex items-center">
                <span className="text-base mr-1.5">⚠️</span>
                You have {cartType} items in your cart. Adding {activeTab} items will clear your current cart.
              </p>
            </div>
          )}

          {/* Results Count */}
          {/* <div className="mb-3">
            <p className="text-gray-700 text-xs work-sans-semibold text-pretty">
              {activeTab === 'food' 
                ? `🍽️ ${foodRestaurants.length} ${foodRestaurants.length === 1 ? 'Restaurant' : 'Restaurants'} Available`
                : `🛒 ${filteredGroceryItems.length} ${filteredGroceryItems.length === 1 ? 'Item' : 'Items'} Available`
              }
              {activeTab === 'grocery' && selectedCategory !== 'All' && ` in ${selectedCategory}`}
            </p>
          </div> */}

          {/* ✅ MOBILE-OPTIMIZED FOOD SECTION */}
          {activeTab === 'food' && (
            <div className="space-y-3 pb-4">
              {foodRestaurants.length > 0 ? (
                foodRestaurants.map((restaurant, index) => {
                  const imageToUse = getRestaurantImage(restaurant, index);
                  const isOpen = isRestaurantOpen(restaurant);
                  const isFeatured = restaurant.featured;
                  const isVerified = restaurant.verified;
                  const nextOpening = getNextOpeningTime(restaurant);

                  return (
                    <Link
                      key={restaurant.id}
                      to={isOpen ? `/restaurant/${restaurant.id}` : '#'}
                      state={{ image: imageToUse }}
                      className={`block bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 restaurant-card border border-gray-100 relative ${
                        !isOpen ? 'restaurant-closed' : ''
                      }`}
                      onClick={(e) => !isOpen && e.preventDefault()}
                    >
                      {/* Featured Badge */}
                      {isFeatured && (
                        <div className="featured-badge">
                          ⭐ Featured
                        </div>
                      )}

                      {/* Status Badge */}
                      {!isOpen && (
                        <div className="status-badge">
                          🔒 Closed
                        </div>
                      )}

                      <div className="flex p-3">
                        {/* Restaurant Image */}
                        <div className="w-20 h-20 flex-shrink-0 relative">
                          <div className="image-container">
                            <img
                              src={imageToUse}
                              alt={restaurant.name}
                              className={!isOpen ? 'grayscale' : ''}
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
                              <span className="text-xl">🍽️</span>
                            </div>
                          </div>
                          
                          {/* Opening Time for Closed Restaurants */}
                          {!isOpen && (
                            <div className="opening-time">
                              {nextOpening}
                            </div>
                          )}
                        </div>

                        {/* Restaurant Details */}
                        <div className="pl-3 flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="text-sm work-sans-bold text-gray-900 text-pretty leading-tight break-words flex-1">
                              {restaurant.name || 'Unnamed Restaurant'}
                              {isVerified && (
                                <span className="verified-badge ml-1" title="Verified Restaurant">
                                  ✓
                                </span>
                              )}
                            </h3>
                          </div>

                          {/* Cuisine and Tags */}
                          <p className="text-gray-600 text-xs work-sans-medium mb-1 text-pretty leading-relaxed break-words">
                            {restaurant.cuisine || 'Various Cuisine'}
                          </p>

                          {/* Tags */}
                          {restaurant.tags && restaurant.tags.length > 0 && (
                            <div className="flex flex-wrap gap-0.5 mb-2">
                              {restaurant.tags.slice(0, 3).map((tag, tagIndex) => (
                                <span
                                  key={tagIndex}
                                  className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full text-xs work-sans-medium"
                                >
                                  {tag}
                                </span>
                              ))}
                              {restaurant.tags.length > 3 && (
                                <span className="bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded-full text-xs work-sans-medium">
                                  +{restaurant.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Rating and Delivery Info */}
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-yellow-500 text-xs flex items-center work-sans-semibold">
                                ⭐ {restaurant.rating || '4.0'} 
                                {restaurant.totalRatings > 0 && (
                                  <span className="text-gray-500 ml-0.5 text-xs">
                                    ({restaurant.totalRatings})
                                  </span>
                                )}
                              </span>
                              <span className="text-gray-600 text-xs work-sans-medium">
                                ⏱️ {restaurant.preparationTime || '25-30 min'}
                              </span>
                            </div>
                          </div>

                          {/* Service Availability */}
                          {/* <div className="flex items-center gap-1 mb-1">
                            {restaurant.deliveryAvailable && (
                              <span className="service-badge bg-green-100 text-green-700">🚚</span>
                            )}
                            {restaurant.takeawayAvailable && (
                              <span className="service-badge bg-blue-100 text-blue-700">📦</span>
                            )}
                            {restaurant.dineInAvailable && (
                              <span className="service-badge bg-purple-100 text-purple-700">🍽️</span>
                            )}
                          </div> */}

                          {/* Pricing Info */}
                          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                            {isMinOrderEnabled && currentMinOrder > 0 && (
                              <p className="text-xs text-gray-500 work-sans-medium">
                                Min: <strong className="text-gray-700">₹{currentMinOrder}</strong>
                              </p>
                            )}
                            {restaurant.deliveryFee > 0 && (
                              <p className="text-xs text-gray-500 work-sans-medium">
                                Delivery: <strong className="text-gray-700">₹{restaurant.deliveryFee}</strong>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Closed Overlay Message */}
                      {!isOpen && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 rounded-xl bg-black bg-opacity-40">
                          <div className="bg-white px-3 py-2 rounded-lg shadow-md text-center">
                            <div className="text-sm work-sans-bold text-gray-900 mb-0.5">Currently Closed</div>
                            <div className="text-xs work-sans-medium text-gray-600">{nextOpening}</div>
                          </div>
                        </div>
                      )}
                    </Link>
                  );
                })
              ) : (
                <div className="text-center py-12 px-3">
                  <div className="text-gray-300 text-5xl mb-3">🍽️</div>
                  <p className="text-gray-500 text-sm work-sans-medium text-pretty mb-2">
                    {searchQuery ? 'No restaurants found' : 'No restaurants available'}
                  </p>
                  {searchQuery && (
                    <p className="text-gray-400 text-xs work-sans-medium text-pretty mb-4">
                      Try adjusting your search terms or browse all restaurants
                    </p>
                  )}
                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600 work-sans-semibold transition-all hover:scale-105"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ✅ MOBILE-OPTIMIZED GROCERY SECTION */}
          {activeTab === 'grocery' && (
            <div className="grid grid-cols-2 gap-3 pb-4">
              {filteredGroceryItems.length > 0 ? (
                filteredGroceryItems.map((item) => {
                  const quantity = getGroceryItemQuantity(item.id);
                  const hasImage = item.image && item.image.trim() !== '';
                  const isOutOfStock = item.stock <= 0;
                  const displayQuantity = `${item.quantity || 1} ${item.unit || 'pc'}`;

                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all border ${
                        isOutOfStock ? 'border-gray-200 opacity-60' : 'border-gray-100 hover:border-orange-200'
                      } p-3 flex flex-col relative`}
                    >
                      {/* Out of Stock Badge */}
                      {isOutOfStock && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs work-sans-bold z-10">
                          Out of Stock
                        </div>
                      )}

                      {/* Item Image */}
                      <div className="image-container mb-2">
                        {hasImage ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className={isOutOfStock ? 'grayscale' : ''}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const nextSibling = e.target.nextElementSibling;
                              if (nextSibling) {
                                nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        {(!hasImage || isOutOfStock) && (
                          <div className={`image-placeholder ${isOutOfStock ? 'grayscale' : ''}`}>
                            <span className="text-2xl">🛒</span>
                          </div>
                        )}
                      </div>

                      {/* Item Details */}
                      <h3 className={`text-sm work-sans-semibold mb-1 text-pretty leading-tight break-words flex-1 ${
                        isOutOfStock ? 'text-gray-500' : 'text-gray-900'
                      }`}>
                        {item.name}
                      </h3>
                      
                      {/* Category */}
                      {item.category && (
                        <div className="mb-2">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full work-sans-medium break-words inline-block">
                            {item.category}
                          </span>
                        </div>
                      )}

                      {/* Quantity and Price */}
                      <div className="mb-2">
                        <p className="text-xs text-gray-600 work-sans-medium mb-0.5">
                          {displayQuantity}
                        </p>
                        <p className={`work-sans-bold text-base ${
                          isOutOfStock ? 'text-gray-500' : 'text-gray-900'
                        }`}>
                          ₹{item.price}
                        </p>
                      </div>

                      {/* Stock Info */}
                      {!isOutOfStock && item.stock < 10 && (
                        <p className="text-xs text-orange-600 work-sans-medium mb-2">
                          Only {item.stock} left!
                        </p>
                      )}

                      {/* Add to Cart / Quantity Controls */}
                      {isOutOfStock ? (
                        <button
                          disabled
                          className="bg-gray-200 text-gray-500 px-2 py-2 rounded-lg text-xs w-full work-sans-semibold cursor-not-allowed"
                        >
                          Out of Stock
                        </button>
                      ) : quantity === 0 ? (
                        <button
                          onClick={() => handleGroceryAddToCart(item)}
                          className="bg-orange-500 text-white px-2 py-2 rounded-lg text-xs hover:bg-orange-600 w-full transition-all work-sans-semibold whitespace-nowrap hover:scale-[1.02]"
                        >
                          Add to Cart
                        </button>
                      ) : (
                        <div className="flex justify-between items-center w-full bg-orange-50 rounded-lg p-1.5">
                          <button
                            onClick={() => handleGroceryUpdateQuantity(item.id, quantity - 1)}
                            className="bg-white px-2 py-0.5 rounded text-xs hover:bg-gray-50 transition-all min-w-[28px] work-sans-bold flex items-center justify-center hover:scale-105"
                          >
                            −
                          </button>
                          <span className="work-sans-bold text-gray-800 text-sm mx-1 min-w-[20px] text-center">
                            {quantity}
                          </span>
                          <button
                            onClick={() => handleGroceryUpdateQuantity(item.id, quantity + 1)}
                            disabled={quantity >= item.stock}
                            className={`px-2 py-0.5 rounded text-xs transition-all min-w-[28px] work-sans-bold flex items-center justify-center ${
                              quantity >= item.stock
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-white hover:bg-gray-50 hover:scale-105'
                            }`}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 text-center py-12 px-3">
                  <div className="text-gray-300 text-5xl mb-3">
                    {selectedCategory === 'All' ? '🛒' : '🔍'}
                  </div>
                  <p className="text-gray-500 text-sm work-sans-medium text-pretty mb-2">
                    {searchQuery 
                      ? 'No items found'
                      : selectedCategory !== 'All'
                      ? `No items available in ${selectedCategory}`
                      : 'No grocery items available'
                    }
                  </p>
                  <p className="text-gray-400 text-xs work-sans-medium text-pretty mb-4">
                    {searchQuery 
                      ? 'Try adjusting your search terms'
                      : selectedCategory !== 'All'
                      ? 'Try selecting a different category'
                      : 'Check back later for new items'
                    }
                  </p>
                  {(searchQuery || selectedCategory !== 'All') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('All');
                      }}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600 work-sans-semibold transition-all hover:scale-105"
                    >
                      {searchQuery && selectedCategory !== 'All' 
                        ? 'Clear All Filters' 
                        : searchQuery 
                        ? 'Clear Search' 
                        : 'Show All Categories'
                      }
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enhanced View Cart Button - FIXED POSITIONING */}
        {showViewCartButton && (
          <div className="fixed bottom-20 left-0 right-0 z-30 px-3">
            <div className="container mx-auto">
              <button
                onClick={handleViewCart}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 work-sans-semibold flex justify-between items-center hover:scale-[1.02]"
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
      </div>
    </>
  );
};

export default Home;