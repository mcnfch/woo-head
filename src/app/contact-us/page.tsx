'use client';

import { useState } from 'react';

interface FormData {
  inquiryType: string;
  orderNumber?: string;
  subject: string;
  priority: string;
  email: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    inquiryType: '',
    orderNumber: '',
    subject: '',
    priority: '',
    email: ''
  });

  const inquiryTypes = [
    'Order Status',
    'Return Request',
    'Product Question',
    'Website Issue',
    'Shipping Question',
    'Other'
  ];

  const subjects = {
    'Order Status': [
      'Where is my order?',
      'Order delayed',
      'Missing items',
      'Wrong items received'
    ],
    'Return Request': [
      'Initiate return',
      'Return status',
      'Return label issue',
      'Refund status'
    ],
    'Product Question': [
      'Size question',
      'Color options',
      'Material information',
      'Product availability'
    ],
    'Website Issue': [
      'Payment problem',
      'Checkout error',
      'Account access',
      'Technical error'
    ],
    'Shipping Question': [
      'Shipping methods',
      'Shipping costs',
      'Delivery timeframe',
      'International shipping'
    ],
    'Other': [
      'General inquiry',
      'Feedback',
      'Partnership request',
      'Other question'
    ]
  };

  const priorities = [
    'Normal',
    'High',
    'Urgent'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here you would typically send the data to your backend
    console.log('Form submitted:', formData);
    
    // Example of what to send to backend:
    const _message = `
      Inquiry Type: ${formData.inquiryType}
      ${formData.orderNumber ? `Order Number: ${formData.orderNumber}` : ''}
      Subject: ${formData.subject}
      Priority: ${formData.priority}
    `;

    // TODO: Add your API call here
    alert('Thank you for your inquiry. We will respond shortly.');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Contact Us</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-md">
        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address*
          </label>
          <input
            type="email"
            required
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="your@email.com"
          />
        </div>

        {/* Inquiry Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type of Inquiry*
          </label>
          <select
            required
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            value={formData.inquiryType}
            onChange={(e) => setFormData({
              ...formData,
              inquiryType: e.target.value,
              subject: '' // Reset subject when inquiry type changes
            })}
          >
            <option value="">Select inquiry type</option>
            {inquiryTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Order Number (conditional) */}
        {formData.inquiryType === 'Order Status' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Number
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
              value={formData.orderNumber}
              onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
              placeholder="Enter your order number"
            />
          </div>
        )}

        {/* Subject (dependent on inquiry type) */}
        {formData.inquiryType && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject*
            </label>
            <select
              required
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            >
              <option value="">Select subject</option>
              {subjects[formData.inquiryType as keyof typeof subjects].map((subject) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        )}

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority*
          </label>
          <select
            required
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
          >
            <option value="">Select priority</option>
            {priorities.map((priority) => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          Submit Inquiry
        </button>
      </form>
    </div>
  );
} 