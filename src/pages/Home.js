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
  const getRestaurantImage = (restaurantId, index) => {
    if (restaurantId) {
      const hash = restaurantId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return restaurantImages[hash % restaurantImages.length];
    }
    return restaurantImages[index % restaurantImages.length];
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

  // Filter restaurants based on search query
  const foodRestaurants = restaurants
    .filter((restaurant) => {
      if (restaurant.type === 'food') return true;
      if (!restaurant.type) return true;
      if (restaurant.type !== 'grocery') return true;
      return false;
    })
    .filter((restaurant) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        restaurant.name?.toLowerCase().includes(query) ||
        restaurant.cuisine?.toLowerCase().includes(query)
      );
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
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 work-sans-medium text-sm">
            Error: {error}
          </div>
          <button
            onClick={refreshData}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 work-sans-semibold text-sm"
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
              object-fit: contain; /* Changed from cover to contain */
              background-color: #f9fafb; /* Light background for transparent images */
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
          `}
        </style>
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 safe-area-bottom work-sans">
        <div className="container mx-auto px-3 pt-4 pb-2 safe-area-top">
          {/* Header with Title and Refresh */}
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-lg work-sans-bold text-gray-900 text-balance mt-1">
              {activeTab === 'food' ? 'Food Delivery' : 'Grocery Delivery'}
            </h1>
            <button
              onClick={refreshData}
              disabled={refreshing}
              className={`bg-orange-500 text-white p-2 rounded-full transition-colors work-sans-medium flex-shrink-0 ml-2 mt-1 ${
                refreshing ? 'opacity-75 cursor-not-allowed' : 'hover:bg-orange-600'
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
          <div className="flex bg-white rounded-xl p-1 mb-4 shadow-sm border border-gray-100">
            <button
              className={`flex-1 py-2 px-2 rounded-lg transition-all duration-200 flex items-center justify-center space-x-1 work-sans-medium ${
                activeTab === 'food'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('food')}
            >
              <span className="text-sm">🍽️</span>
              <span className="text-xs whitespace-nowrap">Food</span>
            </button>
            <button
              className={`flex-1 py-2 px-2 rounded-lg transition-all duration-200 flex items-center justify-center space-x-1 work-sans-medium ${
                activeTab === 'grocery'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('grocery')}
            >
              <span className="text-sm">🛒</span>
              <span className="text-xs whitespace-nowrap">Grocery</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder={
                  activeTab === 'food'
                    ? 'Search restaurants...'
                    : 'Search grocery items...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-3 pl-10 pr-8 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm work-sans-medium"
              />
              {/* Search Icon */}
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {/* Clear Button */}
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                <div className="flex space-x-2 overflow-x-auto pb-2 category-scroll">
                  {availableCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs work-sans-medium transition-all duration-200 ${
                        selectedCategory === category
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
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
              <div className="mt-2 text-xs text-gray-600 work-sans-medium text-pretty">
                {activeTab === 'food' ? (
                  <span>
                    Found <strong>{foodRestaurants.length}</strong> restaurant(s) matching "{searchQuery}"
                  </span>
                ) : (
                  <span>
                    Found <strong>{filteredGroceryItems.length}</strong> item(s) matching "{searchQuery}"
                    {selectedCategory !== 'All' && ` in ${selectedCategory}`}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Mixed Cart Warning */}
          {isMixedCart && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-xs work-sans-medium text-pretty leading-relaxed">
                ⚠️ You have {cartType} items in your cart. Adding {activeTab} items will clear your current cart.
              </p>
            </div>
          )}

          {/* Results Count */}
          <div className="mb-3">
            <p className="text-gray-600 text-sm work-sans-medium text-pretty">
              {activeTab === 'food' 
                ? `${foodRestaurants.length} ${foodRestaurants.length === 1 ? 'restaurant' : 'restaurants'} available`
                : `${filteredGroceryItems.length} ${filteredGroceryItems.length === 1 ? 'item' : 'items'} available`
              }
              {activeTab === 'grocery' && selectedCategory !== 'All' && ` in ${selectedCategory}`}
            </p>
          </div>

          {/* ✅ FOOD SECTION */}
          {activeTab === 'food' && (
            <div className="space-y-3 pb-4">
              {foodRestaurants.length > 0 ? (
                foodRestaurants.map((restaurant, index) => {
                  const imageToUse = getRestaurantImage(restaurant.id, index);

                  return (
                    <Link
                      key={restaurant.id}
                      to={`/restaurant/${restaurant.id}`}
                      state={{ image: imageToUse }}
                      className="block bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow border border-gray-100"
                    >
                      <div className="flex">
                        <div className="w-20 h-20 xs:w-24 xs:h-24 flex-shrink-0">
                          <div className="image-container">
                            <img
                              src={imageToUse}
                              alt={restaurant.name}
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                              }}
                            />
                          </div>
                        </div>
                        <div className="p-3 flex-1 min-w-0">
                          <h3 className="text-sm work-sans-semibold mb-1 text-pretty leading-tight break-words">
                            {restaurant.name || 'Unnamed Restaurant'}
                          </h3>
                          <p className="text-gray-600 text-xs mb-2 text-pretty leading-relaxed break-words">
                            {restaurant.cuisine || 'Various Cuisine'}
                          </p>
                          <div className="flex justify-between items-center flex-wrap gap-1">
                            <span className="text-yellow-500 text-xs flex items-center work-sans-medium whitespace-nowrap">
                              ⭐ {restaurant.rating || '4.2'}
                            </span>
                            <span className="text-gray-600 text-xs work-sans-medium whitespace-nowrap">
                              {restaurant.deliveryTime || '30 min'}
                            </span>
                          </div>
                          {isMinOrderEnabled && currentMinOrder > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <p className="text-xs text-gray-500 work-sans-medium text-pretty">
                                Min. order: <strong>₹{currentMinOrder}</strong>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="text-center py-12 px-4">
                  <div className="text-gray-400 text-4xl mb-3">🔍</div>
                  <p className="text-gray-500 text-sm mb-2 work-sans-medium text-pretty">
                    {searchQuery ? 'No restaurants found' : 'No restaurants available'}
                  </p>
                  {searchQuery && (
                    <p className="text-gray-400 text-xs mb-4 work-sans-medium text-pretty">
                      Try adjusting your search terms or browse all restaurants
                    </p>
                  )}
                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600 work-sans-semibold"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ✅ GROCERY SECTION */}
          {activeTab === 'grocery' && (
            <div className={`grid grid-cols-2 gap-3 ${showViewCartButton ? 'pb-24' : 'pb-4'}`}>
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
                        isOutOfStock ? 'border-gray-200 opacity-60' : 'border-gray-100'
                      } p-3 flex flex-col relative`}
                    >
                      {/* Out of Stock Badge */}
                      {isOutOfStock && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs work-sans-bold z-10">
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
                        isOutOfStock ? 'text-gray-500' : ''
                      }`}>
                        {item.name}
                      </h3>
                      
                      {/* Category */}
                      {item.category && (
                        <div className="mb-2">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full work-sans-medium break-words inline-block max-w-full">
                            {item.category}
                          </span>
                        </div>
                      )}

                      {/* Quantity and Price */}
                      <div className="mb-2">
                        <p className="text-xs text-gray-600 work-sans-medium">
                          {displayQuantity}
                        </p>
                        <p className={`work-sans-bold text-sm ${
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
                          className="bg-gray-300 text-gray-500 px-3 py-2 rounded-lg text-sm w-full work-sans-semibold cursor-not-allowed"
                        >
                          Out of Stock
                        </button>
                      ) : quantity === 0 ? (
                        <button
                          onClick={() => handleGroceryAddToCart(item)}
                          className="bg-orange-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-orange-600 w-full transition-colors work-sans-semibold whitespace-nowrap"
                        >
                          Add to Cart
                        </button>
                      ) : (
                        <div className="flex justify-between items-center w-full bg-orange-50 rounded-lg p-1">
                          <button
                            onClick={() => handleGroceryUpdateQuantity(item.id, quantity - 1)}
                            className="bg-white px-2 py-1 rounded text-xs hover:bg-gray-50 transition-colors min-w-[28px] work-sans-bold flex items-center justify-center"
                          >
                            −
                          </button>
                          <span className="work-sans-bold text-gray-800 text-sm mx-1 min-w-[20px] text-center">
                            {quantity}
                          </span>
                          <button
                            onClick={() => handleGroceryUpdateQuantity(item.id, quantity + 1)}
                            disabled={quantity >= item.stock}
                            className={`px-2 py-1 rounded text-xs transition-colors min-w-[28px] work-sans-bold flex items-center justify-center ${
                              quantity >= item.stock
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-white hover:bg-gray-50'
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
                <div className="col-span-2 text-center py-12 px-4">
                  <div className="text-gray-400 text-4xl mb-3">
                    {selectedCategory === 'All' ? '🛒' : '🔍'}
                  </div>
                  <p className="text-gray-500 text-sm mb-2 work-sans-medium text-pretty">
                    {searchQuery 
                      ? 'No items found'
                      : selectedCategory !== 'All'
                      ? `No items available in ${selectedCategory}`
                      : 'No grocery items available'
                    }
                  </p>
                  <p className="text-gray-400 text-xs mb-4 work-sans-medium text-pretty">
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
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600 work-sans-semibold"
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

        {/* View Cart Button - Only shows for grocery tab when items are in cart */}
        {showViewCartButton && (
          <div className="fixed bottom-20 left-0 right-0 z-30 px-4">
            <div className="container mx-auto">
              <button
                onClick={handleViewCart}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 work-sans-semibold flex justify-between items-center"
              >
                <div className="flex items-center space-x-2">
                  <span className="bg-white bg-opacity-20 rounded-full p-1">
                    <span className="text-sm">🛒</span>
                  </span>
                  <div className="text-left">
                    <p className="text-sm work-sans-semibold">{cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}</p>
                    <p className="text-xs opacity-90 work-sans-medium">View Cart</p>
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

      {/* Mobile-specific styles */}
      <style jsx>{`
        @media (max-width: 320px) {
          .container {
            padding-left: 0.5rem;
            padding-right: 0.5rem;
          }
        }
        @media (max-width: 280px) {
          .text-xs {
            font-size: 0.65rem;
          }
          .text-sm {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </>
  );
};

export default Home;