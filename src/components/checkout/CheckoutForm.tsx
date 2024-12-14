"use client";

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { api } from '@/lib/api';

interface FormData {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  useShippingForBilling: boolean;
}

export default function CheckoutForm() {
  const { cart: _cart } = useCart();
  const stripe = useStripe();
  const elements = useElements();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    useShippingForBilling: true,
  });

  const [_error, setError] = useState<string>("");
  const [_processing, setProcessing] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProcessing(true);

    if (!stripe || !elements) {
      setError('Stripe has not been initialized.');
      setProcessing(false);
      return;
    }

    try {
      // Create the order first
      const orderData = {
        billing: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          address_1: formData.address,
          address_2: formData.apartment,
          city: formData.city,
          state: formData.state,
          postcode: formData.zipCode,
          country: 'US',
          email: formData.email,
          phone: formData.phone
        },
        shipping: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          address_1: formData.address,
          address_2: formData.apartment,
          city: formData.city,
          state: formData.state,
          postcode: formData.zipCode,
          country: 'US'
        }
      };

      const order = await api.orders.create(orderData);

      // Then confirm the payment
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
      });

      if (stripeError) {
        setError(stripeError.message || "An error occurred during payment.");
        setProcessing(false);
        return;
      }

      // Handle successful payment
      console.log('Order created:', order);
    } catch (error) {
      console.error('Error creating order:', error);
      setError('An error occurred while processing your order.');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Contact information</h2>
        <p className="text-sm text-gray-600 mb-4">
          We&apos;ll use this email to send you details and updates about your order.
        </p>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email address"
          required
          className="w-full p-2 border rounded-md"
        />
      </div>

      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping address</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="First name"
            required
            className="w-full p-2 border rounded-md"
          />
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Last name"
            required
            className="w-full p-2 border rounded-md"
          />
          <div className="md:col-span-2">
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Address"
              required
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div className="md:col-span-2">
            <input
              type="text"
              name="apartment"
              value={formData.apartment}
              onChange={handleChange}
              placeholder="Apartment, suite, etc. (optional)"
              className="w-full p-2 border rounded-md"
            />
          </div>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="City"
            required
            className="w-full p-2 border rounded-md"
          />
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            placeholder="State"
            required
            className="w-full p-2 border rounded-md"
          />
          <input
            type="text"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            placeholder="ZIP code"
            required
            className="w-full p-2 border rounded-md"
          />
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone (optional)"
            className="w-full p-2 border rounded-md"
          />
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="useShippingForBilling"
          name="useShippingForBilling"
          checked={formData.useShippingForBilling}
          onChange={handleChange}
          className="h-4 w-4 text-purple-600 rounded border-gray-300"
        />
        <label htmlFor="useShippingForBilling" className="ml-2 text-sm text-gray-700">
          Use same address for billing
        </label>
      </div>

      <div>
        <button
          type="submit"
          className="w-full bg-black text-white py-3 px-4 rounded-md hover:bg-gray-800 transition-colors"
        >
          Continue to payment
        </button>
      </div>
    </form>
  );
}
