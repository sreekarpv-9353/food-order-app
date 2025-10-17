// src/pages/Home.js
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchRestaurants } from '../redux/slices/restaurantSlice';
import { fetchGroceryItems } from '../redux/slices/grocerySlice';
import { addToCart, updateQuantity, removeFromCart } from '../redux/slices/cartSlice';
import Loader from '../components/Loader';

// ✅ Import restaurant images
import rest1 from '../assets/rest1.jpg';
import rest2 from '../assets/rest2.png';
import rest3 from '../assets/rest3.png';

const Home = () => {
  const [activeTab, setActiveTab] = useState('food');
  const [searchQuery, setSearchQuery] = useState('');
  
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
    <div className="container mx-auto px-4 py-8">
      {/* Header with Title and Refresh */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {activeTab === 'food' ? 'Food Delivery' : 'Grocery Delivery'}
        </h1>
        <button
          onClick={refreshData}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'food'
              ? 'border-b-2 border-orange-500 text-orange-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('food')}
        >
          🍽️ Food
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'grocery'
              ? 'border-b-2 border-orange-500 text-orange-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('grocery')}
        >
          🛒 Grocery
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6 mx-8">
        <div className="relative w-full">
          <input
            type="text"
            placeholder={
              activeTab === 'food'
                ? 'Search restaurants by name or cuisine...'
                : 'Search grocery items by name or category...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-12 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
          <div className="mt-2 text-sm text-gray-600">
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
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            ⚠️ You have {cartType} items in your cart. Adding {activeTab} items will clear your current cart.
          </p>
        </div>
      )}

      {/* ✅ FOOD SECTION */}
      {activeTab === 'food' && (
        <div>
          <p className="text-gray-600 mb-4">
            Showing {foodRestaurants.length} {foodRestaurants.length === 1 ? 'restaurant' : 'restaurants'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {foodRestaurants.length > 0 ? (
              foodRestaurants.map((restaurant, index) => {
                // Get consistent image for this restaurant
                const imageToUse = getRestaurantImage(restaurant.id, index);

                return (
                  <Link
                    key={restaurant.id}
                    to={`/restaurant/${restaurant.id}`}
                    state={{ image: imageToUse }}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100"
                  >
                    <img
                      src={imageToUse}
                      alt={restaurant.name}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                      }}
                    />
                    <div className="p-4">
                      <h3 className="text-xl font-semibold mb-2">
                        {restaurant.name || 'Unnamed Restaurant'}
                      </h3>
                      <p className="text-gray-600 mb-2">
                        {restaurant.cuisine || 'Various Cuisine'}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-yellow-500">
                          ⭐ {restaurant.rating || '4.2'}
                        </span>
                        <span className="text-gray-600">
                          {restaurant.deliveryTime || '30 min'}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="col-span-3 text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <p className="text-gray-500 text-lg mb-2">
                  {searchQuery ? 'No restaurants found' : 'No restaurants available'}
                </p>
                {searchQuery && (
                  <p className="text-gray-400 text-sm mb-4">
                    Try adjusting your search or browse all restaurants
                  </p>
                )}
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ✅ GROCERY SECTION */}
      {activeTab === 'grocery' && (
        <div>
          <p className="text-gray-600 mb-4">
            Showing {filteredGroceryItems.length} {filteredGroceryItems.length === 1 ? 'item' : 'items'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroceryItems.length > 0 ? (
              filteredGroceryItems.map((item) => {
                const quantity = getGroceryItemQuantity(item.id);
                const hasImage = item.imageUrl && item.imageUrl.trim() !== '';

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100 p-4 flex flex-col items-center"
                  >
                    {hasImage ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-40 object-cover mb-4 rounded"
                        onError={(e) => (e.target.style.display = 'none')}
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-40 mb-4 bg-gradient-to-br from-green-50 to-green-100 text-6xl rounded">
                        {item.unicode || '🛒'}
                      </div>
                    )}

                    <h3 className="text-lg font-semibold mb-2 text-center">{item.name}</h3>
                    
                    {item.category && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full mb-2">
                        {item.category}
                      </span>
                    )}
                    
                    <p className="text-gray-600 mb-3 font-medium">₹{item.price}</p>

                    {quantity === 0 ? (
                      <button
                        onClick={() => handleGroceryAddToCart(item)}
                        className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 w-full transition-colors"
                      >
                        Add to Cart
                      </button>
                    ) : (
                      <div className="flex justify-between items-center w-full bg-orange-50 rounded-lg p-2">
                        <button
                          onClick={() => handleGroceryUpdateQuantity(item.id, quantity - 1)}
                          className="bg-white px-3 py-1 rounded shadow hover:bg-gray-50 transition-colors"
                        >
                          −
                        </button>
                        <span className="font-bold text-gray-800">{quantity}</span>
                        <button
                          onClick={() => handleGroceryUpdateQuantity(item.id, quantity + 1)}
                          className="bg-white px-3 py-1 rounded shadow hover:bg-gray-50 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="col-span-3 text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <p className="text-gray-500 text-lg mb-2">
                  {searchQuery ? 'No items found' : 'No grocery items available'}
                </p>
                {searchQuery && (
                  <p className="text-gray-400 text-sm mb-4">
                    Try adjusting your search or browse all items
                  </p>
                )}
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;