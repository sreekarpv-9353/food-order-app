// src/redux/slices/restaurantSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

export const fetchRestaurants = createAsyncThunk(
  'restaurant/fetchRestaurants',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Starting to fetch restaurants...');
      const restaurantsSnapshot = await getDocs(collection(db, 'restaurants'));
      console.log('Restaurants snapshot:', restaurantsSnapshot);
      
      const restaurants = restaurantsSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`Restaurant document ${doc.id}:`, data);
        
        // Handle both structures:
        // 1. If data has restaurantid field, use that as ID
        // 2. Otherwise use the document ID
        return {
          id: data.restaurantid || doc.id, // Use restaurantid if exists, else doc.id
          ...data
        };
      });

      console.log('Processed restaurants:', restaurants);

      const menuItemsSnapshot = await getDocs(collection(db, 'menuItems'));
      console.log('Menu items snapshot:', menuItemsSnapshot);
      
      const menuItems = menuItemsSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`Menu item ${doc.id}:`, data);
        return {
          id: doc.id,
          ...data
        };
      });

      console.log('Fetched menu items:', menuItems);

      return { restaurants, menuItems };
    } catch (error) {
      console.error('Error fetching data:', error);
      return rejectWithValue(error.message);
    }
  }
);

const restaurantSlice = createSlice({
  name: 'restaurant',
  initialState: {
    restaurants: [],
    menuItems: [],
    loading: false,
    error: null,
    lastFetched: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRestaurants.pending, (state) => {
        console.log('fetchRestaurants pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        console.log('fetchRestaurants fulfilled:', action.payload);
        state.loading = false;
        state.restaurants = action.payload.restaurants;
        state.menuItems = action.payload.menuItems;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        console.log('fetchRestaurants rejected:', action.payload);
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = restaurantSlice.actions;
export default restaurantSlice.reducer;