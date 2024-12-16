"use client";

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

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
  const { cart, clearCart } = useCart();
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string>("");
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

  const [error, setError] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);

  useEffect(() => {
    if (cart?.subtotal && elements) {
      // Update Elements with the new amount
      const amount = Math.round(cart.subtotal * 100);
      if (amount > 0) {
        elements.update({
          amount: amount,
        });
      }
    }
  }, [cart?.subtotal, elements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !cart?.subtotal) {
      setError('Payment system not initialized or cart is empty.');
      return;
    }

    setProcessing(true);
    setError("");

    try {
      // Trigger form validation and wallet collection
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      // Create order first
      const orderData = {
        billing: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address_1: formData.address,
          city: formData.city,
          state: formData.state,
          postcode: formData.zipCode,
          country: 'US'
        },
        shipping: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          address_1: formData.address,
          city: formData.city,
          state: formData.state,
          postcode: formData.zipCode,
          country: 'US'
        },
        line_items: cart.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          variation_id: item.variation_id,
          meta_data: item.attributes?.map(attr => ({
            key: attr.name,
            value: attr.option
          })) || []
        })),
        status: 'pending',
        total: cart.subtotal.toString()
      };

      const order = await api.orders.create(orderData);

      if (!order?.id) {
        throw new Error('Failed to create order');
      }

      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(cart.subtotal * 100),
          currency: 'usd',
          orderId: order.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      if (!clientSecret) {
        throw new Error('No client secret received');
      }

      // Store the order ID in localStorage before redirecting
      localStorage.setItem('lastOrderId', order.id.toString());

      // Confirm the payment with the client secret
      const { error: paymentError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?order_id=${order.id}`,
          payment_method_data: {
            billing_details: {
              name: `${formData.firstName} ${formData.lastName}`,
              email: formData.email,
              phone: formData.phone,
              address: {
                city: formData.city,
                country: 'US',
                line1: formData.address,
                postal_code: formData.zipCode,
                state: formData.state
              }
            }
          }
        }
      });

      if (paymentError) {
        throw new Error(paymentError.message || "An error occurred during payment.");
      }

      // Clear cart after successful payment
      clearCart();

      // If we get here without redirect, something went wrong
      throw new Error("Unexpected error occurred during payment confirmation");

    } catch (error) {
      console.error('Error processing order:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while processing your order. Please try again.';
      setError(errorMessage);
      setProcessing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Address"
            required
            className="w-full p-2 border rounded-md md:col-span-2"
          />
          <input
            type="text"
            name="apartment"
            value={formData.apartment}
            onChange={handleChange}
            placeholder="Apartment, suite, etc. (optional)"
            className="w-full p-2 border rounded-md md:col-span-2"
          />
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
            placeholder="Phone"
            required
            className="w-full p-2 border rounded-md"
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Payment details</h2>
        <PaymentElement />
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || processing}
        className={`w-full py-3 px-4 rounded-md text-white font-medium ${
          !stripe || !elements || processing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-purple-600 hover:bg-purple-700'
        }`}
      >
        {processing ? (
          <span className="flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Processing...
          </span>
        ) : (
          `Pay $${cart?.subtotal.toFixed(2)}`
        )}
      </button>
    </form>
  );
}
