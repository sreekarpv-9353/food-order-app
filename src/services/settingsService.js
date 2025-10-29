// src/services/settingsService.js (Updated with customer support)
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const DELIVERY_SETTINGS_DOC = 'deliverySettings';
const CUSTOMER_SUPPORT_DOC = 'customerSupport';
const COLLECTION = 'appSettings';

// Default settings (fallback if Firestore is not available)
const defaultSettings = {
  groceryMinOrderValue: 100,
  foodMinOrderValue: 50,
  deliveryFeeGrocery: 20,
  deliveryFeeFood: 30,
  taxPercentage: 5,
  isGroceryMinOrderEnabled: true,
  isFoodMinOrderEnabled: true,
  deliveryZones: []
};

// Default customer support settings
const defaultCustomerSupport = {
  phone: '+91-9876543210',
  email: 'support@quickbite.com',
  hours: '9:00 AM - 9:00 PM',
  whatsapp: '+91-9876543210',
  isActive: true
};

export const settingsService = {
  // Get all delivery settings
  getSettings: async () => {
    try {
      const docRef = doc(db, COLLECTION, DELIVERY_SETTINGS_DOC);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { ...defaultSettings, ...docSnap.data() };
      } else {
        console.log('Delivery settings not found, using defaults');
        return defaultSettings;
      }
    } catch (error) {
      console.error('Error getting delivery settings:', error);
      return defaultSettings;
    }
  },

  // Get customer support settings
  getCustomerSupport: async () => {
    try {
      const docRef = doc(db, COLLECTION, CUSTOMER_SUPPORT_DOC);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { ...defaultCustomerSupport, ...docSnap.data() };
      } else {
        console.log('Customer support settings not found, using defaults');
        return defaultCustomerSupport;
      }
    } catch (error) {
      console.error('Error getting customer support settings:', error);
      return defaultCustomerSupport;
    }
  },

  // Save customer support settings
  saveCustomerSupport: async (supportSettings) => {
    try {
      const docRef = doc(db, COLLECTION, CUSTOMER_SUPPORT_DOC);
      await setDoc(docRef, supportSettings, { merge: true });
      console.log('Customer support settings saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving customer support settings:', error);
      throw error;
    }
  },

  // Get minimum order settings
  getMinimumOrderSettings: async () => {
    try {
      const settings = await settingsService.getSettings();
      return {
        enabled: true, // Always enabled for now
        grocery: settings.groceryMinOrderValue,
        food: settings.foodMinOrderValue,
        default: Math.min(settings.groceryMinOrderValue, settings.foodMinOrderValue)
      };
    } catch (error) {
      console.error('Error getting minimum order settings:', error);
      return {
        enabled: true,
        grocery: 100,
        food: 50,
        default: 50
      };
    }
  },

  // Enhanced zone matching with village/town priority
  findDeliveryZone: async (zipCode, city = null, villageTown = null) => {
    const settings = await settingsService.getSettings();
    const activeZones = settings.deliveryZones?.filter(zone => zone.isActive) || [];
    
    console.log('Matching parameters:', { zipCode, city, villageTown });
    console.log('Available zones:', activeZones.map(z => ({ name: z.name, zipCodes: z.zipCodes })));

    // Priority 1: Exact ZIP code match with village/town name
    if (zipCode && villageTown) {
      const villageZipMatch = activeZones.find(zone => {
        const hasZipCode = zone.zipCodes && zone.zipCodes.includes(zipCode);
        const zoneNameLower = zone.name.toLowerCase();
        const villageLower = villageTown.toLowerCase();
        
        const nameMatches = zoneNameLower === villageLower || 
                           zoneNameLower.includes(villageLower) || 
                           villageLower.includes(zoneNameLower);
        
        return hasZipCode && nameMatches;
      });
      if (villageZipMatch) {
        console.log('Priority 1 match: Village + ZIP code');
        return { zone: villageZipMatch, matchType: 'exact' };
      }
    }

    // Priority 2: Village/Town name match (most important for rural areas)
    if (villageTown) {
      const villageMatch = activeZones.find(zone => {
        const zoneNameLower = zone.name.toLowerCase();
        const villageLower = villageTown.toLowerCase();
        
        // Check for exact match or partial match
        const exactMatch = zoneNameLower === villageLower;
        const partialMatch = zoneNameLower.includes(villageLower) || 
                           villageLower.includes(zoneNameLower);
        
        // Also check if zone name contains common village/town suffixes
        const commonSuffixes = ['palli', 'palli', 'palle', 'peta', 'pet', 'pur', 'puram', 'nagar', 'colony'];
        const hasCommonSuffix = commonSuffixes.some(suffix => 
          zoneNameLower.includes(suffix) && villageLower.includes(suffix)
        );
        
        return exactMatch || partialMatch || hasCommonSuffix;
      });
      if (villageMatch) {
        console.log('Priority 2 match: Village name');
        return { zone: villageMatch, matchType: 'village' };
      }
    }

    // Priority 3: ZIP code match only
    if (zipCode) {
      const zipCodeMatch = activeZones.find(zone => 
        zone.zipCodes && zone.zipCodes.includes(zipCode)
      );
      if (zipCodeMatch) {
        console.log('Priority 3 match: ZIP code only');
        return { zone: zipCodeMatch, matchType: 'pincode' };
      }
    }

    // Priority 4: City name match
    if (city) {
      const cityMatch = activeZones.find(zone => {
        const zoneNameLower = zone.name.toLowerCase();
        const cityLower = city.toLowerCase();
        
        return zoneNameLower === cityLower || 
               zoneNameLower.includes(cityLower) || 
               cityLower.includes(zoneNameLower);
      });
      if (cityMatch) {
        console.log('Priority 4 match: City name');
        return { zone: cityMatch, matchType: 'city' };
      }
    }

    console.log('No zone match found, using default');
    return { zone: null, matchType: 'none' };
  },

  // Get delivery fee based on zone with enhanced matching
  getDeliveryFee: async (orderType, zipCode = null, city = null, villageTown = null) => {
    const settings = await settingsService.getSettings();
    
    // If location data provided, try to find zone-specific fee with enhanced matching
    if (zipCode || villageTown || city) {
      const { zone, matchType } = await settingsService.findDeliveryZone(zipCode, city, villageTown);
      if (zone) {
        console.log(`Using delivery fee from zone: ${zone.name} (${matchType} match)`);
        return {
          fee: orderType === 'grocery' ? zone.deliveryFeeGrocery : zone.deliveryFeeFood,
          zone: zone,
          matchType: matchType
        };
      }
    }
    
    // Fallback to default fees
    console.log('Using default delivery fee');
    return {
      fee: orderType === 'grocery' ? settings.deliveryFeeGrocery : settings.deliveryFeeFood,
      zone: null,
      matchType: 'default'
    };
  },

  // Get minimum order value based on zone with enhanced matching
  getMinOrderValue: async (orderType, zipCode = null, city = null, villageTown = null) => {
    const settings = await settingsService.getSettings();
    
    // Check if minimum order is enabled globally
    if (orderType === 'grocery' && !settings.isGroceryMinOrderEnabled) return 0;
    if (orderType === 'food' && !settings.isFoodMinOrderEnabled) return 0;
    
    // If location data provided, try to find zone-specific minimum with enhanced matching
    if (zipCode || villageTown || city) {
      const { zone } = await settingsService.findDeliveryZone(zipCode, city, villageTown);
      if (zone) {
        return orderType === 'grocery' ? zone.minOrderGrocery : zone.minOrderFood;
      }
    }
    
    // Fallback to default minimums
    return orderType === 'grocery' ? settings.groceryMinOrderValue : settings.foodMinOrderValue;
  },

  // Check if order meets minimum value with enhanced zone support
  validateOrder: async (orderType, subtotal, zipCode = null, city = null, villageTown = null) => {
    const minValue = await settingsService.getMinOrderValue(orderType, zipCode, city, villageTown);
    const isEnabled = orderType === 'grocery' 
      ? (await settingsService.getSettings()).isGroceryMinOrderEnabled
      : (await settingsService.getSettings()).isFoodMinOrderEnabled;

    if (!isEnabled) return { valid: true, isEnabled: false };

    return {
      valid: subtotal >= minValue,
      minValue: minValue,
      currentValue: subtotal,
      shortBy: Math.max(0, minValue - subtotal),
      isEnabled: true
    };
  },

  // Check if delivery is available with enhanced matching
  isDeliveryAvailable: async (zipCode, city = null, villageTown = null) => {
    if (!zipCode && !villageTown && !city) return false;
    const { zone } = await settingsService.findDeliveryZone(zipCode, city, villageTown);
    return !!zone;
  },

  // Get delivery time estimate with enhanced matching
  getDeliveryTime: async (zipCode, city = null, villageTown = null) => {
    const { zone } = await settingsService.findDeliveryZone(zipCode, city, villageTown);
    return zone?.deliveryTime || '30-45 min'; // Default fallback
  },

  // Get zone name for display with enhanced matching
  getZoneName: async (zipCode, city = null, villageTown = null) => {
    const { zone } = await settingsService.findDeliveryZone(zipCode, city, villageTown);
    return zone?.name || 'Standard Delivery';
  },

  // Get matched zone details for display
  getMatchedZoneDetails: async (zipCode, city = null, villageTown = null) => {
    const { zone, matchType } = await settingsService.findDeliveryZone(zipCode, city, villageTown);
    if (!zone) return null;
    
    return {
      name: zone.name,
      deliveryTime: zone.deliveryTime,
      deliveryFeeGrocery: zone.deliveryFeeGrocery,
      deliveryFeeFood: zone.deliveryFeeFood,
      minOrderGrocery: zone.minOrderGrocery,
      minOrderFood: zone.minOrderFood,
      matchType: matchType
    };
  },

  // Calculate tax
  calculateTax: async (subtotal) => {
    const settings = await settingsService.getSettings();
    return (subtotal * (settings.taxPercentage || 5)) / 100;
  },

  // Get all active zones for display
  getActiveZones: async () => {
    const settings = await settingsService.getSettings();
    return settings.deliveryZones?.filter(zone => zone.isActive) || [];
  },

  // Get formatted customer support information
  getFormattedCustomerSupport: async () => {
    const support = await settingsService.getCustomerSupport();
    
    if (!support.isActive) {
      return {
        isActive: false,
        message: 'Customer support is currently unavailable'
      };
    }

    return {
      isActive: true,
      phone: support.phone,
      email: support.email,
      hours: support.hours,
      whatsapp: support.whatsapp,
      formattedPhone: support.phone.replace(/\D/g, ''), // Remove non-numeric characters for tel: links
      formattedWhatsApp: support.whatsapp.replace(/\D/g, '') // Remove non-numeric characters for WhatsApp links
    };
  },

  // Validate customer support settings
  validateCustomerSupport: (supportSettings) => {
    const errors = [];
    
    if (!supportSettings.phone?.trim()) {
      errors.push('Phone number is required');
    }
    
    if (!supportSettings.email?.trim()) {
      errors.push('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(supportSettings.email)) {
      errors.push('Valid email is required');
    }
    
    if (!supportSettings.hours?.trim()) {
      errors.push('Support hours are required');
    }
    
    return errors;
  }
};