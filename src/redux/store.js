// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';

import authSlice from './slices/authSlice';
import restaurantSlice from './slices/restaurantSlice';
import cartSlice from './slices/cartSlice';
import orderSlice from './slices/orderSlice';
import addressSlice from './slices/addressSlice';
import groceryReducer from './slices/grocerySlice'; // Add this import

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'restaurant', 'cart', 'address']
};

const rootReducer = combineReducers({
  auth: authSlice,
  restaurant: restaurantSlice,
  grocery: groceryReducer, // Add this line
  cart: cartSlice,
  order: orderSlice,
  address: addressSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);