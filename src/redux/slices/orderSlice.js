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
        restaurantId: orderData.restaurantId
      });

      const docRef = await addDoc(collection(db, 'orders'), {
        ...orderData,
        createdAt: new Date().toISOString(),
        status: 'pending',
        restaurantId: orderData.restaurantId,
        type: orderData.type || 'food',
        userId: orderData.userId
      });
      
      console.log('✅ [placeOrder] Order placed successfully with ID:', docRef.id);
      return { id: docRef.id, ...orderData };
    } catch (error) {
      console.error('❌ [placeOrder] Error:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserOrders = createAsyncThunk(
  'order/fetchUserOrders',
  async (userId, { rejectWithValue }) => {
    try {
      console.log('🔍 [fetchUserOrders] Fetching orders for user:', userId);
      
      // SIMPLE QUERY - NO orderBy to avoid index requirement
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userId)
        // REMOVED: orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      console.log('📊 [fetchUserOrders] Orders found in Firebase:', querySnapshot.size);
      
      let orders = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('📦 [fetchUserOrders] Order:', {
          id: doc.id,
          status: data.status,
          userId: data.userId,
          restaurantId: data.restaurantId,
          createdAt: data.createdAt
        });
        orders.push({ 
          id: doc.id, 
          ...data
        });
      });
      
      // MANUAL SORTING instead of Firestore orderBy
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
      
      // SIMPLE QUERY - NO orderBy to avoid index requirement
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userId)
        // REMOVED: orderBy('createdAt', 'desc')
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
      
      // MANUAL SORTING instead of Firestore orderBy
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

export const { clearError, forceRefreshOrders, clearOrders } = orderSlice.actions;
export default orderSlice.reducer;