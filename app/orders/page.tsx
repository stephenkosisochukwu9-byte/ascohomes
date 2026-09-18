"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Order = {
  id: string;
  total_amount: number;
  status: string;
  payment_status: string;
  delivery_address: string | null;
  created_at: string;
};

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, total_amount, status, payment_status, delivery_address, created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setOrders(data || []);
      setLoading(false);
    };

    loadOrders();
  }, [router]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatAmount = (amount: number) => {
    return `₦${Number(amount).toLocaleString("en-NG")}`;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <p className="text-gray-700">Loading your orders...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            My Orders
          </h1>

          <p className="mt-2 text-gray-600">
            View your ASCOHOMES order history.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-md">
            <div className="text-5xl">🛍️</div>

            <h2 className="mt-5 text-xl font-bold text-gray-900">
              You haven't placed any orders yet.
            </h2>

            <p className="mt-2 text-gray-600">
              Your orders will appear here after you complete a purchase.
            </p>

            <Link
              href="/"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl bg-white p-5 shadow-md sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Order ID
                    </p>

                    <p className="mt-1 break-all text-sm font-semibold text-gray-900">
                      #{order.id}
                    </p>

                    <p className="mt-2 text-sm text-gray-600">
                      {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-sm text-gray-500">
                      Total
                    </p>

                    <p className="text-xl font-bold text-gray-900">
                      {formatAmount(order.total_amount)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">
                      Order Status
                    </p>

                    <p className="mt-1 font-semibold capitalize text-gray-900">
                      {order.status}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">
                      Payment
                    </p>

                    <p className="mt-1 font-semibold capitalize text-gray-900">
                      {order.payment_status}
                    </p>
                  </div>
                </div>

                {order.delivery_address && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-500">
                      Delivery Address
                    </p>

                    <p className="mt-1 text-sm text-gray-900">
                      {order.delivery_address}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-center font-semibold text-gray-900 transition hover:bg-gray-50"
          >
            Continue Shopping
          </Link>

          <Link
            href="/profile"
            className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
          >
            My Profile
          </Link>
        </div>
      </div>
    </main>
  );
}
