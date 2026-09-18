"use client";

import Link from "next/link";
import { useCart } from "@/components/store/CartContext";

export default function CartPage() {
  const {
    cart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const deliveryFee = subtotal > 0 ? 2500 : 0;

  const total = subtotal + deliveryFee;

  const formatAmount = (amount: number) => {
    return `₦${amount.toLocaleString("en-NG")}`;
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight sm:text-2xl"
          >
            <span className="text-blue-700">ASCO</span>
            <span className="text-orange-500">HOMES</span>
          </Link>

          <Link
            href="/"
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            Continue Shopping
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Shopping Cart
          </h1>

          <p className="mt-2 text-gray-600">
            Review your items before checkout.
          </p>
        </div>

        {/* Empty Cart */}
        {cart.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">🛒</div>

            <h2 className="mt-5 text-xl font-bold text-gray-900">
              Your cart is empty
            </h2>

            <p className="mt-2 text-gray-600">
              Add some products before checking out.
            </p>

            <Link
              href="/"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    Cart Items
                  </h2>

                  <button
                    onClick={clearCart}
                    className="text-sm font-semibold text-red-600 hover:underline"
                  >
                    Clear Cart
                  </button>
                </div>

                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.name}
                      className="rounded-xl border border-gray-200 p-3 sm:p-4"
                    >
                      <div className="flex gap-3 sm:gap-4">
                        {/* Product Image */}
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 sm:h-28 sm:w-28">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="text-3xl sm:text-4xl">
                              🛍️
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-gray-900 sm:text-base">
                            {item.name}
                          </h3>

                          <p className="mt-1 text-sm font-semibold text-blue-700">
                            {formatAmount(item.price)}
                          </p>

                          {/* Quantity Controls */}
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              onClick={() =>
                                decreaseQuantity(item.name)
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-lg font-bold text-gray-900 transition hover:bg-gray-100"
                            >
                              −
                            </button>

                            <span className="min-w-8 text-center text-sm font-bold text-gray-900">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() =>
                                increaseQuantity(item.name)
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-lg font-bold text-gray-900 transition hover:bg-gray-100"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Item Total + Remove */}
                        <div className="flex shrink-0 flex-col items-end justify-between">
                          <p className="text-sm font-bold text-gray-900 sm:text-base">
                            {formatAmount(
                              item.price * item.quantity
                            )}
                          </p>

                          <button
                            onClick={() =>
                              removeFromCart(item.name)
                            }
                            className="text-xs font-semibold text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Order Summary
                </h2>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Subtotal</span>

                    <span className="font-semibold text-gray-900">
                      {formatAmount(subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-600">
                    <span>Delivery</span>

                    <span className="font-semibold text-gray-900">
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

                <Link
                  href="/checkout"
                  className="mt-6 block w-full rounded-xl bg-blue-600 py-3.5 text-center text-sm font-extrabold text-white transition hover:bg-blue-700 active:scale-[0.98]"
                >
                  Proceed to Checkout
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
