// src/pages/Addresses.js
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { fetchUserAddresses, addAddress, selectAddress, setAddresses } from '../redux/slices/addressSlice';

const Addresses = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    type: 'home',
    villageTown: ''
  });
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const { addresses, selectedAddress, loading, error } = useSelector((state) => state.address);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Function to fetch addresses directly from Firebase
  const fetchAddressesFromFirebase = async (userId) => {
    try {
      setLoadingAddresses(true);
      const addressesRef = collection(db, 'addresses');
      const q = query(addressesRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const addressesData = [];
      querySnapshot.forEach((doc) => {
        addressesData.push({
          id: doc.id,
          ...doc.data()
        });
      });

      dispatch(setAddresses(addressesData));
      return addressesData;
    } catch (error) {
      console.error('Error fetching addresses from Firebase:', error);
      throw error;
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    const loadAddresses = async () => {
      if (user) {
        try {
          if (addresses.length === 0) {
            await fetchAddressesFromFirebase(user.uid);
          }
        } catch (error) {
          console.error('Error loading addresses:', error);
        }
      }
    };

    loadAddresses();
  }, [user]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(addAddress({
        ...formData,
        userId: user.uid,
        isDefault: addresses.length === 0
      })).unwrap();
      
      setFormData({
        name: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        phone: '',
        type: 'home',
        villageTown: ''
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error adding address:', error);
    }
  };

  const handleSelectAddress = (address) => {
    dispatch(selectAddress(address));
  };

  const handleUseInCheckout = () => {
    if (selectedAddress) {
      navigate('/cart');
    }
  };

  const handleRefreshAddresses = async () => {
    if (user) {
      try {
        await fetchAddressesFromFirebase(user.uid);
      } catch (error) {
        console.error('Error refreshing addresses:', error);
      }
    }
  };

  const isLoading = loading || loadingAddresses;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="container mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Addresses</h1>
            <p className="text-sm text-gray-600 mt-1">
              {addresses.length} {addresses.length === 1 ? 'address' : 'addresses'} saved
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleRefreshAddresses}
              disabled={isLoading}
              className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              <svg 
                className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              {showForm ? 'Cancel' : 'Add New'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-700 text-sm">Error loading addresses</p>
            </div>
          </div>
        )}

        {/* Add Address Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-100">
            <h2 className="text-lg font-semibold mb-4">Add New Address</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="House no., Building, Street"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Village/Town *
                  </label>
                  <input
                    type="text"
                    name="villageTown"
                    value={formData.villageTown}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter village or town name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="State"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="ZIP Code"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Type
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="home">🏠 Home</option>
                      <option value="work">💼 Work</option>
                      <option value="other">📦 Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading State */}
        {isLoading && addresses.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-gray-600">Loading addresses...</span>
          </div>
        ) : (
          <>
            {/* Addresses List */}
            <div className="space-y-3">
              {addresses.map(address => (
                <div
                  key={address.id}
                  className={`bg-white rounded-xl p-4 border-2 transition-all ${
                    selectedAddress?.id === address.id 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="font-semibold text-gray-900 text-base">{address.name}</h3>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          address.type === 'home' ? 'bg-blue-100 text-blue-800' :
                          address.type === 'work' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {address.type === 'home' ? '🏠 Home' : 
                           address.type === 'work' ? '💼 Work' : '📦 Other'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="font-medium">{address.street}</p>
                        {address.villageTown && (
                          <p>{address.villageTown}</p>
                        )}
                        <p>{address.city}, {address.state} - {address.zipCode}</p>
                        <p className="text-orange-600 font-medium">📞 {address.phone}</p>
                      </div>

                      {selectedAddress?.id === address.id && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <button
                            onClick={handleUseInCheckout}
                            className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm"
                          >
                            Use This Address
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-3 flex-shrink-0">
                      <input
                        type="radio"
                        name="selectedAddress"
                        checked={selectedAddress?.id === address.id}
                        onChange={() => handleSelectAddress(address)}
                        className="h-5 w-5 text-orange-500 focus:ring-orange-400 border-gray-300"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {addresses.length === 0 && !showForm && !isLoading && (
              <div className="text-center py-12">
                <div className="text-gray-300 text-6xl mb-4">🏠</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No addresses saved</h3>
                <p className="text-gray-600 text-sm mb-6 max-w-sm mx-auto">
                  Add your delivery address to get started with your orders
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
                >
                  Add Your First Address
                </button>
              </div>
            )}
          </>
        )}

        {/* Selected Address Bottom Bar */}
        {selectedAddress && !isLoading && (
          <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
            <div className="container mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">
                    {selectedAddress.name}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {selectedAddress.villageTown ? `${selectedAddress.villageTown}, ` : ''}{selectedAddress.street}
                  </p>
                </div>
                <button
                  onClick={handleUseInCheckout}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium whitespace-nowrap ml-3"
                >
                  Use Address
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Addresses;