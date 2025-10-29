// src/pages/FAQ.js
import { useState, useEffect } from 'react';
import { settingsService } from '../services/settingsService';
import { Helmet } from 'react-helmet';

const FAQ = () => {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [customerSupport, setCustomerSupport] = useState({
    phone: '',
    email: '',
    hours: '9:00 AM - 9:00 PM',
    whatsapp: ''
  });
  const [loading, setLoading] = useState(true);
  const [isWebView, setIsWebView] = useState(false);

  const faqs = [
    // ... your existing FAQs
  ];

  useEffect(() => {
    loadCustomerSupport();
    detectWebView();
  }, []);

  const detectWebView = () => {
    // Check if running in WebView
    const userAgent = navigator.userAgent.toLowerCase();
    const isInWebView = 
      userAgent.includes('wv') || // Android WebView
      userAgent.includes('webview') || // Generic WebView
      (window.ReactNativeWebView !== undefined); // React Native WebView
    
    setIsWebView(isInWebView);
    console.log('Running in WebView:', isInWebView);
  };

  const loadCustomerSupport = async () => {
    try {
      setLoading(true);
      const supportData = await settingsService.getCustomerSupport();
      setCustomerSupport(supportData);
    } catch (error) {
      console.error('Error loading customer support:', error);
      setCustomerSupport({
        phone: '+91-9876543210',
        email: 'support@quickbite.com',
        hours: '9:00 AM - 9:00 PM',
        whatsapp: '+91-9876543210'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFAQ = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  // Enhanced call function that works in WebView
  const handleCallSupport = () => {
    if (customerSupport.phone) {
      const cleanPhone = customerSupport.phone.replace(/\D/g, '');
      
      if (isWebView) {
        // For WebView - use a fallback approach
        const callUrl = `tel:${cleanPhone}`;
        
        // Try multiple approaches
        if (window.ReactNativeWebView) {
          // React Native WebView
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'OPEN_PHONE',
            phone: cleanPhone
          }));
        } else if (window.Android) {
          // Android native bridge
          window.Android.openPhone(cleanPhone);
        } else {
          // Try direct URL with timeout fallback
          const link = document.createElement('a');
          link.href = callUrl;
          link.style.display = 'none';
          document.body.appendChild(link);
          
          setTimeout(() => {
            try {
              link.click();
            } catch (e) {
              console.error('Call failed:', e);
              showPhoneFallback(cleanPhone);
            }
          }, 100);
          
          document.body.removeChild(link);
        }
      } else {
        // Regular browser
        window.location.href = `tel:${cleanPhone}`;
      }
    }
  };

  // Enhanced WhatsApp function for WebView
  const handleWhatsApp = () => {
    if (customerSupport.whatsapp) {
      const cleanWhatsApp = customerSupport.whatsapp.replace(/\D/g, '');
      const message = "Hello! I need help with my QuickBite order.";
      
      if (isWebView) {
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanWhatsApp}&text=${encodeURIComponent(message)}`;
        const whatsappIntentUrl = `intent://send?phone=${cleanWhatsApp}&text=${encodeURIComponent(message)}#Intent;scheme=smsto;package=com.whatsapp;action=android.intent.action.SENDTO;end`;
        
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'OPEN_WHATSAPP',
            phone: cleanWhatsApp,
            message: message
          }));
        } else {
          // Try multiple URL schemes
          openUrlWithFallback(whatsappUrl, whatsappIntentUrl, 'WhatsApp');
        }
      } else {
        // Regular browser
        window.location.href = `https://api.whatsapp.com/send?phone=${cleanWhatsApp}&text=${encodeURIComponent(message)}`;
      }
    }
  };

  // Enhanced email function for WebView
  const handleEmailSupport = () => {
    if (customerSupport.email) {
      const subject = "QuickBite Support Request";
      const body = "Hello QuickBite team,\n\nI need assistance with:\n\n";
      
      if (isWebView) {
        const mailtoUrl = `mailto:${customerSupport.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'OPEN_EMAIL',
            email: customerSupport.email,
            subject: subject,
            body: body
          }));
        } else {
          openUrlInNewTab(mailtoUrl);
        }
      } else {
        // Regular browser
        window.location.href = `mailto:${customerSupport.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      }
    }
  };

  // Helper function to open URLs with fallback
  const openUrlWithFallback = (primaryUrl, fallbackUrl, appName) => {
    const link = document.createElement('a');
    link.href = primaryUrl;
    link.style.display = 'none';
    document.body.appendChild(link);
    
    setTimeout(() => {
      try {
        link.click();
        
        // If still in same page after 2 seconds, try fallback
        setTimeout(() => {
          if (!document.hidden) {
            console.log(`${appName} not installed, trying fallback`);
            window.open(fallbackUrl, '_blank');
          }
        }, 2000);
      } catch (e) {
        console.error(`Error opening ${appName}:`, e);
        window.open(fallbackUrl, '_blank');
      }
    }, 100);
    
    document.body.removeChild(link);
  };

  // Helper function to open URLs in new tab
  const openUrlInNewTab = (url) => {
    window.open(url, '_blank');
  };

  // Fallback for phone calls
  const showPhoneFallback = (phone) => {
    alert(`Please call us at: ${phone}\n\nWe're available during support hours: ${customerSupport.hours}`);
  };

  const formatPhoneForDisplay = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      return `${cleanPhone.slice(0, 5)}-${cleanPhone.slice(5)}`;
    } else if (cleanPhone.length === 12) {
      return `${cleanPhone.slice(0, 2)}-${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`;
    }
    return phone;
  };

  return (
    <>
      <Helmet>
        <link
          href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style>
          {`
            .work-sans {
              font-family: 'Work Sans', sans-serif;
            }
            .work-sans-medium {
              font-family: 'Work Sans', sans-serif;
              font-weight: 500;
            }
            .work-sans-semibold {
              font-family: 'Work Sans', sans-serif;
              font-weight: 600;
            }
            .work-sans-bold {
              font-family: 'Work Sans', sans-serif;
              font-weight: 700;
            }
          `}
        </style>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 safe-area-bottom work-sans">
        <div className="container mx-auto px-4 py-6 pb-24">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-xl text-white">❓</span>
            </div>
            <h1 className="text-2xl work-sans-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
              Help & Support
            </h1>
            <p className="text-gray-600 text-xs max-w-md mx-auto work-sans-medium">
              Find answers to common questions and get support for your orders
            </p>
          </div>

          {/* Customer Support Card - Always Visible */}
          <div className="bg-gradient-to-br from-white to-orange-50/50 rounded-2xl shadow-lg border border-orange-200/50 p-5 mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-orange-100 text-orange-600 p-2 rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg work-sans-bold text-gray-900">Customer Support</h2>
                <p className="text-gray-600 text-xs work-sans-medium">
                  {isWebView ? 'Tap below to contact support' : "We're here to help you 24/7"}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {/* Phone Support */}
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200/60 mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 text-green-600 p-2 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-xs work-sans-semibold">Call Us</p>
                      <p className="text-gray-600 text-xs work-sans-medium">
                        {formatPhoneForDisplay(customerSupport.phone)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCallSupport}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg text-xs work-sans-semibold hover:bg-green-700 transition-all duration-200 active:scale-95"
                  >
                    Call Now
                  </button>
                </div>

                {/* WhatsApp Support */}
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200/60 mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 text-green-600 p-2 rounded-lg">
                      <span className="text-sm">💬</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-xs work-sans-semibold">WhatsApp</p>
                      <p className="text-gray-600 text-xs work-sans-medium">Chat with us</p>
                    </div>
                  </div>
                  <button
                    onClick={handleWhatsApp}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg text-xs work-sans-semibold hover:bg-green-700 transition-all duration-200 active:scale-95"
                  >
                    Message
                  </button>
                </div>

                {/* Email Support */}
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200/60">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-xs work-sans-semibold">Email</p>
                      <p className="text-gray-600 text-xs work-sans-medium truncate max-w-[120px]">
                        {customerSupport.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleEmailSupport}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs work-sans-semibold hover:bg-blue-700 transition-all duration-200 active:scale-95"
                  >
                    Email
                  </button>
                </div>

                {/* Support Hours */}
                <div className="mt-3 p-2 bg-orange-50 rounded-xl border border-orange-200">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-orange-600">🕒</span>
                    <span className="text-orange-700 work-sans-medium">Support Hours: {customerSupport.hours}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Rest of your FAQ component remains the same */}
          {/* ... */}
        </div>
      </div>
    </>
  );
};

export default FAQ;