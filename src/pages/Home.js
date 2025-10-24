import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchRestaurants } from '../redux/slices/restaurantSlice';
import { fetchGroceryItems } from '../redux/slices/grocerySlice';
import { addToCart, updateQuantity, removeFromCart } from '../redux/slices/cartSlice';
import { settingsService } from '../services/settingsService';
import Loader from '../components/Loader';

// ✅ Import restaurant images
import rest1 from '../assets/rest1.jpg';
import rest2 from '../assets/rest2.png';
import rest3 from '../assets/rest3.png';

const Home = () => {
  const [activeTab, setActiveTab] = useState('food');
  const [searchQuery, setSearchQuery] = useState('');
  const [minOrderInfo, setMinOrderInfo] = useState({
    food: 0,
    grocery: 0,
    foodEnabled: false,
    groceryEnabled: false
  });
  
  const { restaurants, loading: restaurantLoading, error: restaurantError } = useSelector((state) => state.restaurant);
  const { items: groceryItems, loading: groceryLoading, error: groceryError } = useSelector((state) => state.grocery);
  const { items, type: cartType } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const restaurantImages = [rest1, rest2, rest3];

  // Create a stable mapping of restaurant IDs to images
  const getRestaurantImage = (restaurantId, index) => {
    // Use restaurant ID to consistently assign the same image
    if (restaurantId) {
      const hash = restaurantId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return restaurantImages[hash % restaurantImages.length];
    }
    // Fallback to index-based assignment
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

  // Filter grocery items based on search query
  const filteredGroceryItems = groceryItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query)
    );
  });

  const refreshData = () => {
    if (activeTab === 'food') {
      dispatch(fetchRestaurants());
    } else {
      dispatch(fetchGroceryItems());
    }
  };

  // ✅ Grocery cart handlers
  const handleGroceryAddToCart = (item) => {
    dispatch(addToCart({
      item,
      restaurantId: 'grocery-store',
      type: 'grocery'
    }));
  };

  const handleGroceryUpdateQuantity = (itemId, quantity) => {
    if (quantity === 0) {
      dispatch(removeFromCart(itemId));
    } else {
      dispatch(updateQuantity({ itemId, quantity }));
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

  // Get current minimum order info
  const currentMinOrder = activeTab === 'food' ? minOrderInfo.food : minOrderInfo.grocery;
  const isMinOrderEnabled = activeTab === 'food' ? minOrderInfo.foodEnabled : minOrderInfo.groceryEnabled;

  if (loading && restaurants.length === 0 && groceryItems.length === 0) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
        <button
          onClick={refreshData}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4">
      {/* Header with Title and Refresh */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          {activeTab === 'food' ? 'Food Delivery' : 'Grocery Delivery'}
        </h1>
        <button
          onClick={refreshData}
          className="bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Tabs - Mobile Optimized */}
      <div className="flex bg-white rounded-xl p-1 mb-4 shadow-sm border border-gray-100">
        <button
          className={`flex-1 py-3 px-4 font-medium rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
            activeTab === 'food'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('food')}
        >
          <span className="text-lg">🍽️</span>
          <span className="text-sm font-medium">Food</span>
        </button>
        <button
          className={`flex-1 py-3 px-4 font-medium rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
            activeTab === 'grocery'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('grocery')}
        >
          <span className="text-lg">🛒</span>
          <span className="text-sm font-medium">Grocery</span>
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
            className="w-full px-4 py-3 pl-12 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
          />
          {/* Search Icon */}
          <svg
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Search Results Info */}
        {searchQuery && (
          <div className="mt-2 text-xs text-gray-600">
            {activeTab === 'food' ? (
              <span>
                Found <strong>{foodRestaurants.length}</strong> restaurant(s) matching "{searchQuery}"
              </span>
            ) : (
              <span>
                Found <strong>{filteredGroceryItems.length}</strong> item(s) matching "{searchQuery}"
              </span>
            )}
          </div>
        )}
      </div>

      {/* Mixed Cart Warning */}
      {isMixedCart && (
        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-xs">
            ⚠️ You have {cartType} items in your cart. Adding {activeTab} items will clear your current cart.
          </p>
        </div>
      )}

      {/* Results Count */}
      <div className="mb-3">
        <p className="text-gray-600 text-sm">
          {activeTab === 'food' 
            ? `${foodRestaurants.length} ${foodRestaurants.length === 1 ? 'restaurant' : 'restaurants'} available`
            : `${filteredGroceryItems.length} ${filteredGroceryItems.length === 1 ? 'item' : 'items'} available`
          }
        </p>
      </div>

      {/* ✅ FOOD SECTION */}
      {activeTab === 'food' && (
        <div className="space-y-3">
          {foodRestaurants.length > 0 ? (
            foodRestaurants.map((restaurant, index) => {
              // Get consistent image for this restaurant
              const imageToUse = getRestaurantImage(restaurant.id, index);

              return (
                <Link
                  key={restaurant.id}
                  to={`/restaurant/${restaurant.id}`}
                  state={{ image: imageToUse }}
                  className="block bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow border border-gray-100"
                >
                  <div className="flex">
                    <img
                      src={imageToUse}
                      alt={restaurant.name}
                      className="w-24 h-24 object-cover flex-shrink-0"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                      }}
                    />
                    <div className="p-3 flex-1">
                      <h3 className="text-base font-semibold mb-1 line-clamp-1">
                        {restaurant.name || 'Unnamed Restaurant'}
                      </h3>
                      <p className="text-gray-600 text-xs mb-2 line-clamp-1">
                        {restaurant.cuisine || 'Various Cuisine'}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-yellow-500 text-sm flex items-center">
                          ⭐ {restaurant.rating || '4.2'}
                        </span>
                        <span className="text-gray-600 text-xs">
                          {restaurant.deliveryTime || '30 min'}
                        </span>
                      </div>
                      {isMinOrderEnabled && currentMinOrder > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
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
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-3">🔍</div>
              <p className="text-gray-500 text-base mb-2">
                {searchQuery ? 'No restaurants found' : 'No restaurants available'}
              </p>
              {searchQuery && (
                <p className="text-gray-400 text-xs mb-4">
                  Try adjusting your search
                </p>
              )}
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600"
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
        <div className="grid grid-cols-2 gap-3">
          {filteredGroceryItems.length > 0 ? (
            filteredGroceryItems.map((item) => {
              const quantity = getGroceryItemQuantity(item.id);
              const hasImage = item.imageUrl && item.imageUrl.trim() !== '';

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 p-3 flex flex-col"
                >
                  {hasImage ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-32 object-cover mb-2 rounded-lg"
                      onError={(e) => (e.target.style.display = 'none')}
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-32 mb-2 bg-gradient-to-br from-green-50 to-green-100 text-4xl rounded-lg">
                      {item.unicode || '🛒'}
                    </div>
                  )}

                  <h3 className="text-sm font-semibold mb-1 line-clamp-2 flex-1">{item.name}</h3>
                  
                  {item.category && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full mb-2 self-start">
                      {item.category}
                    </span>
                  )}
                  
                  <p className="text-gray-600 mb-2 font-medium text-sm">₹{item.price}</p>

                  {quantity === 0 ? (
                    <button
                      onClick={() => handleGroceryAddToCart(item)}
                      className="bg-orange-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-orange-600 w-full transition-colors"
                    >
                      Add to Cart
                    </button>
                  ) : (
                    <div className="flex justify-between items-center w-full bg-orange-50 rounded-lg p-1">
                      <button
                        onClick={() => handleGroceryUpdateQuantity(item.id, quantity - 1)}
                        className="bg-white px-2 py-1 rounded text-xs hover:bg-gray-50 transition-colors min-w-[30px]"
                      >
                        −
                      </button>
                      <span className="font-bold text-gray-800 text-sm mx-1">{quantity}</span>
                      <button
                        onClick={() => handleGroceryUpdateQuantity(item.id, quantity + 1)}
                        className="bg-white px-2 py-1 rounded text-xs hover:bg-gray-50 transition-colors min-w-[30px]"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="col-span-2 text-center py-8">
              <div className="text-gray-400 text-4xl mb-3">🔍</div>
              <p className="text-gray-500 text-base mb-2">
                {searchQuery ? 'No items found' : 'No grocery items available'}
              </p>
              {searchQuery && (
                <p className="text-gray-400 text-xs mb-4">
                  Try adjusting your search
                </p>
              )}
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;