// src/redux/slices/addressSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

export const fetchUserAddresses = createAsyncThunk(
  'address/fetchUserAddresses',
  async (userId, { rejectWithValue }) => {
    try {
      const q = query(collection(db, 'addresses'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const addresses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return addresses;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addAddress = createAsyncThunk(
  'address/addAddress',
  async (addressData, { rejectWithValue }) => {
    try {
      const docRef = await addDoc(collection(db, 'addresses'), addressData);
      return { id: docRef.id, ...addressData };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const addressSlice = createSlice({
  name: 'address',
  initialState: {
    addresses: [],
    selectedAddress: null,
    loading: false,
    error: null,
  },
  reducers: {
    selectAddress: (state, action) => {
      state.selectedAddress = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserAddresses.fulfilled, (state, action) => {
        state.addresses = action.payload;
      })
      .addCase(addAddress.fulfilled, (state, action) => {
        state.addresses.push(action.payload);
      });
  },
});

export const { selectAddress, clearError } = addressSlice.actions;
export default addressSlice.reducer;