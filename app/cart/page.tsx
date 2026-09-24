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


  // =========================================================
  // CALCULATE SUBTOTAL
  // =========================================================


  const subtotal = cart.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0
  );


  // =========================================================
  // DELIVERY FEE
  // =========================================================


  const deliveryFee = subtotal > 0 ? 2500 : 0;


  // =========================================================
  // TOTAL
  // =========================================================


  const total = subtotal + deliveryFee;


  // =========================================================
  // FORMAT PRICE
  // =========================================================


  const formatAmount = (amount: number) => {
    return `₦${Number(amount).toLocaleString("en-NG")}`;
  };


  // =========================================================
  // PAGE
  // =========================================================


  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      {/* =====================================================
          HEADER
      ====================================================== */}


      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}


          <Link
            href="/"
            className="text-xl font-bold tracking-tight sm:text-2xl"
          >
            <span className="text-blue-700">ASCO</span>
            <span className="text-orange-500">HOMES</span>
          </Link>


          {/* Continue Shopping */}


          <Link
            href="/"
            className="text-sm font-semibold text-blue-600 transition hover:text-blue-800 hover:underline"
          >
            Continue Shopping
          </Link>
        </div>
      </header>


      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}


      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ===================================================
            PAGE TITLE
        ==================================================== */}


        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Shopping Cart
          </h1>


          <p className="mt-2 text-gray-600">
            Review your items before checkout.
          </p>
        </div>


        {/* ===================================================
            EMPTY CART
        ==================================================== */}


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
          /* =================================================
             CART WITH PRODUCTS
          ================================================== */


          <div className="grid gap-6 lg:grid-cols-3">
            {/* =================================================
                CART ITEMS
            ================================================== */}


            <div className="lg:col-span-2">
              <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
                {/* Cart Header */}


                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    Cart Items
                  </h2>


                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-sm font-semibold text-red-600 transition hover:text-red-700 hover:underline"
                  >
                    Clear Cart
                  </button>
                </div>


                {/* =================================================
                    PRODUCT LIST
                ================================================== */}


                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-gray-200 p-3 sm:p-4"
                    >
                      <div className="flex gap-3 sm:gap-4">
                        {/* =========================================
                            PRODUCT IMAGE
                        ========================================== */}


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


                        {/* =========================================
                            PRODUCT DETAILS
                        ========================================== */}


                        <div className="min-w-0 flex-1">
                          <h3 className="break-words text-sm font-bold text-gray-900 sm:text-base">
                            {item.name}
                          </h3>


                          <p className="mt-1 text-sm font-semibold text-blue-700">
                            {formatAmount(item.price)}
                          </p>


                          {/* =======================================
                              QUANTITY CONTROLS
                          ======================================== */}


                          <div className="mt-3 flex items-center gap-2">
                            {/* DECREASE */}


                            <button
                              type="button"
                              onClick={() =>
                                decreaseQuantity(item.id)
                              }
                              aria-label={`Decrease quantity of ${item.name}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-lg font-bold text-gray-900 transition hover:bg-gray-100 active:scale-95"
                            >
                              −
                            </button>


                            {/* QUANTITY */}


                            <span className="min-w-8 text-center text-sm font-bold text-gray-900">
                              {item.quantity}
                            </span>


                            {/* INCREASE */}


                            <button
                              type="button"
                              onClick={() =>
                                increaseQuantity(item.id)
                              }
                              aria-label={`Increase quantity of ${item.name}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-lg font-bold text-gray-900 transition hover:bg-gray-100 active:scale-95"
                            >
                              +
                            </button>
                          </div>
                        </div>


                        {/* =========================================
                            ITEM TOTAL + REMOVE
                        ========================================== */}


                        <div className="flex shrink-0 flex-col items-end justify-between">
                          <p className="text-sm font-bold text-gray-900 sm:text-base">
                            {formatAmount(
                              Number(item.price) * item.quantity
                            )}
                          </p>


                          <button
                            type="button"
                            onClick={() =>
                              removeFromCart(item.id)
                            }
                            className="text-xs font-semibold text-red-600 transition hover:text-red-700 hover:underline"
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


            {/* =================================================
                ORDER SUMMARY
            ================================================== */}


            <div>
              <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Order Summary
                </h2>


                <div className="mt-6 space-y-4">
                  {/* SUBTOTAL */}


                  <div className="flex items-center justify-between text-gray-600">
                    <span>Subtotal</span>


                    <span className="font-semibold text-gray-900">
                      {formatAmount(subtotal)}
                    </span>
                  </div>


                  {/* DELIVERY */}


                  <div className="flex items-center justify-between text-gray-600">
                    <span>Delivery</span>


                    <span className="font-semibold text-gray-900">
                      {formatAmount(deliveryFee)}
                    </span>
                  </div>


                  {/* TOTAL */}


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


                {/* CHECKOUT */}


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




