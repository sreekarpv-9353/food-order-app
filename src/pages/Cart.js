// src/pages/Cart.js
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateQuantity, removeFromCart, clearCart } from '../redux/slices/cartSlice';
import { placeOrder } from '../redux/slices/orderSlice';

const Cart = () => {
  const { items, restaurantId, type, totalAmount } = useSelector((state) => state.cart);
  const { addresses, selectedAddress } = useSelector((state) => state.address);
  const { user } = useSelector((state) => state.auth);
  const { loading } = useSelector((state) => state.order);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <button
          onClick={() => navigate('/')}
          className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  const handleQuantityChange = (itemId, newQuantity) => {
    dispatch(updateQuantity({ itemId, quantity: newQuantity }));
  };

  const handleRemoveItem = (itemId) => {
    dispatch(removeFromCart(itemId));
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert('Please select a delivery address');
      navigate('/addresses');
      return;
    }

    try {
      // Include orderType in the order data
      await dispatch(placeOrder({
        userId: user.uid,
        items,
        restaurantId,
        type, // This is the cart type (food/grocery)
        orderType: type, // Explicitly set orderType for clarity
        totalAmount,
        deliveryAddress: selectedAddress,
        status: 'pending',
        paymentMethod: 'COD',
        createdAt: new Date().toISOString()
      })).unwrap();
      
      dispatch(clearCart());
      navigate('/my-orders');
    } catch (error) {
      console.error('Order placement failed:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  // Display appropriate cart title based on type
  const cartTitle = type === 'grocery' ? 'Grocery Cart' : 'Food Cart';
  const cartIcon = type === 'grocery' ? '🛒' : '🍽️';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <span className="text-3xl mr-3">{cartIcon}</span>
        <h1 className="text-3xl font-bold">{cartTitle}</h1>
      </div>

      {/* Order Type Badge */}
      <div className="mb-4">
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
          type === 'grocery' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-orange-100 text-orange-800'
        }`}>
          {type === 'grocery' ? 'Grocery Order' : 'Food Order'}
        </span>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-lg shadow-md p-4 mb-4 flex justify-between items-center">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{item.name}</h3>
                <p className="text-gray-600">₹{item.price}</p>
                {item.category && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded mt-1 inline-block">
                    {item.category}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                  className="bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-300"
                >
                  -
                </button>
                <span className="font-semibold w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                  className="bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-300"
                >
                  +
                </button>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-red-500 hover:text-red-700 ml-4"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Delivery Address</h3>
              {selectedAddress ? (
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">{selectedAddress.name}</p>
                  <p className="text-sm text-gray-600">{selectedAddress.street}</p>
                  <p className="text-sm text-gray-600">
                    {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}
                  </p>
                  <p className="text-sm text-gray-600">{selectedAddress.phone}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-600 mb-2">No address selected</p>
              )}
              <button
                onClick={() => navigate('/addresses')}
                className="text-orange-500 hover:text-orange-600 text-sm mt-2"
              >
                {selectedAddress ? 'Change Address' : '+ Add Delivery Address'}
              </button>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Delivery Fee</span>
                <span>₹{type === 'grocery' ? '20.00' : '30.00'}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{(totalAmount + (type === 'grocery' ? 20 : 30)).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading || !selectedAddress}
              className="w-full bg-orange-500 text-white py-3 rounded hover:bg-orange-600 disabled:opacity-50 mt-4"
            >
              {loading ? 'Placing Order...' : 'Place Order (COD)'}
            </button>

            {!selectedAddress && (
              <p className="text-red-500 text-sm mt-2 text-center">
                Please select a delivery address to continue
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;