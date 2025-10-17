// src/pages/FAQ.js
const FAQ = () => {
  const faqs = [
    {
      question: "How do I place an order?",
      answer: "Browse restaurants or grocery items, add items to your cart, select delivery address, and place your order with cash on delivery."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We currently only accept Cash on Delivery (COD) for all orders."
    },
    {
      question: "How long does delivery take?",
      answer: "Delivery times vary by restaurant and location, but typically range from 30-45 minutes for food and 45-60 minutes for groceries."
    },
    {
      question: "Can I modify my order after placing it?",
      answer: "Orders cannot be modified once placed. Please contact customer support for urgent changes."
    },
    {
      question: "What if I have issues with my order?",
      answer: "Contact our customer support team through the app or website, and we'll help resolve any issues with your order."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Frequently Asked Questions</h1>
      
      <div className="space-y-6">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-3 text-orange-600">
              {faq.question}
            </h3>
            <p className="text-gray-700">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;