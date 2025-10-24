// src/pages/RestaurantDetail.js
import { useSelector, useDispatch } from 'react-redux';
import { addToCart, updateQuantity, removeFromCart } from '../redux/slices/cartSlice';
import { useParams, useLocation } from 'react-router-dom';

const RestaurantDetail = () => {
  const { id } = useParams();
  const { restaurants, menuItems } = useSelector((state) => state.restaurant);
  const { items, restaurantId: cartRestaurantId } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const location = useLocation();
  const passedImage = location.state?.image || null;

  console.log('RestaurantDetail - Looking for restaurant with id:', id);
  console.log('Available restaurants:', restaurants);

  // Find restaurant by ID - try both the id and restaurantid field
  const restaurant = restaurants.find(r => r.id === id || r.restaurantid === id);

  console.log('Found restaurant:', restaurant);

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">🍽️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Restaurant not found</h2>
          <p className="text-gray-600 text-sm">The restaurant you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Find menu items for this restaurant
  const restaurantMenuItems = menuItems.filter(item => 
    item.restaurantId === id || item.restaurantId === restaurant.restaurantid
  );

  console.log('Restaurant menu items:', restaurantMenuItems);

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

  // Check if we're adding from a different restaurant
  const isDifferentRestaurant = cartRestaurantId && cartRestaurantId !== restaurant.id;

  return (
    <div className="min-h-screen bg-gray-50 pb-20"> {/* Added bottom padding for mobile */}
      <div className="container mx-auto px-4 py-4">
        {/* Restaurant Header Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4 border border-gray-100">
          {/* Restaurant Image */}
          {passedImage && (
            <div className="w-full h-48 bg-gray-100">
              <img
                src={passedImage}
                alt={restaurant.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
          
          <div className="p-4">
            <h1 className="text-xl font-bold mb-1 text-gray-900">{restaurant.name}</h1>
            <p className="text-gray-600 text-sm mb-3">{restaurant.cuisine || 'Various Cuisine'}</p>
            
            <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
              <span className="flex items-center">
                ⭐ {restaurant.rating || '4.2'}
              </span>
              <span>{restaurant.deliveryTime || '30 min'}</span>
              <span>₹{restaurant.costForTwo || '25'} for two</span>
            </div>
            
            {isDifferentRestaurant && items.length > 0 && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-xs">
                  ⚠️ You have items from another restaurant. Adding items here will clear your current cart.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Menu Section */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900">Menu</h2>
          <p className="text-gray-600 text-sm mt-1">
            {restaurantMenuItems.length} {restaurantMenuItems.length === 1 ? 'item' : 'items'} available
          </p>
        </div>
        
        {restaurantMenuItems.length > 0 ? (
          <div className="space-y-3">
            {restaurantMenuItems.map(item => {
              const quantity = getItemQuantity(item.id);
              const totalPrice = (item.price * quantity).toFixed(2);
              
              return (
                <div key={item.id} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 mr-3">
                      <h3 className="text-base font-semibold mb-1 text-gray-900">{item.name}</h3>
                      <p className="text-gray-600 font-medium text-sm">₹{item.price}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{item.description}</p>
                      )}
                      {quantity > 0 && (
                        <p className="text-xs text-green-600 font-medium mt-2">
                          Total: ₹{totalPrice}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end">
                      {quantity > 0 ? (
                        <>
                          <div className="flex items-center space-x-2 bg-orange-50 px-2 py-1 rounded-lg mb-1">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, quantity - 1)}
                              className="w-7 h-7 bg-white rounded flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors border border-gray-200"
                            >
                              <span className="text-sm font-bold text-gray-600">−</span>
                            </button>
                            <span className="font-bold text-gray-800 min-w-6 text-center text-sm">{quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, quantity + 1)}
                              className="w-7 h-7 bg-white rounded flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors border border-gray-200"
                            >
                              <span className="text-sm font-bold text-gray-600">+</span>
                            </button>
                          </div>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, 0)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm shadow-sm min-w-[80px]"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-3">📋</div>
            <p className="text-gray-500 text-base">No menu items available</p>
            <p className="text-gray-400 text-sm mt-1">Check back later for updates</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantDetail;