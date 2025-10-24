// src/pages/Cart.js
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
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

  // Memoized settings loading function
  const loadSettings = useCallback(async () => {
    try {
      setIsLoadingSettings(true);
      const settingsData = await settingsService.getSettings();
      setSettings(settingsData);
      
      const zipCode = selectedAddress?.zipCode;
      const city = selectedAddress?.city;
      const villageTown = selectedAddress?.villageTown;
      
      // Parallel API calls for better performance
      const [
        zoneDetails,
        deliveryAvailable,
        validation,
        feeResult,
        time,
        zone,
        tax
      ] = await Promise.all([
        settingsService.getMatchedZoneDetails(zipCode, city, villageTown),
        settingsService.isDeliveryAvailable(zipCode, city, villageTown),
        settingsService.validateOrder(type, totalAmount, zipCode, city, villageTown),
        settingsService.getDeliveryFee(type, zipCode, city, villageTown),
        settingsService.getDeliveryTime(zipCode, city, villageTown),
        settingsService.getZoneName(zipCode, city, villageTown),
        settingsService.calculateTax(totalAmount)
      ]);
      
      setMatchedZoneDetails(zoneDetails);
      setIsDeliveryAvailable(deliveryAvailable);
      setOrderValidation(validation);
      setDeliveryFee(feeResult.fee);
      setDeliveryFeeDetails(feeResult);
      setDeliveryTime(time);
      setZoneName(zone);
      setTaxAmount(tax);
    } catch (error) {
      console.error('Error loading settings:', error);
      // Set default values
      const defaultFee = type === 'grocery' ? 20 : 30;
      setDeliveryFee(defaultFee);
      setDeliveryFeeDetails({ fee: defaultFee, matchType: 'default' });
      setTaxAmount(totalAmount * 0.05);
      setOrderValidation({ valid: true });
      setDeliveryTime('30-45 min');
      setZoneName('Standard Delivery');
      setIsDeliveryAvailable(true);
    } finally {
      setIsLoadingSettings(false);
    }
  }, [type, totalAmount, selectedAddress]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-gray-300 text-6xl mb-4">🛒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
          <p className="text-gray-600 text-sm mb-6">Add some delicious items to get started!</p>
          <button
            onClick={() => navigate('/')}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            Continue Shopping
          </button>
        </div>
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

  const cartTitle = type === 'grocery' ? 'Grocery Cart' : 'Food Cart';
  const cartIcon = type === 'grocery' ? '🛒' : '🍽️';

  const grandTotal = totalAmount + deliveryFee + taxAmount;
  const progressPercentage = orderValidation.minValue 
    ? Math.min(100, (totalAmount / orderValidation.minValue) * 100)
    : 100;

  const getMatchTypeBadge = () => {
    const badges = {
      exact: { text: 'Exact Match', color: 'bg-green-100 text-green-800 border border-green-200' },
      village: { text: 'Village Match', color: 'bg-purple-100 text-purple-800 border border-purple-200' },
      pincode: { text: 'Pincode Match', color: 'bg-blue-100 text-blue-800 border border-blue-200' },
      city: { text: 'City Match', color: 'bg-teal-100 text-teal-800 border border-teal-200' },
      default: { text: 'Standard', color: 'bg-gray-100 text-gray-800 border border-gray-200' },
      none: { text: 'Standard', color: 'bg-gray-100 text-gray-800 border border-gray-200' }
    };
    
    const matchType = deliveryFeeDetails.matchType;
    const badge = badges[matchType] || badges.default;
    
    return (
      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const getMatchDescription = () => {
    const descriptions = {
      exact: 'Exact village and pincode match',
      village: 'Village/town name matched',
      pincode: 'Pincode matched',
      city: 'City name matched',
      default: 'Standard delivery rates',
      none: 'Standard delivery rates'
    };
    
    return descriptions[deliveryFeeDetails.matchType] || descriptions.default;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4 pb-24"> {/* Added pb-24 for bottom bar spacing */}
        {/* Header */}
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-2">{cartIcon}</span>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{cartTitle}</h1>
            <p className="text-sm text-gray-600">
              {items.length} {items.length === 1 ? 'item' : 'items'} • ₹{totalAmount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Order Type Badge */}
        <div className="mb-3">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${
            type === 'grocery' 
              ? 'bg-green-100 text-green-800 border-green-200' 
              : 'bg-orange-100 text-orange-800 border-orange-200'
          }`}>
            {type === 'grocery' ? '🛒 Grocery Order' : '🍽️ Food Order'}
          </span>
        </div>

        {/* Delivery Availability Warning */}
        {selectedAddress && !isDeliveryAvailable && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start">
              <span className="text-red-500 text-lg mr-2 flex-shrink-0">🚫</span>
              <div>
                <p className="text-red-800 font-medium text-sm">
                  Delivery not available
                </p>
                <p className="text-red-700 text-xs mt-1">
                  We don't deliver to {selectedAddress.villageTown || selectedAddress.city} ({selectedAddress.zipCode})
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Minimum Order Warning */}
        {!orderValidation.valid && orderValidation.isEnabled && isDeliveryAvailable && (
          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-start">
              <span className="text-yellow-500 text-lg mr-2 flex-shrink-0">⚠️</span>
              <div>
                <p className="text-yellow-800 font-medium text-sm">
                  Minimum order not met
                </p>
                <p className="text-yellow-700 text-xs mt-1">
                  Add ₹{orderValidation.shortBy} more for {zoneName}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cart Items Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3">Cart Items</h2>
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
                <div className="flex justify-between items-start">
                  <div className="flex-1 mr-3">
                    <h3 className="text-base font-semibold text-gray-900 mb-1">{item.name}</h3>
                    <p className="text-gray-600 font-medium text-sm">₹{item.price}</p>
                    {item.category && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded mt-1 inline-block">
                        {item.category}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center space-x-3 bg-orange-50 px-2 py-1 rounded-lg">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="w-7 h-7 bg-white rounded flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors border border-gray-200"
                      >
                        <span className="text-sm font-bold text-gray-600">−</span>
                      </button>
                      <span className="font-bold text-gray-800 min-w-6 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="w-7 h-7 bg-white rounded flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors border border-gray-200"
                      >
                        <span className="text-sm font-bold text-gray-600">+</span>
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary Section */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-6">
          <h2 className="text-lg font-bold mb-3">Order Summary</h2>
          
          {/* Delivery Address */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-sm">Delivery Address</h3>
              <button
                onClick={() => navigate('/addresses')}
                className="text-orange-500 hover:text-orange-600 text-xs font-medium"
              >
                {selectedAddress ? 'Change' : 'Add'}
              </button>
            </div>
            
            {selectedAddress ? (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-sm">{selectedAddress.name}</p>
                <p className="text-xs text-gray-600 mt-1">{selectedAddress.street}</p>
                {selectedAddress.villageTown && (
                  <p className="text-xs text-gray-600 font-medium">{selectedAddress.villageTown}</p>
                )}
                <p className="text-xs text-gray-600">
                  {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}
                </p>
                
                {/* Zone Information */}
                {isDeliveryAvailable && (
                  <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-green-700 text-xs font-medium">
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
              <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500 text-sm">No address selected</p>
                <button
                  onClick={() => navigate('/addresses')}
                  className="text-orange-500 text-xs font-medium mt-1"
                >
                  + Add Delivery Address
                </button>
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Delivery Fee</span>
              <span>₹{deliveryFee.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Tax ({settings?.taxPercentage || 5}%)</span>
              <span>₹{taxAmount.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between font-bold text-base border-t pt-2">
              <span>Total Amount</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>

            {/* Progress bar for minimum order */}
            {orderValidation.isEnabled && orderValidation.minValue > 0 && isDeliveryAvailable && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Order Progress ({zoneName})</span>
                  <span>₹{totalAmount.toFixed(0)} / ₹{orderValidation.minValue}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
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

          {/* Place Order Button */}
          <button
            onClick={handlePlaceOrder}
            disabled={loading || !selectedAddress || !orderValidation.valid || !isDeliveryAvailable || isLoadingSettings}
            className={`w-full py-3 rounded-xl mt-4 font-medium text-sm transition-colors ${
              !selectedAddress || !orderValidation.valid || !isDeliveryAvailable || isLoadingSettings
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600 active:scale-95'
            }`}
          >
            {isLoadingSettings ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Loading...
              </div>
            ) : !isDeliveryAvailable ? (
              '🚫 Delivery Not Available'
            ) : loading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Placing Order...
              </div>
            ) : (
              `Place Order • ₹${grandTotal.toFixed(2)}`
            )}
          </button>

          {/* Helper Messages */}
          {!selectedAddress && (
            <p className="text-red-500 text-xs mt-2 text-center">
              Please select a delivery address to continue
            </p>
          )}

          {selectedAddress && !isDeliveryAvailable && (
            <p className="text-red-500 text-xs mt-2 text-center">
              Delivery not available to this location. Please change address.
            </p>
          )}

          {selectedAddress && isDeliveryAvailable && !orderValidation.valid && orderValidation.isEnabled && (
            <p className="text-yellow-600 text-xs mt-2 text-center">
              Add ₹{orderValidation.shortBy} more to place order in {zoneName}
            </p>
          )}
        </div>

        {/* Extra spacing at bottom for better scroll */}
        <div className="h-4"></div>
      </div>
    </div>
  );
};

export default Cart;