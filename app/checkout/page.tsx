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


type PaymentSettings = {
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
};


export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();


  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentReference, setPaymentReference] = useState("");


  const [paymentSettings, setPaymentSettings] =
    useState<PaymentSettings | null>(null);


  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");


  // =========================================================
  // LOAD CHECKOUT DATA
  // =========================================================


  useEffect(() => {
    const loadCheckout = async () => {
      setError("");


      try {
        // =====================================================
        // GET LOGGED-IN USER
        // =====================================================


        const {
          data: { user },
        } = await supabase.auth.getUser();


        if (!user) {
          router.push("/login");
          return;
        }


        // =====================================================
        // LOAD CUSTOMER PROFILE
        // =====================================================


        const { data: profileData, error: profileError } =
          await supabase
            .from("profiles")
            .select("full_name, phone")
            .eq("id", user.id)
            .maybeSingle();


        if (profileError) {
          console.error("Profile loading error:", profileError);
          setError("Unable to load your profile.");
        } else if (profileData) {
          const profile: Profile = profileData;


          setFullName(profile.full_name || "");
          setPhone(profile.phone || "");
        }


        // =====================================================
        // LOAD STORE PAYMENT SETTINGS
        // =====================================================


        const { data: paymentData, error: paymentError } =
          await supabase
            .from("store_payment_settings")
            .select(
              "bank_name, account_name, account_number"
            )
            .limit(1)
            .maybeSingle();


        if (paymentError) {
          console.error(
            "Payment settings loading error:",
            paymentError
          );


          setError(
            "Unable to load the store payment details."
          );
        } else if (!paymentData) {
          setError(
            "Store payment details have not been configured yet."
          );
        } else {
          setPaymentSettings(paymentData);
        }
      } catch (err) {
        console.error("Checkout loading error:", err);


        setError(
          "Something went wrong while loading checkout."
        );
      } finally {
        setLoading(false);
      }
    };


    loadCheckout();
  }, [router]);


  // =========================================================
  // CALCULATE TOTALS
  // =========================================================


  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );


  const deliveryFee = subtotal > 0 ? 2500 : 0;


  const total = subtotal + deliveryFee;


  // =========================================================
  // FORMAT AMOUNT
  // =========================================================


  const formatAmount = (amount: number) => {
    return `₦${amount.toLocaleString("en-NG")}`;
  };


  // =========================================================
  // COPY ACCOUNT NUMBER
  // =========================================================


  const copyAccountNumber = async () => {
    if (!paymentSettings?.account_number) {
      return;
    }


    try {
      await navigator.clipboard.writeText(
        paymentSettings.account_number
      );


      alert("Account number copied.");
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };


  // =========================================================
  // CREATE ORDER
  // =========================================================


  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();


    setError("");


    // =======================================================
    // VALIDATION
    // =======================================================


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


    if (!paymentReference.trim()) {
      setError(
        "Please enter your transfer reference OR transaction no, after making the bank transfer."
      );
      return;
    }


    if (!paymentSettings) {
      setError(
        "Store payment details are unavailable. Please try again later."
      );
      return;
    }


    if (
      !paymentSettings.bank_name ||
      !paymentSettings.account_name ||
      !paymentSettings.account_number
    ) {
      setError(
        "The store bank account has not been configured correctly."
      );
      return;
    }


    setProcessing(true);


    try {
      // =====================================================
      // GET LOGGED-IN CUSTOMER
      // =====================================================


      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();


      if (userError || !user) {
        setError(
          "Your session has expired. Please log in again."
        );


        setProcessing(false);
        return;
      }


      // =====================================================
      // CREATE ORDER
      // =====================================================


      const { data: order, error: orderError } =
        await supabase
          .from("orders")
          .insert({
            user_id: user.id,
            total_amount: total,
            status: "pending",
            payment_status: "pending",
            delivery_address: address.trim(),
            payment_method: "bank_transfer",
            payment_reference: paymentReference.trim(),
          })
          .select()
          .single();


      if (orderError || !order) {
        console.error(
          "Order creation error:",
          orderError
        );


        setError(
          orderError?.message ||
            "Unable to create your order. Please try again."
        );


        setProcessing(false);
        return;
      }


      // =====================================================
      // CREATE ORDER ITEMS
      // =====================================================


      const orderItems = cart.map((item) => ({
        order_id: order.id,


        // Uses product ID when available.
        product_id: item.id ?? null,


        product_name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));


      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);


      if (itemsError) {
        console.error(
          "Order items error:",
          itemsError
        );


        // Delete incomplete order
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


      // =====================================================
      // UPDATE CUSTOMER PROFILE
      // =====================================================


      const { error: profileUpdateError } =
        await supabase
          .from("profiles")
          .update({
            full_name: fullName.trim(),
            phone: phone.trim(),
          })
          .eq("id", user.id);


      if (profileUpdateError) {
        console.error(
          "Profile update error:",
          profileUpdateError
        );
      }


      // =====================================================
      // CLEAR CART
      // =====================================================


      clearCart();


      // =====================================================
      // REDIRECT TO ORDERS
      // =====================================================


      router.push(
        `/orders?success=true&order=${order.id}`
      );
    } catch (err) {
      console.error("Checkout error:", err);


      setError(
        "Something went wrong while creating your order. Please try again."
      );


      setProcessing(false);
    }
  };


  // =========================================================
  // LOADING STATE
  // =========================================================


  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
          <div className="w-full rounded-2xl bg-white p-8 text-center shadow-md">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />


            <p className="mt-5 text-gray-700">
              Loading checkout...
            </p>
          </div>
        </div>
      </main>
    );
  }


  // =========================================================
  // EMPTY CART
  // =========================================================


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
              href="/shop"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }


  // =========================================================
  // CHECKOUT PAGE
  // =========================================================


  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">


        {/* HEADER */}


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
            Enter your delivery information and complete your
            bank transfer.
          </p>
        </div>


        {/* ERROR */}


        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}


        <form
          onSubmit={handlePlaceOrder}
          className="grid gap-6 lg:grid-cols-3"
        >


          {/* =================================================
              LEFT SIDE
          ================================================= */}


          <div className="space-y-6 lg:col-span-2">


            {/* DELIVERY INFORMATION */}


            <div className="rounded-2xl bg-white p-6 shadow-md sm:p-8">
              <h2 className="text-xl font-bold text-gray-900">
                Delivery Information
              </h2>


              <div className="mt-6 space-y-5">


                {/* FULL NAME */}


                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Full Name
                  </label>


                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) =>
                      setFullName(e.target.value)
                    }
                    placeholder="Enter your full name"
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>


                {/* PHONE */}


                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Phone Number
                  </label>


                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value)
                    }
                    placeholder="Enter your phone number"
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>


                {/* ADDRESS */}


                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Delivery Address
                  </label>


                  <textarea
                    value={address}
                    onChange={(e) =>
                      setAddress(e.target.value)
                    }
                    placeholder="Enter your full delivery address"
                    rows={4}
                    required
                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>


              </div>
            </div>


            {/* =================================================
                BANK TRANSFER
            ================================================= */}


            <div className="rounded-2xl border border-orange-200 bg-white p-6 shadow-md sm:p-8">


              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                  ₦
                </div>


                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Bank Transfer
                  </h2>


                  <p className="mt-1 text-sm text-gray-600">
                    Transfer the exact order amount to the
                    account below.
                  </p>
                </div>
              </div>


              {/* ACCOUNT DETAILS */}


              {paymentSettings ? (
                <div className="mt-6 rounded-xl bg-gray-50 p-5">


                  <div className="space-y-4">


                    {/* BANK */}


                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Bank
                      </p>


                      <p className="mt-1 font-semibold text-gray-900">
                        {paymentSettings.bank_name}
                      </p>
                    </div>


                    {/* ACCOUNT NAME */}


                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Account Name
                      </p>


                      <p className="mt-1 font-semibold text-gray-900">
                        {paymentSettings.account_name}
                      </p>
                    </div>


                    {/* ACCOUNT NUMBER */}


                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Account Number
                      </p>


                      <div className="mt-1 flex flex-wrap items-center gap-3">


                        <p className="text-xl font-bold tracking-wider text-blue-700">
                          {paymentSettings.account_number}
                        </p>


                        <button
                          type="button"
                          onClick={copyAccountNumber}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-100"
                        >
                          Copy
                        </button>


                      </div>
                    </div>


                    {/* AMOUNT */}


                    <div className="border-t border-gray-200 pt-4">


                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Amount to Transfer
                      </p>


                      <p className="mt-1 text-2xl font-bold text-orange-600">
                        {formatAmount(total)}
                      </p>


                    </div>


                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
                  <p className="font-semibold text-red-800">
                    Payment details unavailable
                  </p>


                  <p className="mt-1 text-sm text-red-700">
                    The store bank account has not been
                    configured correctly.
                  </p>
                </div>
              )}


              {/* PAYMENT INSTRUCTIONS */}


              <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">


                <p className="font-semibold text-blue-900">
                  Payment instructions
                </p>


                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-blue-800">
                  <li>
                    Transfer the exact amount shown above.
                  </li>


                  <li>
                    Keep your transfer receipt.
                  </li>


                  <li>
                    Enter your transfer reference / transaction no. below.
                  </li>


                  <li>
                    Submit your order for verification.
                  </li>
                </ol>


              </div>


              {/* TRANSFER REFERENCE */}


              <div className="mt-6">


                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Transfer Reference OR Transaction No.
                </label>


                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) =>
                    setPaymentReference(e.target.value)
                  }
                  placeholder="Enter your bank transfer reference Or Transation No."
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />


                <p className="mt-2 text-xs text-gray-500">
                  You can usually find this reference/transaction no. on your
                  bank transfer receipt or transaction details.
                </p>


              </div>


            </div>


            {/* =================================================
                ORDER ITEMS
            ================================================= */}


            <div className="rounded-2xl bg-white p-6 shadow-md sm:p-8">


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
                        {formatAmount(item.price)} ×{" "}
                        {item.quantity}
                      </p>


                    </div>


                    <p className="shrink-0 font-bold text-gray-900">
                      {formatAmount(
                        item.price * item.quantity
                      )}
                    </p>


                  </div>
                ))}


              </div>


            </div>


          </div>


          {/* =================================================
              RIGHT SIDE
          ================================================= */}


          <div>


            <div className="rounded-2xl bg-white p-6 shadow-md sm:p-8 lg:sticky lg:top-6">


              <h2 className="text-xl font-bold text-gray-900">
                Order Summary
              </h2>


              <div className="mt-6 space-y-4">


                {/* SUBTOTAL */}


                <div className="flex items-center justify-between text-gray-600">


                  <span>Subtotal</span>


                  <span className="font-medium text-gray-900">
                    {formatAmount(subtotal)}
                  </span>


                </div>


                {/* DELIVERY */}


                <div className="flex items-center justify-between text-gray-600">


                  <span>Delivery</span>


                  <span className="font-medium text-gray-900">
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


              {/* SUBMIT */}


              <button
                type="submit"
                disabled={
                  processing || !paymentSettings
                }
                className="mt-6 w-full rounded-lg bg-orange-500 px-4 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing
                  ? "Creating Your Order..."
                  : "I Have Made the Transfer"}
              </button>


              <p className="mt-4 text-center text-xs text-gray-500">
                Your order will remain pending until your
                bank transfer is manually verified.
              </p>


              <Link
                href="/cart"
                className="mt-4 block text-center text-sm font-semibold text-blue-600 hover:underline"
              >
                ← Return to Cart
              </Link>


            </div>


          </div>


        </form>
      </div>
    </main>
  );
}
