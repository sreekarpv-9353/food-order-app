// src/redux/slices/orderSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

export const placeOrder = createAsyncThunk(
  'order/placeOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      console.log('🛒 [placeOrder] Placing order with data:', {
        userId: orderData.userId,
        restaurantId: orderData.restaurantId,
        type: orderData.type,
        itemCount: orderData.items?.length
      });

      // Validate required fields
      if (!orderData.userId) {
        throw new Error('User ID is required');
      }

      if (!orderData.items || orderData.items.length === 0) {
        throw new Error('Cart cannot be empty');
      }

      // Create clean order document for Firestore
      const orderDoc = {
        // User & Order Info
        userId: orderData.userId,
        type: orderData.type || 'food',
        restaurantId: orderData.restaurantId || null,
        
        // Items
        items: orderData.items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category: item.category || '',
          image: item.image || ''
        })),
        
        // Pricing
        pricing: {
          itemsTotal: orderData.pricing?.itemsTotal || orderData.totalAmount || 0,
          deliveryFee: orderData.pricing?.deliveryFee || orderData.deliveryFee || 0,
          taxAmount: orderData.pricing?.taxAmount || orderData.taxAmount || 0,
          taxPercentage: orderData.pricing?.taxPercentage || orderData.taxPercentage || 5,
          grandTotal: orderData.pricing?.grandTotal || orderData.totalAmount || 0,
          currency: 'INR'
        },
        
        // Address & Delivery
        deliveryAddress: orderData.deliveryAddress ? {
          name: orderData.deliveryAddress.name,
          phone: orderData.deliveryAddress.phone,
          street: orderData.deliveryAddress.street,
          villageTown: orderData.deliveryAddress.villageTown,
          city: orderData.deliveryAddress.city,
          state: orderData.deliveryAddress.state,
          zipCode: orderData.deliveryAddress.zipCode,
          landmark: orderData.deliveryAddress.landmark || ''
        } : null,
        
        deliveryZone: orderData.deliveryZone || 'Standard',
        deliveryTime: orderData.deliveryTime || '30-45 min',
        
        // Restaurant Data (for food orders)
        ...(orderData.restaurant && {
          restaurant: {
            name: orderData.restaurant.name,
            cuisine: orderData.restaurant.cuisine,
            rating: orderData.restaurant.rating,
            deliveryTime: orderData.restaurant.deliveryTime,
            costForTwo: orderData.restaurant.costForTwo
          }
        }),
        
        // Order Status
        status: 'pending',
        paymentMethod: orderData.paymentMethod || 'COD',
        
        // Timestamps
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        
        // Metadata
        itemCount: orderData.items.length,
        customerName: orderData.deliveryAddress?.name || '',
        customerPhone: orderData.deliveryAddress?.phone || ''
      };

      console.log('📝 [placeOrder] Final order document:', orderDoc);

      const docRef = await addDoc(collection(db, 'orders'), orderDoc);
      
      console.log('✅ [placeOrder] Order placed successfully with ID:', docRef.id);
      return { 
        id: docRef.id, 
        ...orderDoc 
      };
    } catch (error) {
      console.error('❌ [placeOrder] Error:', error);
      return rejectWithValue(error.message || 'Failed to place order');
    }
  }
);

export const fetchUserOrders = createAsyncThunk(
  'order/fetchUserOrders',
  async (userId, { rejectWithValue }) => {
    try {
      console.log('🔍 [fetchUserOrders] Fetching orders for user:', userId);
      
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      console.log('📊 [fetchUserOrders] Orders found in Firebase:', querySnapshot.size);
      
      let orders = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({ 
          id: doc.id, 
          ...data
        });
      });
      
      // Manual sorting by createdAt
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      console.log('✅ [fetchUserOrders] Total orders fetched:', orders.length);
      return orders;
    } catch (error) {
      console.error('❌ [fetchUserOrders] Error:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const refreshUserOrders = createAsyncThunk(
  'order/refreshUserOrders',
  async (userId, { rejectWithValue }) => {
    try {
      console.log('🔄 [refreshUserOrders] Force refreshing orders for user:', userId);
      
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      console.log('📊 [refreshUserOrders] Fresh orders from Firebase:', querySnapshot.size);
      
      let orders = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({ 
          id: doc.id, 
          ...data
        });
      });
      
      // Manual sorting by createdAt
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      console.log('✅ [refreshUserOrders] Orders refreshed:', orders.length);
      return orders;
    } catch (error) {
      console.error('❌ [refreshUserOrders] Error:', error);
      return rejectWithValue(error.message);
    }
  }
);

const orderSlice = createSlice({
  name: 'order',
  initialState: {
    orders: [],
    loading: false,
    error: null,
    lastRefreshed: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    forceRefreshOrders: (state, action) => {
      state.orders = action.payload;
      state.lastRefreshed = new Date().toISOString();
    },
    clearOrders: (state) => {
      state.orders = [];
      state.lastRefreshed = null;
    },
    addOrder: (state, action) => {
      state.orders.unshift(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      // Place Order
      .addCase(placeOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orders.unshift(action.payload);
        state.lastRefreshed = new Date().toISOString();
        state.error = null;
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch User Orders
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
        state.lastRefreshed = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Refresh User Orders
      .addCase(refreshUserOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refreshUserOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
        state.lastRefreshed = new Date().toISOString();
        state.error = null;
      })
      .addCase(refreshUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, forceRefreshOrders, clearOrders, addOrder } = orderSlice.actions;
export default orderSlice.reducer;