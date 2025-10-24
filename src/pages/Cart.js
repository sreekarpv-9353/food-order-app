// src/pages/Cart.js
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { updateQuantity, removeFromCart, clearCart } from '../redux/slices/cartSlice';
import { placeOrder } from '../redux/slices/orderSlice';
import { settingsService } from '../services/settingsService';

const Cart = () => {
  const { items, restaurantId, type, totalAmount } = useSelector((state) => state.cart);
  const { addresses, selectedAddress } = useSelector((state) => state.address);
  const { user } = useSelector((state) => state.auth);
  const { loading } = useSelector((state) => state.order);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [settings, setSettings] = useState(null);
  const [orderValidation, setOrderValidation] = useState({ valid: true });
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [deliveryTime, setDeliveryTime] = useState('');
  const [zoneName, setZoneName] = useState('');
  const [isDeliveryAvailable, setIsDeliveryAvailable] = useState(true);
  const [matchedZoneDetails, setMatchedZoneDetails] = useState(null);
  const [deliveryFeeDetails, setDeliveryFeeDetails] = useState({ fee: 0, matchType: 'default' });

  useEffect(() => {
    loadSettings();
  }, [type, totalAmount, selectedAddress]);
// In the loadSettings function of Cart component, update this part:
const loadSettings = async () => {
  try {
    setIsLoadingSettings(true);
    const settingsData = await settingsService.getSettings();
    setSettings(settingsData);
    
    const zipCode = selectedAddress?.zipCode;
    const city = selectedAddress?.city; // Use city field
    const villageTown = selectedAddress?.villageTown; // Use villageTown field
    
    console.log('Address details for matching:', {
      zipCode,
      city, 
      villageTown,
      fullAddress: selectedAddress
    });
    
    // Get matched zone details - pass all three fields
    const zoneDetails = await settingsService.getMatchedZoneDetails(zipCode, city, villageTown);
    setMatchedZoneDetails(zoneDetails);
    
    // Check delivery availability
    const deliveryAvailable = await settingsService.isDeliveryAvailable(zipCode, city, villageTown);
    setIsDeliveryAvailable(deliveryAvailable);
    
    // Validate order with zone-specific minimum
    const validation = await settingsService.validateOrder(type, totalAmount, zipCode, city, villageTown);
    setOrderValidation(validation);
    
    // Get zone-specific delivery fee
    const feeResult = await settingsService.getDeliveryFee(type, zipCode, city, villageTown);
    setDeliveryFee(feeResult.fee);
    setDeliveryFeeDetails(feeResult);
    
    // Get delivery time and zone name
    const time = await settingsService.getDeliveryTime(zipCode, city, villageTown);
    const zone = await settingsService.getZoneName(zipCode, city, villageTown);
    setDeliveryTime(time);
    setZoneName(zone);
    
    // Calculate tax
    const tax = await settingsService.calculateTax(totalAmount);
    setTaxAmount(tax);
  } catch (error) {
    console.error('Error loading settings:', error);
    // Set default values if settings fail to load
    setDeliveryFee(type === 'grocery' ? 20 : 30);
    setDeliveryFeeDetails({ fee: type === 'grocery' ? 20 : 30, matchType: 'default' });
    setTaxAmount(totalAmount * 0.05);
    setOrderValidation({ valid: true });
    setDeliveryTime('30-45 min');
    setZoneName('Standard Delivery');
    setIsDeliveryAvailable(true);
    setMatchedZoneDetails(null);
  } finally {
    setIsLoadingSettings(false);
  }
};

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
    if (newQuantity < 1) {
      dispatch(removeFromCart(itemId));
    } else {
      dispatch(updateQuantity({ itemId, quantity: newQuantity }));
    }
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

    if (!isDeliveryAvailable) {
      alert('Delivery is not available to your selected address. Please choose a different address.');
      navigate('/addresses');
      return;
    }

    if (!orderValidation.valid) {
      alert(`Minimum order value for ${type} in ${zoneName} is ₹${orderValidation.minValue}. Please add more items.`);
      return;
    }

    try {
      const grandTotal = totalAmount + deliveryFee + taxAmount;
      
      await dispatch(placeOrder({
        userId: user.uid,
        items,
        restaurantId,
        type,
        orderType: type,
        totalAmount: grandTotal,
        subtotal: totalAmount,
        deliveryFee,
        taxAmount,
        taxPercentage: settings?.taxPercentage || 5,
        deliveryAddress: selectedAddress,
        deliveryZone: zoneName,
        deliveryTime: deliveryTime,
        matchedZoneType: deliveryFeeDetails.matchType,
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

  const grandTotal = totalAmount + deliveryFee + taxAmount;
  const progressPercentage = orderValidation.minValue 
    ? Math.min(100, (totalAmount / orderValidation.minValue) * 100)
    : 100;

// Update the getMatchTypeBadge function in Cart component:
const getMatchTypeBadge = () => {
  const badges = {
    exact: { text: 'Exact Match', color: 'bg-green-100 text-green-800' },
    village: { text: 'Village Match', color: 'bg-purple-100 text-purple-800' },
    pincode: { text: 'Pincode Match', color: 'bg-blue-100 text-blue-800' },
    city: { text: 'City Match', color: 'bg-teal-100 text-teal-800' },
    default: { text: 'Standard Delivery', color: 'bg-gray-100 text-gray-800' },
    none: { text: 'Standard Delivery', color: 'bg-gray-100 text-gray-800' }
  };
  
  const matchType = deliveryFeeDetails.matchType;
  const badge = badges[matchType] || badges.default;
  
  return (
    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
      {badge.text}
    </span>
  );
};

// Update the getMatchDescription function:
const getMatchDescription = () => {
  const descriptions = {
    exact: 'Exact village and pincode match',
    village: 'Village/town name matched',
    pincode: 'Pincode matched',
    city: 'City name matched',
    default: 'Using standard delivery rates',
    none: 'Using standard delivery rates'
  };
  
  return descriptions[deliveryFeeDetails.matchType] || descriptions.default;
};

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

      {/* Delivery Availability Warning */}
      {selectedAddress && !isDeliveryAvailable && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-500 text-lg mr-2">🚫</span>
            <div>
              <p className="text-red-800 font-medium">
                Delivery not available
              </p>
              <p className="text-red-700 text-sm">
                We don't deliver to {selectedAddress.villageTown || selectedAddress.city} ({selectedAddress.zipCode}). Please select a different address.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Minimum Order Warning */}
      {!orderValidation.valid && orderValidation.isEnabled && isDeliveryAvailable && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-yellow-500 text-lg mr-2">⚠️</span>
            <div>
              <p className="text-yellow-800 font-medium">
                Minimum order value not met for {zoneName}
              </p>
              <p className="text-yellow-700 text-sm">
                You need to add items worth ₹{orderValidation.shortBy} more to place your order.
                Minimum order value for {type} in {zoneName} is ₹{orderValidation.minValue}.
              </p>
            </div>
          </div>
        </div>
      )}
      
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
                  {selectedAddress.villageTown && (
                    <p className="text-sm text-gray-600 font-medium">{selectedAddress.villageTown}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}
                  </p>
                  <p className="text-sm text-gray-600">{selectedAddress.phone}</p>
                  
                  {/* Zone Information */}
                  {isDeliveryAvailable && (
                    <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-green-700 text-sm font-medium">
                          🚚 {zoneName}
                        </p>
                        {getMatchTypeBadge()}
                      </div>
                      <p className="text-green-600 text-xs">
                        {getMatchDescription()}
                      </p>
                    </div>
                  )}
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
              
              {orderValidation.isEnabled && !orderValidation.valid && isDeliveryAvailable && (
                <div className="flex justify-between mb-2 text-yellow-600 text-sm">
                  <span>Minimum order for {zoneName}</span>
                  <span>₹{orderValidation.minValue}</span>
                </div>
              )}
              
              <div className="flex justify-between mb-2">
                <span>
                  Delivery Fee {zoneName && `(${zoneName})`}
                </span>
                <span>₹{deliveryFee.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between mb-2">
                <span>Tax ({settings?.taxPercentage || 5}%)</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>

              {/* Progress bar for minimum order */}
              {orderValidation.isEnabled && orderValidation.minValue > 0 && isDeliveryAvailable && (
                <div className="mt-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Order Progress ({zoneName})</span>
                    <span>₹{totalAmount.toFixed(2)} / ₹{orderValidation.minValue}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        orderValidation.valid ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                      style={{ 
                        width: `${progressPercentage}%` 
                      }}
                    ></div>
                  </div>
                  {!orderValidation.valid && (
                    <p className="text-yellow-600 text-xs mt-1 text-center">
                      Add ₹{orderValidation.shortBy} more to place order
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading || !selectedAddress || !orderValidation.valid || !isDeliveryAvailable || isLoadingSettings}
              className={`w-full py-3 rounded mt-4 font-medium ${
                !selectedAddress || !orderValidation.valid || !isDeliveryAvailable || isLoadingSettings
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600 transition-colors'
              }`}
            >
              {isLoadingSettings ? 'Loading...' : 
               !isDeliveryAvailable ? 'Delivery Not Available' :
               loading ? 'Placing Order...' : 
               `Place Order (COD)`}
            </button>

            {!selectedAddress && (
              <p className="text-red-500 text-sm mt-2 text-center">
                Please select a delivery address to continue
              </p>
            )}

            {selectedAddress && !isDeliveryAvailable && (
              <p className="text-red-500 text-sm mt-2 text-center">
                Delivery not available to this location
              </p>
            )}

            {selectedAddress && isDeliveryAvailable && !orderValidation.valid && orderValidation.isEnabled && (
              <p className="text-yellow-600 text-sm mt-2 text-center">
                Add ₹{orderValidation.shortBy} more to place order in {zoneName}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;