"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface DashboardStats {
  product_count: number;
  order_count: number;
  customer_count: number;
  revenue: number;
  low_stock_count: number;
}

export default function AdminDashboard() {
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats>({
    product_count: 0,
    order_count: 0,
    customer_count: 0,
    revenue: 0,
    low_stock_count: 0,
  });

  const [loading, setLoading] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // CHECK ADMIN ACCESS
  // ==========================================

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        setCheckingAccess(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        // --------------------------------------
        // NOT LOGGED IN
        // --------------------------------------

        if (!user) {
          router.replace("/login");
          return;
        }

        // --------------------------------------
        // CHECK SUPABASE AUTH ROLE
        // --------------------------------------

        const role = user.app_metadata?.role;

        if (role !== "admin") {
          console.warn("Unauthorized admin access attempt:", user.email);

          router.replace("/");
          return;
        }

        // --------------------------------------
        // USER IS ADMIN
        // --------------------------------------

        setCheckingAccess(false);
      } catch (err) {
        console.error("Admin access check failed:", err);

        setError("We could not verify your admin permissions.");
        router.replace("/");
      }
    };

    checkAdminAccess();
  }, [router]);

  // ==========================================
  // LOAD DASHBOARD
  // ==========================================

  useEffect(() => {
    if (checkingAccess) return;

    loadDashboard();
  }, [checkingAccess]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const { data, error } = await supabase.rpc(
        "get_admin_dashboard_stats"
      );

      if (error) {
        console.error("Dashboard error:", error);

        setError(
          "Could not load dashboard statistics. Please try again."
        );

        return;
      }

      if (data) {
        setStats({
          product_count: Number(data.product_count || 0),
          order_count: Number(data.order_count || 0),
          customer_count: Number(data.customer_count || 0),
          revenue: Number(data.revenue || 0),
          low_stock_count: Number(data.low_stock_count || 0),
        });
      }
    } catch (err) {
      console.error("Dashboard loading error:", err);

      setError("Could not load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FORMAT CURRENCY
  // ==========================================

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString("en-NG")}`;
  };

  // ==========================================
  // WAIT WHILE CHECKING ADMIN
  // ==========================================

  if (checkingAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="text-3xl">🔐</div>

          <h1 className="mt-4 text-lg font-bold text-gray-900">
            Checking permissions...
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Verifying your admin account.
          </p>
        </div>
      </main>
    );
  }

  // ==========================================
  // DASHBOARD CARDS
  // ==========================================

  const dashboardCards = [
    {
      title: "Products",
      value: stats.product_count,
      icon: "📦",
    },
    {
      title: "Orders",
      value: stats.order_count,
      icon: "🛍️",
    },
    {
      title: "Customers",
      value: stats.customer_count,
      icon: "👥",
    },
    {
      title: "Revenue",
      value: formatCurrency(stats.revenue),
      icon: "💰",
    },
  ];

  // ==========================================
  // ADMIN DASHBOARD
  // ==========================================

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                ASCOHOMES Admin
              </h1>

              <p className="mt-2 text-gray-600">
                Manage your store and monitor your business.
              </p>
            </div>

            <Link
              href="/"
              className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-center text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
            >
              View Store
            </Link>

          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <strong>Dashboard error:</strong> {error}
          </div>
        )}

        {/* DASHBOARD OVERVIEW */}

        <section>
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Dashboard Overview
          </h2>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

            {dashboardCards.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">

                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {card.title}
                    </p>

                    <p className="mt-2 text-2xl font-bold text-gray-900">
                      {loading ? "..." : card.value}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-lg">
                    {card.icon}
                  </div>

                </div>
              </div>
            ))}

          </div>
        </section>

        {/* LOW STOCK */}

        <section className="mt-8">
          <div className="rounded-2xl bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-gray-600">
                  Low Stock Products
                </p>

                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {loading ? "..." : stats.low_stock_count}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50 text-lg">
                ⚠️
              </div>

            </div>

            <p className="mt-2 text-sm text-gray-500">
              Products with 5 or fewer items remaining.
            </p>

          </div>
        </section>

        {/* STORE MANAGEMENT */}

        <section className="mt-10">

          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Store Management
          </h2>

          <div className="grid gap-5 md:grid-cols-3">

            {/* PRODUCTS */}

            <div className="rounded-2xl bg-white p-6 shadow-sm">

              <div className="text-3xl">
                📦
              </div>

              <h3 className="mt-4 text-lg font-bold text-gray-900">
                Products
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                Add, edit, delete and manage your products.
              </p>

              <Link
                href="/admin/products"
                className="mt-5 inline-block rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Manage Products
              </Link>

            </div>

            {/* CATEGORIES */}

            <div className="rounded-2xl bg-white p-6 shadow-sm">

              <div className="text-3xl">
                🗂️
              </div>

              <h3 className="mt-4 text-lg font-bold text-gray-900">
                Categories
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                Create and manage your store categories.
              </p>

              <Link
                href="/admin/categories"
                className="mt-5 inline-block rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                Manage Categories
              </Link>

            </div>

            {/* ORDERS */}

            <div className="rounded-2xl bg-white p-6 shadow-sm">

              <div className="text-3xl">
                🛍️
              </div>

              <h3 className="mt-4 text-lg font-bold text-gray-900">
                Orders
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                View orders, payments and delivery information.
              </p>

              <Link
                href="/admin/orders"
                className="mt-5 inline-block rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Manage Orders
              </Link>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}
