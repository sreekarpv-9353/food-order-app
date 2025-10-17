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
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Restaurant not found</h2>
        <p className="text-gray-600 mt-2">ID: {id}</p>
        <p className="text-gray-600">Available restaurants: {restaurants.length}</p>
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
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
        {/* <img
          src={restaurant.image || 'https://via.placeholder.com/800x400?text=No+Image'}
          alt={restaurant.name}
          className="w-full h-64 object-cover"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/800x400?text=No+Image';
          }}
        /> */}
         {/* <div className="w-full h-full object-contain bg-gray-100">
          <img
            src={passedImage || restaurant.image || 'https://via.placeholder.com/800x400?text=No+Image'}
            alt={restaurant.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/800x400?text=No+Image';
            }}
          />
        </div> */}
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
          <p className="text-gray-600 mb-4">{restaurant.cuisine || 'Various Cuisine'}</p>
          <div className="flex space-x-6 text-sm text-gray-500">
            <span>⭐ {restaurant.rating || '4.2'}</span>
            <span>{restaurant.deliveryTime || '30 min'}</span>
            <span>₹{restaurant.costForTwo || '25'} for two</span>
          </div>
          
          {isDifferentRestaurant && items.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800 text-sm">
                ⚠️ You have items from another restaurant in your cart. Adding items from here will clear your current cart.
              </p>
            </div>
          )}
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">Menu</h2>
      
      {restaurantMenuItems.length > 0 ? (
        <div className="grid gap-4">
          {restaurantMenuItems.map(item => {
            const quantity = getItemQuantity(item.id);
            const totalPrice = (item.price * quantity).toFixed(2);
            
            return (
              <div key={item.id} className="bg-white rounded-lg shadow-md p-6 flex justify-between items-center hover:shadow-lg transition-shadow">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{item.name}</h3>
                  <p className="text-gray-600 font-medium">₹{item.price}</p>
                  {item.description && (
                    <p className="text-sm text-gray-500 mt-2">{item.description}</p>
                  )}
                  {quantity > 0 && (
                    <p className="text-sm text-green-600 font-medium mt-1">
                      Total: ${totalPrice}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  {quantity > 0 ? (
                    <>
                      <div className="flex items-center space-x-3 bg-orange-50 px-3 py-2 rounded-full">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, quantity - 1)}
                          className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors border border-gray-200"
                        >
                          <span className="text-lg font-bold text-gray-600">−</span>
                        </button>
                        <span className="font-bold text-gray-800 min-w-8 text-center">{quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, quantity + 1)}
                          className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors border border-gray-200"
                        >
                          <span className="text-lg font-bold text-gray-600">+</span>
                        </button>
                      </div>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, 0)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium shadow-sm"
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No menu items found for this restaurant</p>
        </div>
      )}
    </div>
  );
};

export default RestaurantDetail;