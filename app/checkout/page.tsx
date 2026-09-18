"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/store/CartContext";
import { supabase } from "@/lib/supabase";

type Profile = {
  full_name: string | null;
  phone: string | null;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCheckout = async () => {
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .single();

      if (error) {
        setError(error.message);
      } else if (data) {
        const profile: Profile = data;

        setFullName(profile.full_name || "");
        setPhone(profile.phone || "");
      }

      setLoading(false);
    };

    loadCheckout();
  }, [router]);

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const deliveryFee = subtotal > 0 ? 2500 : 0;

  const total = subtotal + deliveryFee;

  const formatAmount = (amount: number) => {
    return `₦${amount.toLocaleString("en-NG")}`;
  };

  const handleContinueToPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    if (!address.trim()) {
      setError("Please enter your delivery address.");
      return;
    }

    setProcessing(true);

    try {
      // Get logged-in customer
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Your session has expired. Please log in again.");
        setProcessing(false);
        return;
      }

      if (!user.email) {
        setError(
          "Your account does not have an email address. Please update your account."
        );
        setProcessing(false);
        return;
      }

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: total,
          status: "pending",
          payment_status: "pending",
          delivery_address: address.trim(),
        })
        .select()
        .single();

      if (orderError || !order) {
        console.error("Order creation error:", orderError);

        setError(
          orderError?.message ||
            "Unable to create your order. Please try again."
        );

        setProcessing(false);
        return;
      }

      // Create order items
      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: null,
        product_name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        console.error("Order items error:", itemsError);

        await supabase
          .from("orders")
          .delete()
          .eq("id", order.id);

        setError(
          "We could not save your order items. Please try again."
        );

        setProcessing(false);
        return;
      }

      // Update customer information
      await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
        })
        .eq("id", user.id);

      // Create a unique Paystack reference
      const reference = `ASC-${order.id}`;

      // Initialize Paystack payment
      const paymentResponse = await fetch(
        "/api/paystack/initialize",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.email,
            amount: total,
            reference,
          }),
        }
      );

      const paymentData = await paymentResponse.json();

      if (!paymentResponse.ok || !paymentData.authorization_url) {
        console.error(
          "Paystack initialization error:",
          paymentData
        );

        // Remove the order if Paystack initialization fails
        await supabase
          .from("orders")
          .delete()
          .eq("id", order.id);

        setError(
          paymentData.error ||
            "Unable to connect to Paystack. Please try again."
        );

        setProcessing(false);
        return;
      }

      // Clear cart before sending customer to Paystack
      clearCart();

      // Send customer to Paystack
      window.location.href = paymentData.authorization_url;
    } catch (err) {
      console.error("Checkout error:", err);

      setError(
        "Something went wrong while starting your payment."
      );

      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <p className="text-gray-700">Loading checkout...</p>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl bg-white p-8 text-center shadow-md">
            <div className="text-5xl">🛒</div>

            <h1 className="mt-5 text-2xl font-bold text-gray-900">
              Your cart is empty
            </h1>

            <p className="mt-2 text-gray-600">
              Add some products before proceeding to checkout.
            </p>

            <Link
              href="/"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/cart"
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            ← Back to Cart
          </Link>

          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Checkout
          </h1>

          <p className="mt-2 text-gray-600">
            Enter your delivery information and review your order.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleContinueToPayment}
          className="grid gap-6 lg:grid-cols-3"
        >
          {/* Customer Information */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white p-6 shadow-md sm:p-8">
              <h2 className="text-xl font-bold text-gray-900">
                Delivery Information
              </h2>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Phone Number
                  </label>

                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Delivery Address
                  </label>

                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your full delivery address"
                    rows={4}
                    required
                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mt-6 rounded-2xl bg-white p-6 shadow-md sm:p-8">
              <h2 className="text-xl font-bold text-gray-900">
                Your Order
              </h2>

              <div className="mt-6 space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">
                        {item.name}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        {formatAmount(item.price)} × {item.quantity}
                      </p>
                    </div>

                    <p className="shrink-0 font-bold text-gray-900">
                      {formatAmount(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="rounded-2xl bg-white p-6 shadow-md sm:p-8 lg:sticky lg:top-6">
              <h2 className="text-xl font-bold text-gray-900">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Subtotal</span>

                  <span className="font-medium text-gray-900">
                    {formatAmount(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-gray-600">
                  <span>Delivery</span>

                  <span className="font-medium text-gray-900">
                    {formatAmount(deliveryFee)}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">
                      Total
                    </span>

                    <span className="text-xl font-bold text-blue-700">
                      {formatAmount(total)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing
                  ? "Connecting to Paystack..."
                  : "Continue to Payment"}
              </button>

              <p className="mt-4 text-center text-xs text-gray-500">
                Secure payment will be handled by Paystack.
              </p>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
