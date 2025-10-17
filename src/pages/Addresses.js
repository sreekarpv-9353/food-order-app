// src/pages/Addresses.js
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchUserAddresses, addAddress, selectAddress } from '../redux/slices/addressSlice';

const Addresses = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    type: 'home'
  });

  const { addresses, selectedAddress, loading, error } = useSelector((state) => state.address);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      dispatch(fetchUserAddresses(user.uid));
    }
  }, [user, dispatch]);

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
        isDefault: addresses.length === 0 // Set as default if first address
      })).unwrap();
      
      setFormData({
        name: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        phone: '',
        type: 'home'
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Addresses</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
        >
          {showForm ? 'Cancel' : 'Add New Address'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Address</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="123 Main St"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="New York"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State *
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="NY"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ZIP Code *
              </label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="10001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="md:col-span-2 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
              >
                Save Address
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {addresses.map(address => (
          <div
            key={address.id}
            className={`bg-white rounded-lg shadow-md p-6 border-2 ${
              selectedAddress?.id === address.id ? 'border-orange-500' : 'border-transparent'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{address.name}</h3>
                <span className="inline-block bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs mt-1">
                  {address.type}
                </span>
              </div>
              <input
                type="radio"
                name="selectedAddress"
                checked={selectedAddress?.id === address.id}
                onChange={() => handleSelectAddress(address)}
                className="h-5 w-5 text-orange-500 focus:ring-orange-400"
              />
            </div>

            <div className="text-gray-600 space-y-1">
              <p>{address.street}</p>
              <p>{address.city}, {address.state} {address.zipCode}</p>
              <p>{address.phone}</p>
            </div>

            {selectedAddress?.id === address.id && (
              <div className="mt-4">
                <button
                  onClick={handleUseInCheckout}
                  className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600"
                >
                  Use This Address
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {addresses.length === 0 && !showForm && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No addresses saved</h3>
          <p className="text-gray-600 mb-4">Add your first delivery address to get started</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600"
          >
            Add Address
          </button>
        </div>
      )}

      {selectedAddress && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="container mx-auto flex justify-between items-center">
            <div>
              <p className="font-semibold">Selected: {selectedAddress.name}</p>
              <p className="text-sm text-gray-600">
                {selectedAddress.street}, {selectedAddress.city}
              </p>
            </div>
            <button
              onClick={handleUseInCheckout}
              className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Addresses;