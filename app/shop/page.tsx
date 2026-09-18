"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ShoppingCart,
  Package,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/components/store/CartContext";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  old_price?: number | null;
  oldPrice?: number | null;
  stock: number;
  category: string | null;
  image: string | null;
}

function ShopContent() {
  const searchParams = useSearchParams();

  // ==========================================
  // GET CATEGORY FROM URL
  // ==========================================

  const category = searchParams.get("category");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { addToCart } = useCart();

  // ==========================================
  // LOAD PRODUCTS
  // ==========================================

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");

        let query = supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });

        // Filter by category
        if (category) {
          query = query.eq("category", category);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error loading products:", error);

          setError("Could not load products.");
          setProducts([]);

          return;
        }

        setProducts((data as Product[]) || []);
      } catch (err) {
        console.error("Unexpected error:", err);

        setError(
          "Something went wrong while loading products."
        );

        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [category]);

  // ==========================================
  // FORMAT PRICE
  // ==========================================

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // ==========================================
  // ADD TO CART
  // ==========================================

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image || "",
    });
  };

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">

        {/* ==========================================
            HEADER
        ========================================== */}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>

            {/* Back to Shop */}

            <div className="mb-3">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                <ArrowLeft size={16} />
                Back to Shop
              </Link>
            </div>

            {/* Page Title */}

            <h1 className="text-3xl font-bold text-gray-900">
              {category || "All Products"}
            </h1>

            {/* Description */}

            <p className="mt-1 text-gray-600">
              {category
                ? `Products available in the ${category} category.`
                : "Browse all products in our store."}
            </p>

          </div>
        </div>

        {/* ==========================================
            ERROR
        ========================================== */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ==========================================
            LOADING
        ========================================== */}

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">

            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

            <p className="text-gray-600">
              Loading products...
            </p>

          </div>
        ) : products.length === 0 ? (

          /* ==========================================
             NO PRODUCTS
          ========================================== */

          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
              <Package
                size={32}
                className="text-orange-500"
              />
            </div>

            <h2 className="text-xl font-semibold text-gray-900">
              No products found
            </h2>

            <p className="mt-2 text-gray-500">
              There are currently no products in{" "}
              {category
                ? `the ${category} category`
                : "our store"}.
            </p>

            <Link
              href="/shop"
              className="mt-6 inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
            >
              Browse All Products
            </Link>

          </div>

        ) : (

          /* ==========================================
             PRODUCTS
          ========================================== */

          <div>

            {/* Product Count */}

            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {products.length}{" "}
                {products.length === 1
                  ? "product"
                  : "products"}{" "}
                found
              </p>
            </div>

            {/* Product Grid */}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

              {products.map((product) => {

                const oldPrice =
                  product.old_price ??
                  product.oldPrice ??
                  null;

                return (
                  <div
                    key={product.id}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >

                    {/* ==================================
                        PRODUCT IMAGE
                    ================================== */}

                    <div className="relative flex h-56 items-center justify-center bg-gray-100">

                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400">

                          <Package size={45} />

                          <span className="mt-2 text-sm">
                            No image
                          </span>

                        </div>
                      )}

                    </div>

                    {/* ==================================
                        PRODUCT DETAILS
                    ================================== */}

                    <div className="p-5">

                      {/* Category */}

                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-blue-600">
                        {product.category ||
                          "Uncategorized"}
                      </p>

                      {/* Product Name */}

                      <h2 className="line-clamp-2 min-h-[48px] text-lg font-semibold text-gray-900">
                        {product.name}
                      </h2>

                      {/* Description */}

                      {product.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                          {product.description}
                        </p>
                      )}

                      {/* Price */}

                      <div className="mt-4 flex items-center gap-2">

                        <span className="text-xl font-bold text-gray-900">
                          {formatPrice(product.price)}
                        </span>

                        {oldPrice &&
                          Number(oldPrice) >
                            Number(product.price) && (
                            <span className="text-sm text-gray-400 line-through">
                              {formatPrice(
                                Number(oldPrice)
                              )}
                            </span>
                          )}

                      </div>

                      {/* Stock */}

                      <p
                        className={`mt-2 text-sm font-medium ${
                          product.stock > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {product.stock > 0
                          ? `${product.stock} in stock`
                          : "Out of stock"}
                      </p>

                      {/* Add To Cart */}

                      <button
                        type="button"
                        onClick={() =>
                          handleAddToCart(product)
                        }
                        disabled={product.stock <= 0}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        <ShoppingCart size={18} />

                        {product.stock > 0
                          ? "Add to Cart"
                          : "Out of Stock"}
                      </button>

                    </div>
                  </div>
                );
              })}

            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// ==========================================
// SHOP PAGE
// ==========================================

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="text-center">

            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

            <p className="text-gray-700">
              Loading shop...
            </p>

          </div>
        </main>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
