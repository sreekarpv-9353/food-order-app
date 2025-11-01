// src/pages/RestaurantDetail.js
import { useSelector, useDispatch } from 'react-redux';
import { addToCart, updateQuantity, removeFromCart } from '../redux/slices/cartSlice';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';

const RestaurantDetail = () => {
  const { id } = useParams();
  const { restaurants, menuItems } = useSelector((state) => state.restaurant);
  const { items, restaurantId: cartRestaurantId, type: cartType } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const passedImage = location.state?.image || null;

  console.log('RestaurantDetail - Looking for restaurant with id:', id);
  console.log('Available restaurants:', restaurants);

  // Find restaurant by ID - try both the id and restaurantid field
  const restaurant = restaurants.find(r => r.id === id || r.restaurantid === id);

  console.log('Found restaurant:', restaurant);

  // Calculate total cart items and price - ONLY for items from this restaurant
  const currentRestaurantItems = items.filter(item => 
    item.restaurantId === id || item.restaurantId === restaurant?.restaurantid
  );
  
  const cartItemCount = currentRestaurantItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = currentRestaurantItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Only show View Cart if there are items from THIS restaurant and cart type is food
  const showViewCartButton = cartItemCount > 0 && cartType === 'food' && cartRestaurantId === restaurant?.id;

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 work-sans">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">🍽️</div>
          <h2 className="text-xl work-sans-bold text-gray-900 mb-2">Restaurant not found</h2>
          <p className="text-gray-600 text-sm work-sans-medium">The restaurant you're looking for doesn't exist.</p>
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

  const handleViewCart = () => {
    navigate('/cart');
  };

  // Check if we're adding from a different restaurant
  const isDifferentRestaurant = cartRestaurantId && cartRestaurantId !== restaurant.id;

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
      
      <div className="min-h-screen bg-gray-50 pb-24 work-sans">
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
              <h1 className="text-xl work-sans-bold mb-1 text-gray-900">{restaurant.name}</h1>
              <p className="text-gray-600 text-sm mb-3 work-sans-medium">{restaurant.cuisine || 'Various Cuisine'}</p>
              
              <div className="flex justify-between items-center text-xs text-gray-500 mb-3 work-sans-medium">
                <span className="flex items-center">
                  ⭐ {restaurant.rating || '4.2'}
                </span>
                <span>{restaurant.deliveryTime || '30 min'}</span>
                <span>₹{restaurant.costForTwo || '25'} for two</span>
              </div>
              
              {isDifferentRestaurant && items.length > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-xs work-sans-medium">
                    ⚠️ You have items from another restaurant. Adding items here will clear your current cart.
                  </p>
                </div>
              )}

              {/* Show current restaurant cart info */}
              {cartItemCount > 0 && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-xs work-sans-medium">
                    ✅ You have {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} from this restaurant in your cart
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Menu Section */}
          <div className="mb-4">
            <h2 className="text-lg work-sans-bold text-gray-900">Menu</h2>
            <p className="text-gray-600 text-sm mt-1 work-sans-medium">
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
                        <h3 className="text-sm work-sans-semibold mb-1 text-gray-900">{item.name}</h3>
                        <p className="text-gray-600 work-sans-medium text-sm">₹{item.price}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-2 line-clamp-2 work-sans-medium">{item.description}</p>
                        )}
                        {quantity > 0 && (
                          <p className="text-xs text-green-600 work-sans-medium mt-2">
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
                                className="w-7 h-7 bg-white rounded flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors border border-gray-200 work-sans-bold"
                              >
                                <span className="text-sm text-gray-600">−</span>
                              </button>
                              <span className="work-sans-bold text-gray-800 min-w-6 text-center text-sm">{quantity}</span>
                              <button
                                onClick={() => handleUpdateQuantity(item.id, quantity + 1)}
                                className="w-7 h-7 bg-white rounded flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors border border-gray-200 work-sans-bold"
                              >
                                <span className="text-sm text-gray-600">+</span>
                              </button>
                            </div>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, 0)}
                              className="text-red-500 hover:text-red-700 text-xs work-sans-medium"
                            >
                              Remove
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(item)}
                            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors work-sans-semibold text-sm shadow-sm min-w-[80px]"
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
              <p className="text-gray-500 text-sm work-sans-medium">No menu items available</p>
              <p className="text-gray-400 text-xs mt-1 work-sans-medium">Check back later for updates</p>
            </div>
          )}
        </div>

        {/* View Cart Button - Fixed at bottom - Only show for current restaurant items */}
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
    </>
  );
};

export default RestaurantDetail;