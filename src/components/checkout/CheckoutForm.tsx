'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

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
  billingFirstName: string;
  billingLastName: string;
  billingAddress: string;
  billingApartment: string;
  billingCity: string;
  billingState: string;
  billingZipCode: string;
}

export default function CheckoutForm() {
  const { cart, clearCart } = useCart();
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
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
    billingFirstName: "",
    billingLastName: "",
    billingAddress: "",
    billingApartment: "",
    billingCity: "",
    billingState: "",
    billingZipCode: "",
  });

  const [error, setError] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);

  const handleError = (error: Error) => {
    setError(error.message);
    setProcessing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !cart?.items.length) {
      setError('Payment system not initialized or cart is empty');
      return;
    }

    if (processing) {
      return;
    }

    setProcessing(true);
    setError("");

    try {
      // Trigger form validation and wallet collection
      const { error: submitError } = await elements.submit();
      if (submitError) {
        handleError(submitError);
        return;
      }

      // Create order first
      const orderData = {
        billing: {
          first_name: formData.useShippingForBilling ? formData.firstName : formData.billingFirstName,
          last_name: formData.useShippingForBilling ? formData.lastName : formData.billingLastName,
          email: formData.email,
          phone: formData.phone,
          address_1: formData.useShippingForBilling ? formData.address : formData.billingAddress,
          address_2: formData.useShippingForBilling ? formData.apartment : formData.billingApartment,
          city: formData.useShippingForBilling ? formData.city : formData.billingCity,
          state: formData.useShippingForBilling ? formData.state : formData.billingState,
          postcode: formData.useShippingForBilling ? formData.zipCode : formData.billingZipCode,
          country: 'US'
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
        payment_method: "stripe",
        payment_method_title: "Credit Card (Stripe)",
        status: "pending"
      };

      // Create the order first
      const orderResponse = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.text();
        try {
          const jsonError = JSON.parse(errorData);
          throw new Error(jsonError.error || 'Failed to create order');
        } catch (e) {
          throw new Error(`Failed to create order: ${errorData}`);
        }
      }

      const orderResult = await orderResponse.json();
      if (!orderResult.order || !orderResult.order.id) {
        throw new Error('Invalid order response');
      }

      // Then create payment intent
      const paymentResponse = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(cart.subtotal * 100),
          currency: 'usd',
          orderId: orderResult.order.id
        }),
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.text();
        try {
          const jsonError = JSON.parse(errorData);
          throw new Error(jsonError.error || 'Failed to create payment intent');
        } catch (e) {
          throw new Error(`Failed to create payment intent: ${errorData}`);
        }
      }

      const paymentResult = await paymentResponse.json();
      if (!paymentResult.clientSecret) {
        throw new Error('No client secret received');
      }

      // Confirm the payment
      const { error: paymentError } = await stripe.confirmPayment({
        elements,
        clientSecret: paymentResult.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
          payment_method_data: {
            billing_details: {
              name: formData.useShippingForBilling 
                ? `${formData.firstName} ${formData.lastName}`
                : `${formData.billingFirstName} ${formData.billingLastName}`,
              email: formData.email,
              phone: formData.phone,
              address: {
                city: formData.useShippingForBilling ? formData.city : formData.billingCity,
                country: 'US',
                line1: formData.useShippingForBilling ? formData.address : formData.billingAddress,
                line2: formData.useShippingForBilling ? formData.apartment : formData.billingApartment,
                postal_code: formData.useShippingForBilling ? formData.zipCode : formData.billingZipCode,
                state: formData.useShippingForBilling ? formData.state : formData.billingState
              }
            }
          }
        },
      });

      if (paymentError) {
        // This point is only reached if there's an immediate error when confirming the payment
        handleError(paymentError);
      } else {
        // Clear the cart after successful payment
        clearCart();
      }
      // Otherwise, your customer is redirected to the `return_url`
      
    } catch (error) {
      console.error('Error processing payment:', error);
      handleError(error instanceof Error ? error : new Error('An error occurred while processing your payment'));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  if (!stripe || !elements) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-4 text-gray-600">Loading payment form...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Contact information</h2>
        <div className="grid grid-cols-1 gap-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping address</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="firstName"
            placeholder="First name"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last name"
            value={formData.lastName}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
          <div className="md:col-span-2">
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="md:col-span-2">
            <input
              type="text"
              name="apartment"
              placeholder="Apartment, suite, etc. (optional)"
              value={formData.apartment}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <input
            type="text"
            name="city"
            placeholder="City"
            value={formData.city}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            name="state"
            placeholder="State"
            value={formData.state}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            name="zipCode"
            placeholder="ZIP code"
            value={formData.zipCode}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
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
          Billing address is same as shipping
        </label>
      </div>

      {!formData.useShippingForBilling && (
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Billing address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="billingFirstName"
              placeholder="First name"
              value={formData.billingFirstName}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />
            <input
              type="text"
              name="billingLastName"
              placeholder="Last name"
              value={formData.billingLastName}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />
            <div className="md:col-span-2">
              <input
                type="text"
                name="billingAddress"
                placeholder="Address"
                value={formData.billingAddress}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="md:col-span-2">
              <input
                type="text"
                name="billingApartment"
                placeholder="Apartment, suite, etc. (optional)"
                value={formData.billingApartment}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <input
              type="text"
              name="billingCity"
              placeholder="City"
              value={formData.billingCity}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />
            <input
              type="text"
              name="billingState"
              placeholder="State"
              value={formData.billingState}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />
            <input
              type="text"
              name="billingZipCode"
              placeholder="ZIP code"
              value={formData.billingZipCode}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Payment details</h2>
        <PaymentElement />
      </div>

      {error && (
        <div className="text-red-500 text-sm mt-4">{error}</div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className={`w-full py-3 px-4 rounded-md text-white font-medium ${
          !stripe || processing
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
          `Pay ${cart ? `$${cart.subtotal.toFixed(2)}` : ''}`
        )}
      </button>
    </form>
  );
}
