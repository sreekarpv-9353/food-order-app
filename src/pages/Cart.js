// src/pages/Cart.js
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { updateQuantity, removeFromCart, clearCart } from '../redux/slices/cartSlice';
import { placeOrder, clearError } from '../redux/slices/orderSlice';
import { settingsService } from '../services/settingsService';
import { groceryService } from '../services/groceryService';
import { Helmet } from 'react-helmet';

const Cart = () => {
  const { items, restaurantId, type, totalAmount } = useSelector((state) => state.cart);
  const { addresses, selectedAddress } = useSelector((state) => state.address);
  const { user } = useSelector((state) => state.auth);
  const { loading, error } = useSelector((state) => state.order);
  const { restaurants } = useSelector((state) => state.restaurant);
  const { items: groceryItems } = useSelector((state) => state.grocery);
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
  const [updatingStock, setUpdatingStock] = useState(false);

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

  // Get current stock for grocery items
  const getItemStock = (itemId) => {
    if (type === 'grocery') {
      const groceryItem = groceryItems.find(gItem => gItem.id === itemId);
      return groceryItem ? groceryItem.stock : 0;
    }
    // For food items, assume unlimited stock
    return 9999;
  };

  // Check if item is out of stock
  const isItemOutOfStock = (itemId, currentQuantity = 0) => {
    if (type === 'food') return false; // Food items don't have stock management
    
    const stock = getItemStock(itemId);
    return stock <= 0 || currentQuantity >= stock;
  };

  // Check if we can add more quantity to an item
  const canAddMoreQuantity = (itemId, currentQuantity) => {
    if (type === 'food') return true; // Food items don't have stock limits
    
    const stock = getItemStock(itemId);
    return currentQuantity < stock && stock > 0;
  };

  // Get stock information for display
  const getStockInfo = (itemId, currentQuantity) => {
    if (type === 'food') return null;
    
    const stock = getItemStock(itemId);
    if (stock <= 0) {
      return { text: 'Out of Stock', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
    } else if (stock < 5) {
      return { text: `Only ${stock} left`, color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
    } else if (currentQuantity >= stock) {
      return { text: 'Max quantity reached', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
    }
    return null;
  };

  // Function to update stock in Firebase after successful order
  const updateGroceryStock = async (orderItems) => {
    if (type !== 'grocery') return; // Only update stock for grocery orders
    
    try {
      setUpdatingStock(true);
      console.log('📦 [Cart] Updating grocery stock for order...');
      
      const stockUpdates = [];
      
      for (const item of orderItems) {
        const currentStock = getItemStock(item.id);
        const newStock = Math.max(0, currentStock - item.quantity);
        
        console.log(`🔄 [Cart] Updating stock for ${item.name}: ${currentStock} -> ${newStock}`);
        
        stockUpdates.push(
          groceryService.updateGroceryItemStock(item.id, newStock)
        );
      }
      
      // Wait for all stock updates to complete
      await Promise.all(stockUpdates);
      console.log('✅ [Cart] All grocery stock updated successfully');
      
    } catch (error) {
      console.error('❌ [Cart] Error updating grocery stock:', error);
      throw new Error('Failed to update inventory. Please contact support.');
    } finally {
      setUpdatingStock(false);
    }
  };

  // Load minimum order settings from app settings
  const loadMinimumOrderSettings = useCallback(async () => {
    try {
      const appSettings = await settingsService.getSettings();
      const minOrderSettings = {
        isFoodMinOrderEnabled: appSettings.isFoodMinOrderEnabled || false,
        isGroceryMinOrderEnabled: appSettings.isGroceryMinOrderEnabled || false,
        foodMinOrderValue: appSettings.foodMinOrderValue || 0,
        groceryMinOrderValue: appSettings.groceryMinOrderValue || 0
      };
      setMinimumOrderSettings(minOrderSettings);
      return minOrderSettings;
    } catch (error) {
      console.error('Error loading minimum order settings:', error);
      // Default fallback settings
      const defaultSettings = {
        isFoodMinOrderEnabled: false,
        isGroceryMinOrderEnabled: false,
        foodMinOrderValue: 0,
        groceryMinOrderValue: 0
      };
      setMinimumOrderSettings(defaultSettings);
      return defaultSettings;
    }
  }, []);

  // Enhanced validation function with minimum order check
  const validateMinimumOrder = useCallback((orderType, amount, zoneDetails = null) => {
    // If no minimum order settings loaded yet, assume valid
    if (!minimumOrderSettings) {
       setIsLoadingSettings(false)
      return { valid: true, isEnabled: false, minValue: 0, shortBy: 0, message: '' };
    }

    // Check if minimum order is enabled for this order type
    const isEnabled = orderType === 'food' 
      ? minimumOrderSettings.isFoodMinOrderEnabled
      : minimumOrderSettings.isGroceryMinOrderEnabled;
    
    // If minimum order is disabled, return valid
    if (!isEnabled) {
      setIsLoadingSettings(false)
      return { valid: true, isEnabled: false, minValue: 0, shortBy: 0, message: '' };
    }

    // Determine minimum value based on order type
    const minValue = orderType === 'food' 
      ? minimumOrderSettings.foodMinOrderValue 
      : minimumOrderSettings.groceryMinOrderValue;

    const shortBy = Math.max(0, minValue - amount);
    const valid = amount >= minValue;

    let message = '';
    if (!valid) {
      message = `Minimum order value for ${orderType} is ₹${minValue}. Add ₹${shortBy} more to continue.`;
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
  }, [minimumOrderSettings]);

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

  // Determine if we should show minimum order info
  const shouldShowMinOrderInfo = orderValidation.isEnabled && !orderValidation.valid;

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 work-sans">
        <div className="text-center">
          <div className="text-gray-300 text-6xl mb-4">🛒</div>
          <h2 className="text-xl work-sans-bold text-gray-900 mb-3">Your cart is empty</h2>
          <p className="text-gray-600 text-sm mb-6 work-sans-medium">Add some delicious items to get started!</p>
          <button
            onClick={() => navigate('/')}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors work-sans-medium"
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
      // Check stock before updating quantity for grocery items
      if (type === 'grocery') {
        const stock = getItemStock(itemId);
        if (newQuantity > stock) {
          // Don't allow increasing beyond available stock
          return;
        }
      }
      dispatch(updateQuantity({ itemId, quantity: newQuantity }));
    }
  };

  const handleRemoveItem = (itemId) => {
    dispatch(removeFromCart(itemId));
  };

  // Enhanced order validation with minimum order check and stock validation
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

    // Validate stock for grocery items
    if (type === 'grocery') {
      const outOfStockItems = items.filter(item => {
        const stock = getItemStock(item.id);
        return stock <= 0;
      });

      if (outOfStockItems.length > 0) {
        const itemNames = outOfStockItems.map(item => item.name).join(', ');
        throw new Error(`Some items are out of stock: ${itemNames}. Please remove them to continue.`);
      }

      // Check if any items exceed available stock
      const exceededStockItems = items.filter(item => {
        const stock = getItemStock(item.id);
        return item.quantity > stock;
      });

      if (exceededStockItems.length > 0) {
        const itemNames = exceededStockItems.map(item => item.name).join(', ');
        throw new Error(`Quantity exceeded for: ${itemNames}. Available stock has changed.`);
      }
    }

    // Validate address structure
    const requiredAddressFields = ['name', 'street', 'city', 'state', 'zipCode', 'phone'];
    for (const field of requiredAddressFields) {
      if (!selectedAddress[field]) {
        throw new Error(`Invalid address: Missing ${field}`);
      }
    }

    // Final safety check for minimum order
    if (minimumOrderSettings) {
      const isEnabled = type === 'food' 
        ? minimumOrderSettings.isFoodMinOrderEnabled
        : minimumOrderSettings.isGroceryMinOrderEnabled;
      
      if (isEnabled) {
        const minValue = type === 'food' 
          ? minimumOrderSettings.foodMinOrderValue
          : minimumOrderSettings.groceryMinOrderValue;
        
        if (totalAmount < minValue) {
          throw new Error(`Order total (₹${totalAmount.toFixed(2)}) is below minimum requirement of ₹${minValue}`);
        }
      }
    }
  };

  // Helper function to clean address data and remove undefined fields
  const cleanAddressData = (address) => {
    if (!address) return null;
    
    const cleaned = { ...address };
    
    // Remove undefined, null, or empty string fields
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === undefined || cleaned[key] === null || cleaned[key] === '') {
        delete cleaned[key];
      }
    });

    // Ensure required fields exist with defaults if needed
    return {
      name: cleaned.name || '',
      street: cleaned.street || '',
      city: cleaned.city || '',
      state: cleaned.state || '',
      zipCode: cleaned.zipCode || '',
      phone: cleaned.phone || '',
      // Optional fields - only include if they exist
      ...(cleaned.villageTown && { villageTown: cleaned.villageTown }),
      ...(cleaned.landmark && { landmark: cleaned.landmark }),
      ...(cleaned.addressType && { addressType: cleaned.addressType })
    };
  };

  // Helper function to clean item data
  const cleanItemData = (item) => {
    const cleaned = {
      id: item.id || '',
      name: item.name || '',
      price: item.price || 0,
      quantity: item.quantity || 1,
      // Optional fields - only include if they exist
      ...(item.category && { category: item.category }),
      ...(item.image && { image: item.image }),
      ...(item.unit && { unit: item.unit }),
      ...(item.displayQuantity && { displayQuantity: item.displayQuantity })
    };

    // Remove any undefined values that might have slipped through
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === undefined) {
        delete cleaned[key];
      }
    });

    return cleaned;
  };

  const handlePlaceOrder = async () => {
    try {
      // Validate all data before proceeding
      validateOrderData();

      const grandTotal = totalAmount + deliveryFee + taxAmount;
      const restaurantData = getRestaurantData();
      
      console.log('🛒 [Cart] Preparing order payload...');
      
      // Clean the address data to remove undefined fields
      const cleanedAddress = cleanAddressData(selectedAddress);
      
      // Clean all items data
      const cleanedItems = items.map(item => cleanItemData(item));
      
      // Create clean order payload with proper data validation
      const orderPayload = {
        // User & Order Info
        userId: user.uid,
        type: type,
        restaurantId: restaurantId || null,
        
        // Items - use cleaned items
        items: cleanedItems,
        
        // Pricing Details
        pricing: {
          itemsTotal: totalAmount || 0,
          deliveryFee: deliveryFee || 0,
          taxAmount: taxAmount || 0,
          taxPercentage: settings?.taxPercentage || 5,
          grandTotal: grandTotal || 0,
          currency: 'INR',
          meetsMinimumOrder: orderValidation.valid || false,
          minimumOrderRequired: orderValidation.minValue || 0
        },
        
        // Restaurant Data (for food orders)
        ...(type === 'food' && restaurantData && { 
          restaurant: {
            name: restaurantData.name || '',
            cuisine: restaurantData.cuisine || '',
            rating: restaurantData.rating || '4.2',
            deliveryTime: restaurantData.deliveryTime || '30 min',
            costForTwo: restaurantData.costForTwo || '250',
            ...(restaurantData.image && { image: restaurantData.image })
          }
        }),
        
        // Delivery Information - use cleaned address
        deliveryAddress: cleanedAddress,
        deliveryZone: zoneName || 'Standard Delivery',
        deliveryTime: deliveryTime || '30-45 min',
        matchedZoneType: deliveryFeeDetails.matchType || 'default',
        
        // Order Status
        paymentMethod: 'COD',
        status: 'pending',
        
        // Metadata
        itemCount: items.length || 0,
        customerName: cleanedAddress.name || '',
        customerPhone: cleanedAddress.phone || '',
        minimumOrderValidation: {
          valid: orderValidation.valid || false,
          isEnabled: orderValidation.isEnabled || false,
          minValue: orderValidation.minValue || 0,
          shortBy: orderValidation.shortBy || 0,
          message: orderValidation.message || ''
        },
        
        // Timestamps
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Final validation - remove any undefined fields from the entire payload
      const finalPayload = JSON.parse(JSON.stringify(orderPayload));
      
      console.log('📦 [Cart] Final order payload:', finalPayload);

      // Dispatch the order
      const result = await dispatch(placeOrder(finalPayload)).unwrap();
      
      console.log('✅ [Cart] Order placed successfully:', result);
      
      // Update grocery stock after successful order placement
      if (type === 'grocery') {
        await updateGroceryStock(items);
      }
      
      // Clear cart and navigate on success
      dispatch(clearCart());
      navigate('/order-success', { 
        state: { 
          orderSuccess: true,
          orderId: result.id,
          orderType: type,
          grandTotal: grandTotal,
          estimatedTime: deliveryTime
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
      } else if (errorMessage.includes('out of stock') || errorMessage.includes('stock') || errorMessage.includes('exceeded')) {
        alert(errorMessage);
      } else if (errorMessage.includes('inventory') || errorMessage.includes('stock update')) {
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
      <span className={`inline-block px-2 py-1 rounded-full text-xs work-sans-medium ${badge.color}`}>
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
    total: item.price * item.quantity,
    displayQuantity: item.displayQuantity || `${item.quantity || 1} ${item.unit || 'pc'}`,
    image: item.image,
    category: item.category
  }));

  // Determine if button should be disabled
  const isButtonDisabled = 
    loading || 
    !selectedAddress || 
    !orderValidation.valid || 
    !isDeliveryAvailable || 
    isLoadingSettings ||
    updatingStock;

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
      
      <div className="min-h-screen bg-gray-50 work-sans">
        <div className="container mx-auto px-4 py-4 pb-24">
          {/* Header */}
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-2">{cartIcon}</span>
            <div>
              <h1 className="text-xl work-sans-bold text-gray-900">{cartTitle}</h1>
              <p className="text-sm text-gray-600 work-sans-medium">
                {items.length} {items.length === 1 ? 'item' : 'items'} • ₹{totalAmount.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Order Type Badge */}
          <div className="mb-3">
            <span className={`inline-block px-3 py-1 rounded-full text-xs work-sans-medium border ${
              type === 'grocery' 
                ? 'bg-green-100 text-green-800 border-green-200' 
                : 'bg-orange-100 text-orange-800 border-orange-200'
            }`}>
              {type === 'grocery' ? '🛒 Grocery Order' : '🍽️ Food Order'}
            </span>
          </div>

          {/* Minimum Order Requirement Banner - Only show when minimum order is enabled AND NOT met */}
          {shouldShowMinOrderInfo && (
            <div className={`mb-3 p-3 rounded-xl border bg-yellow-50 border-yellow-200`}>
              <div className="flex items-start">
                <span className={`text-lg mr-2 flex-shrink-0 text-yellow-500`}>
                  ⚠️
                </span>
                <div className="flex-1">
                  <p className={`work-sans-medium text-sm text-yellow-800`}>
                    Minimum order required
                  </p>
                  <p className={`text-xs mt-1 work-sans-medium text-yellow-700`}>
                    Add ₹{orderValidation.shortBy} more to reach minimum order of ₹{orderValidation.minValue}
                  </p>
                  
                  {/* Progress Bar */}
                  {orderValidation.minValue > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1 work-sans-medium">
                        <span>Order Progress</span>
                        <span>₹{totalAmount.toFixed(0)} / ₹{orderValidation.minValue}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 bg-yellow-500`}
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
                  <h3 className="work-sans-semibold text-gray-900 text-sm">{getRestaurantData().name}</h3>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-yellow-500 text-xs flex items-center work-sans-medium">
                      ⭐ {getRestaurantData().rating}
                    </span>
                    <span className="text-gray-500 text-xs work-sans-medium">
                      {getRestaurantData().deliveryTime}
                    </span>
                    <span className="text-gray-500 text-xs work-sans-medium">
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
                  <p className="text-red-800 work-sans-medium text-sm">
                    Order Error
                  </p>
                  <p className="text-red-700 text-xs mt-1 work-sans-medium">
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
                  <p className="text-red-800 work-sans-medium text-sm">
                    Delivery not available
                  </p>
                  <p className="text-red-700 text-xs mt-1 work-sans-medium">
                    We don't deliver to {selectedAddress.villageTown || selectedAddress.city} ({selectedAddress.zipCode})
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cart Items Section */}
          <div className="mb-6">
            <h2 className="text-lg work-sans-bold mb-3">Cart Items</h2>
            <div className="space-y-3">
              {items.map(item => {
                const hasImage = item.image && item.image.trim() !== '';
                const displayQuantity = item.displayQuantity || `${item.quantity || 1} ${item.unit || 'pc'}`;
                const stockInfo = getStockInfo(item.id, item.quantity);
                const isOutOfStock = isItemOutOfStock(item.id);
                const canAddMore = canAddMoreQuantity(item.id, item.quantity);
                
                return (
                  <div key={item.id} className={`bg-white rounded-xl shadow-sm p-3 border ${
                    isOutOfStock ? 'border-red-200 bg-red-50' : 'border-gray-100'
                  }`}>
                    <div className="flex gap-3">
                      {/* Item Image */}
                      <div className="flex-shrink-0">
                        {hasImage ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className={`w-16 h-16 object-cover rounded-lg ${
                              isOutOfStock ? 'grayscale opacity-60' : ''
                            }`}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const nextSibling = e.target.nextElementSibling;
                              if (nextSibling) {
                                nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : (
                          <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                            isOutOfStock 
                              ? 'bg-red-100 grayscale opacity-60' 
                              : 'bg-gradient-to-br from-green-50 to-green-100'
                          }`}>
                            <span className="text-xl">🛒</span>
                          </div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-sm work-sans-semibold mb-1 break-words leading-tight ${
                              isOutOfStock ? 'text-gray-500' : 'text-gray-900'
                            }`}>
                              {item.name}
                              {isOutOfStock && (
                                <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded work-sans-medium">
                                  Out of Stock
                                </span>
                              )}
                            </h3>
                            <p className={`work-sans-medium text-xs mb-1 ${
                              isOutOfStock ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {displayQuantity}
                            </p>
                            <p className={`work-sans-bold text-sm ${
                              isOutOfStock ? 'text-gray-400' : 'text-gray-900'
                            }`}>
                              ₹{item.price}
                            </p>
                          </div>
                          
                          {/* Quantity Controls - Hide for out-of-stock items */}
                          {!isOutOfStock ? (
                            <div className="flex flex-col items-end space-y-2 flex-shrink-0 ml-2">
                              <div className={`flex items-center space-x-2 px-2 py-1 rounded-lg bg-orange-50`}>
                                <button
                                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                  className="w-7 h-7 rounded flex items-center justify-center shadow-sm transition-colors border bg-white hover:bg-gray-50 border-gray-200 text-gray-600 work-sans-bold min-w-[28px]"
                                >
                                  <span className="text-sm">−</span>
                                </button>
                                <span className="work-sans-bold min-w-6 text-center text-sm text-gray-800">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                  disabled={!canAddMore}
                                  className={`w-7 h-7 rounded flex items-center justify-center shadow-sm transition-colors border work-sans-bold min-w-[28px] ${
                                    !canAddMore
                                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300'
                                      : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'
                                  }`}
                                >
                                  <span className="text-sm">+</span>
                                </button>
                              </div>
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-xs work-sans-medium whitespace-nowrap text-red-500 hover:text-red-700"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            /* Only show remove button for out-of-stock items */
                            <div className="flex flex-col items-end space-y-2 flex-shrink-0 ml-2">
                              <div className="flex items-center space-x-2 px-2 py-1 rounded-lg bg-gray-100 opacity-50">
                                <button
                                  disabled
                                  className="w-7 h-7 rounded flex items-center justify-center bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300 work-sans-bold min-w-[28px]"
                                >
                                  <span className="text-sm">−</span>
                                </button>
                                <span className="work-sans-bold min-w-6 text-center text-sm text-gray-500">
                                  {item.quantity}
                                </span>
                                <button
                                  disabled
                                  className="w-7 h-7 rounded flex items-center justify-center bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300 work-sans-bold min-w-[28px]"
                                >
                                  <span className="text-sm">+</span>
                                </button>
                              </div>
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-xs work-sans-medium whitespace-nowrap text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded border border-red-200"
                              >
                                Remove Out of Stock
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Stock Information and Total Price */}
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex-1">
                            {stockInfo && !isOutOfStock && (
                              <span className={`text-xs px-2 py-1 rounded work-sans-medium border ${stockInfo.bgColor} ${stockInfo.color} ${stockInfo.borderColor}`}>
                                {stockInfo.text}
                              </span>
                            )}
                          </div>
                          <p className={`work-sans-semibold text-sm ${
                            isOutOfStock ? 'text-gray-400' : 'text-gray-900'
                          }`}>
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Summary Section */}
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-6">
            <h2 className="text-lg work-sans-bold mb-3">Order Summary</h2>
            
            {/* Delivery Address */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="work-sans-semibold text-sm">Delivery Address</h3>
                <button
                  onClick={() => navigate('/addresses')}
                  className="text-orange-500 hover:text-orange-600 text-xs work-sans-medium"
                >
                  {selectedAddress ? 'Change' : 'Add'}
                </button>
              </div>
              
              {selectedAddress ? (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="work-sans-medium text-sm">{selectedAddress.name}</p>
                  <p className="text-xs text-gray-600 mt-1 work-sans-medium">{selectedAddress.street}</p>
                  {selectedAddress.villageTown && (
                    <p className="text-xs text-gray-600 work-sans-medium">{selectedAddress.villageTown}</p>
                  )}
                  <p className="text-xs text-gray-600 work-sans-medium">
                    {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}
                  </p>
                  <p className="text-xs text-gray-600 mt-1 work-sans-medium">📞 {selectedAddress.phone}</p>
                  
                  {/* Zone Information */}
                  {isDeliveryAvailable && (
                    <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-green-700 text-xs work-sans-medium">
                          🚚 {zoneName}
                        </p>
                        {getMatchTypeBadge()}
                      </div>
                      <p className="text-green-600 text-xs work-sans-medium">
                        {getMatchDescription()}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500 text-sm work-sans-medium">No address selected</p>
                  <button
                    onClick={() => navigate('/addresses')}
                    className="text-orange-500 text-xs work-sans-medium mt-1"
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
                <p className="text-sm work-sans-medium text-gray-700 mb-1">Items:</p>
                {itemsBreakdown.map((item, index) => (
                  <div key={index} className="flex justify-between text-xs text-gray-600 work-sans-medium">
                    <span className="flex-1 truncate mr-2">{item.name} × {item.quantity}</span>
                    <span className="flex-shrink-0">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between text-sm work-sans-medium">
                <span>Items Total</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-sm work-sans-medium">
                <span>Delivery Fee</span>
                <span>₹{deliveryFee.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-sm work-sans-medium">
                <span>Tax ({settings?.taxPercentage || 5}%)</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between work-sans-bold text-base border-t pt-2">
                <span>Total Amount</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>

              {/* Minimum Order Progress - Only show when minimum order is enabled AND NOT met */}
              {shouldShowMinOrderInfo && orderValidation.minValue > 0 && isDeliveryAvailable && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1 work-sans-medium">
                    <span>Order Progress ({zoneName})</span>
                    <span>₹{totalAmount.toFixed(0)} / ₹{orderValidation.minValue}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 bg-yellow-500`}
                      style={{ 
                        width: `${progressPercentage}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-yellow-600 text-xs mt-1 text-center work-sans-medium">
                    Add ₹{orderValidation.shortBy} more to place order
                  </p>
                </div>
              )}
            </div>

            {/* Place Order Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={isButtonDisabled}
              className={`w-full py-3 rounded-xl mt-4 text-sm transition-colors work-sans-semibold ${
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
              ) : loading || updatingStock ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {updatingStock ? 'Updating Inventory...' : 'Placing Order...'}
                </div>
              ) : (
                `Place Order • ₹${grandTotal.toFixed(2)}`
              )}
            </button>

            {/* Helper Messages */}
            {!selectedAddress && (
              <p className="text-red-500 text-xs mt-2 text-center work-sans-medium">
                Please select a delivery address to continue
              </p>
            )}

            {selectedAddress && !isDeliveryAvailable && (
              <p className="text-red-500 text-xs mt-2 text-center work-sans-medium">
                Delivery not available to this location. Please change address.
              </p>
            )}

            {selectedAddress && isDeliveryAvailable && shouldShowMinOrderInfo && (
              <p className="text-yellow-600 text-xs mt-2 text-center work-sans-medium">
                Add ₹{orderValidation.shortBy} more to place order in {zoneName}
              </p>
            )}
          </div>

          {/* Extra spacing at bottom for better scroll */}
          <div className="h-4"></div>
        </div>
      </div>
    </>
  );
};

export default Cart;