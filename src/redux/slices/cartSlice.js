// src/redux/slices/cartSlice.js
import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    restaurantId: null,
    type: null,
    totalAmount: 0,
  },
  reducers: {
    addToCart: (state, action) => {
      const { item, restaurantId, type } = action.payload;
      
      if (state.restaurantId && state.restaurantId !== restaurantId) {
        state.items = [];
        state.restaurantId = restaurantId;
        state.type = type;
      } else if (!state.restaurantId) {
        state.restaurantId = restaurantId;
        state.type = type;
      }

      const existingItem = state.items.find(i => i.id === item.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...item, quantity: 1 });
      }

      state.totalAmount = state.items.reduce((total, item) => 
        total + (item.price * item.quantity), 0
      );
    },
    updateQuantity: (state, action) => {
      const { itemId, quantity } = action.payload;
      const item = state.items.find(i => i.id === itemId);
      
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter(i => i.id !== itemId);
        } else {
          item.quantity = quantity;
        }
      }

      state.totalAmount = state.items.reduce((total, item) => 
        total + (item.price * item.quantity), 0
      );

      if (state.items.length === 0) {
        state.restaurantId = null;
        state.type = null;
      }
    },
    removeFromCart: (state, action) => {
      const itemId = action.payload;
      state.items = state.items.filter(i => i.id !== itemId);
      
      state.totalAmount = state.items.reduce((total, item) => 
        total + (item.price * item.quantity), 0
      );

      if (state.items.length === 0) {
        state.restaurantId = null;
        state.type = null;
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.restaurantId = null;
      state.type = null;
      state.totalAmount = 0;
    },
  },
});

export const { addToCart, updateQuantity, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;