"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/components/store/CartContext";

type PaymentState = "loading" | "success" | "error";

type VerificationResult = {
  success?: boolean;
  reference?: string;
  order_id?: string;
  amount?: number;
  payment_status?: string;
  message?: string;
  error?: string;
};

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();

  const [status, setStatus] = useState<PaymentState>("loading");
  const [result, setResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    const reference =
      searchParams.get("reference") ||
      searchParams.get("trxref");

    if (!reference) {
      setStatus("error");
      setResult({
        error: "No payment reference was found.",
      });
      return;
    }

    const verifyPayment = async () => {
      try {
        console.log("Verifying Paystack reference:", reference);

        const response = await fetch(
          `/api/paystack/verify?reference=${encodeURIComponent(reference)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data: VerificationResult = await response.json();

        console.log("Payment verification response:", data);

        setResult(data);

        if (!response.ok || !data.success) {
          setStatus("error");
          return;
        }

        // Payment successfully verified.
        clearCart();

        setStatus("success");
      } catch (error) {
        console.error("Payment verification failed:", error);

        setStatus("error");

        setResult({
          error:
            "Something went wrong while verifying the payment. Please check your order.",
        });
      }
    };

    verifyPayment();
  }, [searchParams, clearCart]);

  const formatAmount = (amount?: number) => {
    if (typeof amount !== "number") {
      return "₦0";
    }

    return `₦${(amount / 100).toLocaleString("en-NG")}`;
  };

  // ================================
  // LOADING
  // ================================

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
          <div className="w-full rounded-2xl bg-white p-8 text-center shadow-md sm:p-10">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            </div>

            <h1 className="mt-6 text-3xl font-bold text-gray-900">
              Verifying Your Payment
            </h1>

            <p className="mt-3 text-gray-600">
              Please wait while we confirm your payment with Paystack.
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Do not close or refresh this page.
            </p>

          </div>
        </div>
      </main>
    );
  }

  // ================================
  // SUCCESS
  // ================================

  if (status === "success") {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
          <div className="w-full rounded-2xl bg-white p-8 text-center shadow-md sm:p-10">

            {/* Success Icon */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-10 w-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h1 className="mt-6 text-3xl font-bold text-gray-900">
              Payment Successful!
            </h1>

            <p className="mt-3 text-gray-600">
              Thank you for your order. Your payment has been successfully
              verified.
            </p>

            {/* Order Information */}
            <div className="mt-8 rounded-xl bg-gray-50 p-5 text-left">

              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <span className="text-sm text-gray-600">
                  Order ID
                </span>

                <span className="max-w-[65%] break-all text-right text-sm font-semibold text-gray-900">
                  #{result?.order_id || "N/A"}
                </span>
              </div>

              <div className="flex items-center justify-between pt-4">
                <span className="text-sm text-gray-600">
                  Amount Paid
                </span>

                <span className="text-lg font-bold text-blue-700">
                  {formatAmount(result?.amount)}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                <span className="text-sm text-gray-600">
                  Payment Status
                </span>

                <span className="font-semibold capitalize text-green-600">
                  Paid
                </span>
              </div>

            </div>

            {/* Confirmation */}
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-semibold text-green-800">
                ✓ Payment confirmed
              </p>

              <p className="mt-1 text-xs text-green-700">
                Your order has been received and is now being processed.
              </p>
            </div>

            {/* Buttons */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2">

              <Link
                href="/orders"
                className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                View My Orders
              </Link>

              <Link
                href="/"
                className="rounded-lg border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50"
              >
                Continue Shopping
              </Link>

            </div>

            <p className="mt-6 text-xs text-gray-500">
              Keep your order ID for future reference.
            </p>

          </div>
        </div>
      </main>
    );
  }

  // ================================
  // ERROR
  // ================================

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
        <div className="w-full rounded-2xl bg-white p-8 text-center shadow-md sm:p-10">

          {/* Error Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-10 w-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Payment Verification Failed
          </h1>

          <p className="mt-3 text-gray-600">
            We could not confirm this payment.
          </p>

          {result?.error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                Verification Error
              </p>

              <p className="mt-2 text-sm text-red-700">
                {result.error}
              </p>
            </div>
          )}

          {result?.message && !result?.error && (
            <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-left">
              <p className="text-sm text-yellow-800">
                {result.message}
              </p>
            </div>
          )}

          <p className="mt-6 text-sm text-gray-500">
            If money was deducted from your account, please do not pay again
            immediately. Check your orders first.
          </p>

          {/* Buttons */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2">

            <Link
              href="/orders"
              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Check My Orders
            </Link>

            <Link
              href="/"
              className="rounded-lg border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              Back to Home
            </Link>

          </div>

        </div>
      </div>
    </main>
  );
}

// ========================================
// PAGE WRAPPER
// ========================================

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 px-4 py-10">
          <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
            <div className="w-full rounded-2xl bg-white p-8 text-center shadow-md sm:p-10">

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
              </div>

              <h1 className="mt-6 text-2xl font-bold text-gray-900">
                Loading Payment
              </h1>

              <p className="mt-3 text-gray-600">
                Please wait...
              </p>

            </div>
          </div>
        </main>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}
