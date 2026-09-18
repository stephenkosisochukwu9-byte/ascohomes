"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Order = {
  id: string;
  user_id: string | null;
  total_amount: number | null;
  payment_status: string | null;
  status: string | null;
  delivery_address: string | null;
  created_at: string;
};

const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "completed",
  "cancelled",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, user_id, total_amount, payment_status, status, delivery_address, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Could not load orders:", error);
        setError("Could not load orders.");
        return;
      }

      setOrders(data || []);
    } catch (err) {
      console.error("Orders loading error:", err);
      setError("Something went wrong while loading orders.");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus: string
  ) => {
    try {
      setUpdatingOrderId(orderId);
      setError("");

      const { error } = await supabase
        .from("orders")
        .update({
          status: newStatus,
        })
        .eq("id", orderId);

      if (error) {
        console.error("Could not update order status:", error);
        setError("Could not update the order status.");
        return;
      }

      // Update the order on the page immediately
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
              }
            : order
        )
      );
    } catch (err) {
      console.error("Order status update error:", err);
      setError("Something went wrong while updating the order.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const formatCurrency = (amount: number | null) => {
    return `₦${Number(amount || 0).toLocaleString("en-NG")}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getPaymentStatusClass = (status: string | null) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-700";

      case "pending":
        return "bg-yellow-100 text-yellow-700";

      case "failed":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getOrderStatusClass = (status: string | null) => {
    switch (status) {
      case "processing":
        return "bg-blue-100 text-blue-700";

      case "shipped":
        return "bg-purple-100 text-purple-700";

      case "completed":
        return "bg-green-100 text-green-700";

      case "cancelled":
        return "bg-red-100 text-red-700";

      case "pending":
        return "bg-yellow-100 text-yellow-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Orders
            </h1>

            <p className="mt-2 text-gray-600">
              View and manage customer orders, payments and delivery information.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/admin"
              className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
            >
              ← Dashboard
            </Link>

            <button
              onClick={loadOrders}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* SUMMARY */}

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">

          {/* TOTAL ORDERS */}

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Orders
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {orders.length}
            </p>
          </div>

          {/* PAID ORDERS */}

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Paid Orders
            </p>

            <p className="mt-2 text-2xl font-bold text-green-600">
              {
                orders.filter(
                  (order) => order.payment_status === "paid"
                ).length
              }
            </p>
          </div>

          {/* TOTAL REVENUE */}

          <div className="col-span-2 rounded-2xl bg-white p-5 shadow-sm md:col-span-1">
            <p className="text-sm font-medium text-gray-500">
              Total Revenue
            </p>

            <p className="mt-2 text-2xl font-bold text-blue-600">
              {formatCurrency(
                orders
                  .filter(
                    (order) => order.payment_status === "paid"
                  )
                  .reduce(
                    (total, order) =>
                      total + Number(order.total_amount || 0),
                    0
                  )
              )}
            </p>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* ORDERS */}

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

          {/* LOADING */}

          {loading && (
            <div className="p-10 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

              <p className="mt-4 text-gray-600">
                Loading orders...
              </p>
            </div>
          )}

          {/* EMPTY */}

          {!loading && orders.length === 0 && !error && (
            <div className="p-12 text-center">
              <div className="text-5xl">
                🛍️
              </div>

              <h2 className="mt-4 text-xl font-bold text-gray-900">
                No orders yet
              </h2>

              <p className="mt-2 text-gray-500">
                Customer orders will appear here after they place an order.
              </p>
            </div>
          )}

          {/* ORDERS LIST */}

          {!loading && orders.length > 0 && (
            <>
              {/* DESKTOP TABLE */}

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left">

                      <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                        Order
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                        Customer
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                        Amount
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                        Payment
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                        Status
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                        Date
                      </th>

                    </tr>
                  </thead>

                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                      >

                        {/* ORDER ID */}

                        <td className="px-6 py-5">
                          <p className="max-w-[180px] break-all text-sm font-semibold text-gray-900">
                            #{order.id}
                          </p>
                        </td>

                        {/* CUSTOMER */}

                        <td className="px-6 py-5">
                          <p className="max-w-[150px] break-all text-sm text-gray-700">
                            {order.user_id || "Guest"}
                          </p>
                        </td>

                        {/* AMOUNT */}

                        <td className="px-6 py-5">
                          <p className="text-sm font-bold text-gray-900">
                            {formatCurrency(order.total_amount)}
                          </p>
                        </td>

                        {/* PAYMENT */}

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getPaymentStatusClass(
                              order.payment_status
                            )}`}
                          >
                            {order.payment_status || "unknown"}
                          </span>
                        </td>

                        {/* ORDER STATUS DROPDOWN */}

                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-2">

                            <select
                              value={order.status || "pending"}
                              onChange={(e) =>
                                updateOrderStatus(
                                  order.id,
                                  e.target.value
                                )
                              }
                              disabled={
                                updatingOrderId === order.id
                              }
                              className={`rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold capitalize outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 ${getOrderStatusClass(
                                order.status
                              )}`}
                            >
                              {ORDER_STATUSES.map((status) => (
                                <option
                                  key={status}
                                  value={status}
                                >
                                  {status}
                                </option>
                              ))}
                            </select>

                            {updatingOrderId === order.id && (
                              <p className="text-xs font-medium text-blue-600">
                                Saving...
                              </p>
                            )}

                          </div>
                        </td>

                        {/* DATE */}

                        <td className="px-6 py-5">
                          <p className="whitespace-nowrap text-sm text-gray-600">
                            {formatDate(order.created_at)}
                          </p>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}

              <div className="space-y-4 p-4 md:hidden">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-gray-200 p-4"
                  >

                    {/* ORDER HEADER */}

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-gray-500">
                          Order ID
                        </p>

                        <p className="mt-1 break-all text-sm font-bold text-gray-900">
                          #{order.id}
                        </p>
                      </div>

                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(order.total_amount)}
                      </p>
                    </div>

                    {/* PAYMENT + STATUS */}

                    <div className="mt-4 grid grid-cols-2 gap-4">

                      {/* PAYMENT */}

                      <div>
                        <p className="text-xs text-gray-500">
                          Payment
                        </p>

                        <span
                          className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getPaymentStatusClass(
                            order.payment_status
                          )}`}
                        >
                          {order.payment_status || "unknown"}
                        </span>
                      </div>

                      {/* STATUS */}

                      <div>
                        <p className="text-xs text-gray-500">
                          Order Status
                        </p>

                        <select
                          value={order.status || "pending"}
                          onChange={(e) =>
                            updateOrderStatus(
                              order.id,
                              e.target.value
                            )
                          }
                          disabled={
                            updatingOrderId === order.id
                          }
                          className={`mt-1 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold capitalize outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 ${getOrderStatusClass(
                            order.status
                          )}`}
                        >
                          {ORDER_STATUSES.map((status) => (
                            <option
                              key={status}
                              value={status}
                            >
                              {status}
                            </option>
                          ))}
                        </select>

                        {updatingOrderId === order.id && (
                          <p className="mt-1 text-xs font-medium text-blue-600">
                            Saving...
                          </p>
                        )}
                      </div>
                    </div>

                    {/* CUSTOMER */}

                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <p className="text-xs text-gray-500">
                        Customer
                      </p>

                      <p className="mt-1 break-all text-sm text-gray-700">
                        {order.user_id || "Guest"}
                      </p>
                    </div>

                    {/* DELIVERY ADDRESS */}

                    {order.delivery_address && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500">
                          Delivery Address
                        </p>

                        <p className="mt-1 text-sm text-gray-700">
                          {order.delivery_address}
                        </p>
                      </div>
                    )}

                    {/* DATE */}

                    <div className="mt-3">
                      <p className="text-xs text-gray-500">
                        Date
                      </p>

                      <p className="mt-1 text-sm text-gray-700">
                        {formatDate(order.created_at)}
                      </p>
                    </div>

                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

