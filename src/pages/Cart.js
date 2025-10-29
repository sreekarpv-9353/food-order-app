// src/pages/Cart.js
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { updateQuantity, removeFromCart, clearCart } from '../redux/slices/cartSlice';
import { placeOrder, clearError } from '../redux/slices/orderSlice';
import { settingsService } from '../services/settingsService';

const Cart = () => {
  const { items, restaurantId, type, totalAmount } = useSelector((state) => state.cart);
  const { addresses, selectedAddress } = useSelector((state) => state.address);
  const { user } = useSelector((state) => state.auth);
  const { loading, error } = useSelector((state) => state.order);
  const { restaurants } = useSelector((state) => state.restaurant);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [settings, setSettings] = useState(null);
  const [orderValidation, setOrderValidation] = useState({ 
    valid: true, 
    isEnabled: false, 
    minValue: 0, 
    shortBy: 0,
    message: ''
  });
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [deliveryTime, setDeliveryTime] = useState('');
  const [zoneName, setZoneName] = useState('');
  const [isDeliveryAvailable, setIsDeliveryAvailable] = useState(true);
  const [matchedZoneDetails, setMatchedZoneDetails] = useState(null);
  const [deliveryFeeDetails, setDeliveryFeeDetails] = useState({ fee: 0, matchType: 'default' });
  const [minimumOrderSettings, setMinimumOrderSettings] = useState(null);

  // Clear error on component mount
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Get restaurant data for food orders
  const getRestaurantData = () => {
    if (type === 'food' && restaurantId) {
      const restaurant = restaurants.find(r => r.id === restaurantId || r.restaurantid === restaurantId);
      return restaurant ? {
        name: restaurant.name,
        cuisine: restaurant.cuisine || "",
        rating: restaurant.rating || '4.2',
        deliveryTime: restaurant.deliveryTime || '30 min',
        costForTwo: restaurant.costForTwo || '250',
        image: restaurant.image || ''
      } : null;
    }
    return null;
  };

  // Load minimum order settings from app settings
  const loadMinimumOrderSettings = useCallback(async () => {
    try {
      const minOrderSettings = await settingsService.getMinimumOrderSettings();
      setMinimumOrderSettings(minOrderSettings);
      return minOrderSettings;
    } catch (error) {
      console.error('Error loading minimum order settings:', error);
      // Default fallback settings
      const defaultSettings = {
        enabled: true,
        grocery: 100,
        food: 50,
        default: 50
      };
      setMinimumOrderSettings(defaultSettings);
      return defaultSettings;
    }
  }, []);

  // Enhanced validation function with minimum order check
  const validateMinimumOrder = useCallback((orderType, amount, zoneDetails = null) => {
    // If no minimum order settings loaded yet, assume valid
    if (!minimumOrderSettings) {
      return { valid: true, isEnabled: false, minValue: 0, shortBy: 0, message: '' };
    }

    const isEnabled = minimumOrderSettings.enabled !== false;
    
    // If minimum order is disabled, return valid
    if (!isEnabled) {
      return { valid: true, isEnabled: false, minValue: 0, shortBy: 0, message: '' };
    }

    // Determine minimum value based on order type and zone
    let minValue = minimumOrderSettings.default || 0;
    
    // Priority: Zone-specific > Type-specific > Default
    if (zoneDetails && zoneDetails.minimumOrderValue) {
      minValue = zoneDetails.minimumOrderValue;
    } 
    else if (orderType === 'grocery' && minimumOrderSettings.grocery) {
      minValue = minimumOrderSettings.grocery;
    } 
    else if (orderType === 'food' && minimumOrderSettings.food) {
      minValue = minimumOrderSettings.food;
    }

    const shortBy = Math.max(0, minValue - amount);
    const valid = amount >= minValue;

    let message = '';
    if (!valid) {
      const zoneInfo = zoneName ? ` in ${zoneName}` : '';
      message = `Minimum order value for ${orderType}${zoneInfo} is ₹${minValue}. Add ₹${shortBy} more to continue.`;
    }
    else{
      setIsLoadingSettings(false)
    }

    return {
      valid,
      isEnabled: true,
      minValue,
      shortBy,
      message
    };
  }, [minimumOrderSettings, zoneName]);

  // Enhanced settings loading with minimum order validation
  const loadSettings = useCallback(async () => {
    try {
      setIsLoadingSettings(true);
      
      // Load minimum order settings first
      const minOrderSettings = await loadMinimumOrderSettings();
      
      // Load other settings
      const [settingsData] = await Promise.all([
        settingsService.getSettings(),
      ]);
      
      setSettings(settingsData);
      
      const zipCode = selectedAddress?.zipCode;
      const city = selectedAddress?.city;
      const villageTown = selectedAddress?.villageTown;
      
      if (zipCode && city) {
        // Parallel API calls for better performance
        const [
          zoneDetails,
          deliveryAvailable,
          feeResult,
          time,
          zone,
          tax
        ] = await Promise.all([
          settingsService.getMatchedZoneDetails(zipCode, city, villageTown),
          settingsService.isDeliveryAvailable(zipCode, city, villageTown),
          settingsService.getDeliveryFee(type, zipCode, city, villageTown),
          settingsService.getDeliveryTime(zipCode, city, villageTown),
          settingsService.getZoneName(zipCode, city, villageTown),
          settingsService.calculateTax(totalAmount)
        ]);
        
        setMatchedZoneDetails(zoneDetails);
        setIsDeliveryAvailable(deliveryAvailable);
        setDeliveryFee(feeResult.fee);
        setDeliveryFeeDetails(feeResult);
        setDeliveryTime(time);
        setZoneName(zone);
        setTaxAmount(tax);

        // Validate minimum order with zone details
        const validation = validateMinimumOrder(type, totalAmount, zoneDetails);
        setOrderValidation(validation);
        // setIsLoadingSettings(false)
      } else {
        // Default values when no address is selected
        const defaultFee = type === 'grocery' ? 20 : 30;
        setDeliveryFee(defaultFee);
        setDeliveryFeeDetails({ fee: defaultFee, matchType: 'default' });
        setTaxAmount(totalAmount * 0.05);
        setDeliveryTime('30-45 min');
        setZoneName('Standard Delivery');
        setIsDeliveryAvailable(true);
        
        // Validate without zone details
        const validation = validateMinimumOrder(type, totalAmount);
        setOrderValidation(validation);
        // setIsLoadingSettings(false)

      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Set default values on error
      const defaultFee = type === 'grocery' ? 20 : 30;
      setDeliveryFee(defaultFee);
      setDeliveryFeeDetails({ fee: defaultFee, matchType: 'default' });
      setTaxAmount(totalAmount * 0.05);
      setDeliveryTime('30-45 min');
      setZoneName('Standard Delivery');
      setIsDeliveryAvailable(true);
      
      // Default validation on error
      setOrderValidation({ valid: true, isEnabled: false, minValue: 0, shortBy: 0, message: '' });
    } finally {
      setIsLoadingSettings(false);
    }
  }, [type, totalAmount, selectedAddress, loadMinimumOrderSettings, validateMinimumOrder]);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Update validation when cart items or total amount changes
  useEffect(() => {
    if (minimumOrderSettings && selectedAddress) {
      const validation = validateMinimumOrder(type, totalAmount, matchedZoneDetails);
      setOrderValidation(validation);
    }
  }, [totalAmount, minimumOrderSettings, type, selectedAddress, matchedZoneDetails, validateMinimumOrder]);

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

  // Enhanced order validation with minimum order check
  const validateOrderData = () => {
    if (!user || !user.uid) {
      throw new Error('Please login to place order');
    }

    if (!selectedAddress) {
      throw new Error('Please select a delivery address');
    }

    if (!isDeliveryAvailable) {
      throw new Error('Delivery is not available to your selected address');
    }

    // Enhanced minimum order validation
    if (orderValidation.isEnabled && !orderValidation.valid) {
      throw new Error(orderValidation.message);
    }

    if (items.length === 0) {
      throw new Error('Cart cannot be empty');
    }

    // Validate address structure
    const requiredAddressFields = ['name', 'street', 'city', 'state', 'zipCode', 'phone'];
    for (const field of requiredAddressFields) {
      if (!selectedAddress[field]) {
        throw new Error(`Invalid address: Missing ${field}`);
      }
    }

    // Final safety check for minimum order
    if (minimumOrderSettings?.enabled !== false) {
      const minValue = matchedZoneDetails?.minimumOrderValue || 
        (type === 'grocery' ? minimumOrderSettings?.grocery : minimumOrderSettings?.food) || 
        minimumOrderSettings?.default || 0;
      
      if (totalAmount < minValue) {
        throw new Error(`Order total (₹${totalAmount.toFixed(2)}) is below minimum requirement of ₹${minValue}`);
      }
    }
  };

  const handlePlaceOrder = async () => {
    try {
      // Validate all data before proceeding
      validateOrderData();

      const grandTotal = totalAmount + deliveryFee + taxAmount;
      const restaurantData = getRestaurantData();
      
      console.log('🛒 [Cart] Preparing order payload...');
      
      // Create clean order payload
      const orderPayload = {
        // User & Order Info
        userId: user.uid,
        type: type,
        restaurantId: restaurantId || null,
        
        // Items
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category: item.category || '',
          image: item.image || ''
        })),
        
        // Pricing Details
        pricing: {
          itemsTotal: totalAmount,
          deliveryFee: deliveryFee,
          taxAmount: taxAmount,
          taxPercentage: settings?.taxPercentage || 5,
          grandTotal: grandTotal,
          currency: 'INR',
          meetsMinimumOrder: orderValidation.valid,
          minimumOrderRequired: orderValidation.minValue
        },
        
        // Restaurant Data (for food orders)
        ...(type === 'food' && restaurantData && { restaurant: restaurantData }),
        
        // Delivery Information
        deliveryAddress: selectedAddress,
        deliveryZone: zoneName,
        deliveryTime: deliveryTime,
        matchedZoneType: deliveryFeeDetails.matchType,
        
        // Order Status
        paymentMethod: 'COD',
        
        // Metadata
        itemCount: items.length,
        customerName: selectedAddress.name,
        customerPhone: selectedAddress.phone,
        minimumOrderValidation: orderValidation
      };

      console.log('📦 [Cart] Order payload:', orderPayload);

      // Dispatch the order
      const result = await dispatch(placeOrder(orderPayload)).unwrap();
      
      console.log('✅ [Cart] Order placed successfully:', result);
      
      // Clear cart and navigate on success
      dispatch(clearCart());
      navigate('/my-orders', { 
        state: { 
          orderSuccess: true,
          orderId: result.id 
        }
      });
      
    } catch (error) {
      console.error('❌ [Cart] Order placement failed:', error);
      
      // Get the error message safely
      const errorMessage = error?.message || 'Failed to place order. Please try again.';
      
      // Show specific error messages based on error content
      if (errorMessage.includes('Please login')) {
        alert('Please login to place order');
        navigate('/login');
      } else if (errorMessage.includes('address') || errorMessage.includes('Address')) {
        alert(errorMessage);
        navigate('/addresses');
      } else if (errorMessage.includes('Minimum order') || errorMessage.includes('minimum') || errorMessage.includes('below minimum')) {
        alert(errorMessage);
      } else if (errorMessage.includes('Delivery is not available') || errorMessage.includes('not available')) {
        alert(errorMessage);
        navigate('/addresses');
      } else if (errorMessage.includes('Cart cannot be empty')) {
        alert(errorMessage);
      } else {
        alert(errorMessage);
      }
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

  // Calculate items breakdown
  const itemsBreakdown = items.map(item => ({
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    total: item.price * item.quantity
  }));

  // Determine if button should be disabled
  const isButtonDisabled = 
    loading || 
    !selectedAddress || 
    !orderValidation.valid || 
    !isDeliveryAvailable || 
    isLoadingSettings;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4 pb-24">
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

        {/* Minimum Order Requirement Banner */}
        {orderValidation.isEnabled && (
          <div className={`mb-3 p-3 rounded-xl border ${
            orderValidation.valid 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-start">
              <span className={`text-lg mr-2 flex-shrink-0 ${
                orderValidation.valid ? 'text-green-500' : 'text-yellow-500'
              }`}>
                {orderValidation.valid ? '✅' : '⚠️'}
              </span>
              <div className="flex-1">
                <p className={`font-medium text-sm ${
                  orderValidation.valid ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  {orderValidation.valid ? 'Minimum order met!' : 'Minimum order required'}
                </p>
                <p className={`text-xs mt-1 ${
                  orderValidation.valid ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  {orderValidation.valid 
                    ? `You've reached the minimum order value of ₹${orderValidation.minValue}`
                    : `Add ₹${orderValidation.shortBy} more to reach minimum order of ₹${orderValidation.minValue}`
                  }
                </p>
                
                {/* Progress Bar */}
                {orderValidation.isEnabled && orderValidation.minValue > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Order Progress</span>
                      <span>₹{totalAmount.toFixed(0)} / ₹{orderValidation.minValue}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          orderValidation.valid ? 'bg-green-500' : 'bg-yellow-500'
                        }`}
                        style={{ 
                          width: `${Math.min(100, (totalAmount / orderValidation.minValue) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Restaurant Info for Food Orders */}
        {type === 'food' && getRestaurantData() && (
          <div className="mb-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">🍽️</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">{getRestaurantData().name}</h3>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-yellow-500 text-xs flex items-center">
                    ⭐ {getRestaurantData().rating}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {getRestaurantData().deliveryTime}
                  </span>
                  <span className="text-gray-500 text-xs">
                    ₹{getRestaurantData().costForTwo} for two
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start">
              <span className="text-red-500 text-lg mr-2 flex-shrink-0">❌</span>
              <div>
                <p className="text-red-800 font-medium text-sm">
                  Order Error
                </p>
                <p className="text-red-700 text-xs mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

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
                <p className="text-xs text-gray-600 mt-1">📞 {selectedAddress.phone}</p>
                
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

          {/* Detailed Price Breakdown */}
          <div className="border-t pt-4 space-y-2">
            {/* Items Breakdown */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700 mb-1">Items:</p>
              {itemsBreakdown.map((item, index) => (
                <div key={index} className="flex justify-between text-xs text-gray-600">
                  <span>{item.name} × {item.quantity}</span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Items Total</span>
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

            {/* Minimum Order Progress */}
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
            disabled={isButtonDisabled}
            className={`w-full py-3 rounded-xl mt-4 font-medium text-sm transition-colors ${
              isButtonDisabled
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