// src/redux/slices/addressSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
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
      const docRef = await addDoc(collection(db, 'addresses'), {
        ...addressData,
        createdAt: new Date().toISOString()
      });
      return { id: docRef.id, ...addressData };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateAddress = createAsyncThunk(
  'address/updateAddress',
  async ({ addressId, addressData }, { rejectWithValue }) => {
    try {
      const addressRef = doc(db, 'addresses', addressId);
      await updateDoc(addressRef, {
        ...addressData,
        updatedAt: new Date().toISOString()
      });
      return { id: addressId, ...addressData };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteAddress = createAsyncThunk(
  'address/deleteAddress',
  async (addressId, { rejectWithValue }) => {
    try {
      await deleteDoc(doc(db, 'addresses', addressId));
      return addressId;
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
    clearSelectedAddress: (state) => {
      state.selectedAddress = null;
    },
    setAddresses: (state, action) => {
      state.addresses = action.payload;
    },
    clearAddresses: (state) => {
      state.addresses = [];
      state.selectedAddress = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setDefaultAddress: (state, action) => {
      // Remove default from all addresses
      state.addresses = state.addresses.map(addr => ({
        ...addr,
        isDefault: false
      }));
      // Set the selected address as default
      const address = state.addresses.find(addr => addr.id === action.payload);
      if (address) {
        address.isDefault = true;
        state.selectedAddress = address;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch User Addresses
      .addCase(fetchUserAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = action.payload;
        // Auto-select the default address if exists
        const defaultAddress = action.payload.find(addr => addr.isDefault);
        if (defaultAddress) {
          state.selectedAddress = defaultAddress;
        }
      })
      .addCase(fetchUserAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Address
      .addCase(addAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses.push(action.payload);
        // Auto-select if it's the first address or marked as default
        if (state.addresses.length === 1 || action.payload.isDefault) {
          state.selectedAddress = action.payload;
        }
      })
      .addCase(addAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Address
      .addCase(updateAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.addresses.findIndex(addr => addr.id === action.payload.id);
        if (index !== -1) {
          state.addresses[index] = action.payload;
          // Update selected address if it's the one being edited
          if (state.selectedAddress?.id === action.payload.id) {
            state.selectedAddress = action.payload;
          }
        }
      })
      .addCase(updateAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Address
      .addCase(deleteAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = state.addresses.filter(addr => addr.id !== action.payload);
        // Clear selected address if it was deleted
        if (state.selectedAddress?.id === action.payload) {
          state.selectedAddress = null;
        }
      })
      .addCase(deleteAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  selectAddress, 
  clearSelectedAddress, 
  setAddresses, 
  clearAddresses, 
  clearError,
  setDefaultAddress 
} = addressSlice.actions;

export default addressSlice.reducer;