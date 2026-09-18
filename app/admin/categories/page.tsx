"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Folder,
  Plus,
  RefreshCw,
  Package,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Category {
  name: string;
  productCount: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError("");

      // Get all products and their categories
      const { data, error } = await supabase
        .from("products")
        .select("category");

      if (error) {
        console.error("Error loading categories:", error);
        setError("Could not load categories.");
        return;
      }

      // Create a map so we can count products in each category
      const categoryMap = new Map<string, number>();

      data?.forEach((product) => {
        if (
          product.category &&
          typeof product.category === "string" &&
          product.category.trim() !== ""
        ) {
          const categoryName = product.category.trim();

          categoryMap.set(
            categoryName,
            (categoryMap.get(categoryName) || 0) + 1
          );
        }
      });

      // Convert map into array
      const categoryList: Category[] = Array.from(categoryMap.entries())
        .map(([name, productCount]) => ({
          name,
          productCount,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setCategories(categoryList);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Something went wrong while loading categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Categories
          </h1>

          <p className="mt-1 text-gray-600">
            View and manage your store categories.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-100"
          >
            <ArrowLeft size={18} />
            Dashboard
          </Link>

          <button
            onClick={loadCategories}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={18}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <Link
            href="/admin/categories/add"
            className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-3 font-medium text-white transition hover:bg-orange-600"
          >
            <Plus size={18} />
            Add Category
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total Categories
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {categories.length}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Categories With Products
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {categories.filter(
              (category) => category.productCount > 0
            ).length}
          </p>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <RefreshCw
            size={32}
            className="mx-auto mb-4 animate-spin text-blue-600"
          />

          <p className="text-gray-600">
            Loading categories...
          </p>
        </div>
      ) : categories.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <Folder size={32} className="text-orange-500" />
          </div>

          <h2 className="text-xl font-semibold text-gray-900">
            No categories yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-gray-500">
            You don't have any product categories yet.
            Create your first category to get started.
          </p>

          <Link
            href="/admin/categories/add"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 font-medium text-white transition hover:bg-orange-600"
          >
            <Plus size={18} />
            Add Category
          </Link>
        </div>
      ) : (
        /* Category List */
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Store Categories
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Categories currently used by your products.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <div
                key={category.name}
                className="group rounded-xl border border-gray-200 bg-white p-5 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
              >
                {/* Icon */}
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                  <Folder
                    size={24}
                    className="text-blue-600"
                  />
                </div>

                {/* Category Name */}
                <h3 className="text-lg font-semibold text-gray-900">
                  {category.name}
                </h3>

                {/* Product Count */}
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                  <Package size={16} />

                  <span>
                    {category.productCount}{" "}
                    {category.productCount === 1
                      ? "product"
                      : "products"}
                  </span>
                </div>

                {/* View Products */}
                <Link
                  href={`/shop?category=${encodeURIComponent(
                    category.name
                  )}`}
                  className="mt-5 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  View Products →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

