// src/pages/FAQ.js
import { useState, useEffect } from 'react';
import { settingsService } from '../services/settingsService';

const FAQ = () => {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [customerSupport, setCustomerSupport] = useState({
    phone: '',
    email: '',
    hours: '9:00 AM - 9:00 PM',
    whatsapp: ''
  });
  const [loading, setLoading] = useState(true);

  const faqs = [
    {
      question: "How do I place an order?",
      answer: "Browse restaurants or grocery items, add items to your cart, select delivery address, and place your order with cash on delivery."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We currently only accept Cash on Delivery (COD) for all orders. Pay when your order arrives at your doorstep."
    },
    {
      question: "How long does delivery take?",
      answer: "Delivery times vary by restaurant and location, but typically range from 30-45 minutes for food and 45-60 minutes for groceries."
    },
    {
      question: "Can I modify my order after placing it?",
      answer: "Orders cannot be modified once placed. Please contact customer support immediately if you need to make urgent changes."
    },
    {
      question: "What if I have issues with my order?",
      answer: "Contact our customer support team through the phone number below, and we'll help resolve any issues with your order promptly."
    },
    {
      question: "Is there a minimum order value?",
      answer: "Yes, we have minimum order values to ensure efficient delivery. For food orders: ₹50, for grocery orders: ₹100. Some areas may have different minimums."
    },
    {
      question: "Do you deliver to my area?",
      answer: "We deliver to multiple zones across the city. Enter your address during checkout to check delivery availability in your area."
    },
    {
      question: "Can I schedule orders for later?",
      answer: "Currently, we only support immediate delivery. All orders are prepared and delivered as soon as possible."
    }
  ];

  useEffect(() => {
    loadCustomerSupport();
  }, []);

  const loadCustomerSupport = async () => {
    try {
      setLoading(true);
      const supportData = await settingsService.getCustomerSupport();
      setCustomerSupport(supportData);
    } catch (error) {
      console.error('Error loading customer support:', error);
      // Set default values
      setCustomerSupport({
        phone: '+91-9642120411',
        email: 'support@quickbite.com',
        hours: '9:00 AM - 9:00 PM',
        whatsapp: '+91-9642120411'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFAQ = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleCallSupport = () => {
    if (customerSupport.phone) {
      window.open(`tel:${customerSupport.phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (customerSupport.whatsapp) {
      const message = "Hello! I need help with my QuickBite order.";
      window.open(`https://wa.me/${customerSupport.whatsapp}?text=${encodeURIComponent(message)}`);
    }
  };

  const handleEmailSupport = () => {
    if (customerSupport.email) {
      window.open(`mailto:${customerSupport.email}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 safe-area-bottom">
      <div className="container mx-auto px-4 py-6 pb-20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl text-white">❓</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
            Help & Support
          </h1>
          <p className="text-gray-600 text-sm max-w-md mx-auto">
            Find answers to common questions and get support for your orders
          </p>
        </div>

        {/* Customer Support Card - Always Visible */}
        <div className="bg-gradient-to-br from-white to-orange-50/50 rounded-2xl shadow-lg border border-orange-200/50 p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-orange-100 text-orange-600 p-2 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Customer Support</h2>
              <p className="text-gray-600 text-sm">We're here to help you 24/7</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Phone Support */}
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200/60 mb-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 text-green-600 p-2 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Call Us</p>
                    <p className="text-gray-600 text-sm">{customerSupport.phone}</p>
                  </div>
                </div>
                <button
                  onClick={handleCallSupport}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-all duration-200 active:scale-95"
                >
                  Call Now
                </button>
              </div>

              {/* WhatsApp Support */}
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200/60 mb-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 text-green-600 p-2 rounded-lg">
                    <span className="text-lg">💬</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">WhatsApp</p>
                    <p className="text-gray-600 text-sm">Chat with us</p>
                  </div>
                </div>
                <button
                  onClick={handleWhatsApp}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-all duration-200 active:scale-95"
                >
                  Message
                </button>
              </div>

              {/* Email Support */}
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200/60">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Email</p>
                    <p className="text-gray-600 text-sm text-xs truncate max-w-[150px]">{customerSupport.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleEmailSupport}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all duration-200 active:scale-95"
                >
                  Email
                </button>
              </div>

              {/* Support Hours */}
              <div className="mt-4 p-3 bg-orange-50 rounded-xl border border-orange-200">
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-orange-600">🕒</span>
                  <span className="text-orange-700 font-medium">Support Hours: {customerSupport.hours}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* FAQ Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden transition-all duration-300 hover:shadow-xl"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full p-6 text-left flex items-center justify-between focus:outline-none"
                >
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="bg-orange-100 text-orange-600 p-2 rounded-lg flex-shrink-0 mt-0.5">
                      <span className="text-sm font-semibold">Q{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 pr-4">
                        {faq.question}
                      </h3>
                    </div>
                  </div>
                  <div className={`transform transition-transform duration-300 ${
                    expandedIndex === index ? 'rotate-180' : ''
                  }`}>
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
                  expandedIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="px-6 pb-6">
                    <div className="border-t border-gray-200/60 pt-4">
                      <p className="text-gray-700 leading-relaxed text-sm">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 border border-blue-200/60">
          <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Need More Help?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleCallSupport}
              className="bg-white border border-blue-300 text-blue-700 p-4 rounded-xl hover:bg-blue-50 transition-all duration-200 active:scale-95 flex items-center justify-center space-x-2 font-semibold"
            >
              <span>📞</span>
              <span>Emergency Support</span>
            </button>
            <button
              onClick={() => window.open('mailto:' + customerSupport.email)}
              className="bg-white border border-orange-300 text-orange-700 p-4 rounded-xl hover:bg-orange-50 transition-all duration-200 active:scale-95 flex items-center justify-center space-x-2 font-semibold"
            >
              <span>✉️</span>
              <span>Email Issue</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;