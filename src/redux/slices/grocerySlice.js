// src/redux/slices/grocerySlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

export const fetchGroceryItems = createAsyncThunk(
  'grocery/fetchGroceryItems',
  async (_, { rejectWithValue }) => {
    try {
      const groceryItemsRef = collection(db, 'groceryItems');
      const groceryQuery = query(groceryItemsRef, where('isActive', '==', true));
      const grocerySnapshot = await getDocs(groceryQuery);
      
      const groceryItems = grocerySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'grocery'
      }));

      console.log('Fetched grocery items:', groceryItems);

      return {
        groceryItems,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error fetching grocery items:', error);
      return rejectWithValue(error.message);
    }
  }
);

const grocerySlice = createSlice({
  name: 'grocery',
  initialState: {
    items: [],
    loading: false,
    error: null,
    lastFetched: null
  },
  reducers: {
    clearGroceryItems: (state) => {
      state.items = [];
      state.lastFetched = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGroceryItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroceryItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.groceryItems;
        state.lastFetched = action.payload.timestamp;
        state.error = null;
      })
      .addCase(fetchGroceryItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch grocery items';
      });
  }
});

export const { clearGroceryItems } = grocerySlice.actions;
export default grocerySlice.reducer;