"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";

import { useCart } from "@/components/store/CartContext";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  old_price: number | null;
  stock: number;
  category: string | null;
  image: string | null;
  created_at: string;
};

export default function Home() {
  const { addToCart } = useCart();

  // =========================
  // USER
  // =========================
  const [user, setUser] = useState<User | null>(null);

  // =========================
  // CART NOTIFICATION
  // =========================
  const [addedProduct, setAddedProduct] = useState<string | null>(null);

  // =========================
  // PRODUCTS
  // =========================
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // =========================================================
  // CHECK AUTHENTICATED USER
  // =========================================================
  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (mounted) {
        setUser(user);
      }
    };

    loadUser();

    // Listen for login/logout/auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        if (mounted) {
          setUser(session?.user ?? null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // =========================================================
  // LOAD HOMEPAGE PRODUCTS
  // =========================================================
  useEffect(() => {
    loadHomepageProducts();
  }, []);

  const loadHomepageProducts = async () => {
    setProductsLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, description, price, old_price, stock, category, image, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) {
      console.error("Could not load homepage products:", error);
      setProductsLoading(false);
      return;
    }

    const allProducts = data || [];

    setPopularProducts(allProducts.slice(0, 4));
    setBestSellers(allProducts.slice(4, 8));

    setProductsLoading(false);
  };

  // =========================================================
  // ADD PRODUCT TO CART
  // =========================================================
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      return;
    }

    addToCart({
      name: product.name,
      price: Number(product.price),
      image: product.image || undefined,
    });

    setAddedProduct(product.name);

    setTimeout(() => {
      setAddedProduct(null);
    }, 2000);
  };

  // =========================================================
  // FORMAT PRICE
  // =========================================================
  const formatAmount = (amount: number) => {
    return `₦${Number(amount).toLocaleString("en-NG")}`;
  };

  // =========================================================
  // PRODUCT CARD
  // =========================================================
  const ProductCard = ({ product }: { product: Product }) => {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* Product Image */}
        <div className="aspect-square overflow-hidden bg-gray-100">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition duration-300 hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl text-gray-400 sm:text-5xl">
              📦
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="p-2 sm:p-4">
          <h3 className="line-clamp-2 text-xs font-semibold text-gray-900 sm:text-base">
            {product.name}
          </h3>

          {/* Price */}
          <div className="mt-1">
            <p className="text-xs font-bold text-gray-900 sm:text-base">
              {formatAmount(product.price)}
            </p>

            {product.old_price !== null && (
              <p className="text-[10px] text-gray-500 line-through sm:text-sm">
                {formatAmount(product.old_price)}
              </p>
            )}
          </div>

          {/* Stock */}
          {product.stock <= 0 ? (
            <p className="mt-1 text-[10px] font-bold text-red-600 sm:text-xs">
              Out of stock
            </p>
          ) : (
            <p className="mt-1 text-[10px] font-medium text-gray-500 sm:text-xs">
              {product.stock} in stock
            </p>
          )}

          {/* Add To Cart Button */}
          <button
            type="button"
            onClick={() => handleAddToCart(product)}
            disabled={product.stock <= 0}
            className="mt-2 w-full rounded-lg bg-blue-700 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-800 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-400 sm:py-2 sm:text-sm"
          >
            {product.stock <= 0 ? "Out of Stock" : "Add"}
          </button>
        </div>
      </div>
    );
  };

  // =========================================================
  // PAGE
  // =========================================================
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* =====================================================
          CART NOTIFICATION
      ====================================================== */}
      {addedProduct && (
        <div className="fixed left-4 right-4 top-20 z-50 mx-auto max-w-sm rounded-xl bg-green-600 px-4 py-3 text-center text-sm font-bold text-white shadow-lg sm:left-auto sm:right-6 sm:mx-0">
          ✓ {addedProduct} added to cart
        </div>
      )}

      {/* =====================================================
          HEADER
      ====================================================== */}
      <header className="w-full border-b border-gray-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between px-3 py-2 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-bold tracking-tight sm:text-2xl"
          >
            <span className="text-blue-700">ASCO</span>
            <span className="text-orange-500">HOMES</span>
          </Link>

          {/* Header Actions */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* My Orders */}
            <Link
              href="/orders"
              aria-label="My Orders"
              className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-gray-800 transition hover:bg-gray-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-5 w-5 sm:h-6 sm:w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7.5 12 12l9-4.5M12 12v9"
                />
              </svg>

              <span className="text-xs font-semibold text-gray-800 sm:text-sm">
                My Orders
              </span>
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              aria-label="Shopping cart"
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-800 transition hover:bg-gray-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .95.343 1.08.836l.46 1.738m0 0L6.75 12.75h10.5l2.25-7.176H5.176m0 0L4.716 5.25m2.034 7.5h10.5m-9 3.75h.008v.008H8.25v-.008Zm8.25 0h.008v.008H16.5v-.008Z"
                />
              </svg>
            </Link>

            {/* Account */}
            <Link
              href={user ? "/profile" : "/login"}
              aria-label="Account"
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-800 transition hover:bg-gray-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.118a7.5 7.5 0 0 1 15 0"
                />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* =====================================================
          SEARCH
      ====================================================== */}
      <section className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        <div className="relative">
          <input
            type="search"
            placeholder="Search for products..."
            className="w-full rounded-xl border border-gray-300 bg-gray-50 py-3 pl-11 pr-4 text-gray-900 outline-none placeholder:text-gray-500 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />

          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-600"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-4.35-4.35m1.35-5.4a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Z"
            />
          </svg>
        </div>
      </section>

      {/* =====================================================
          SHOP BY CATEGORY
      ====================================================== */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Shop by Category
        </h2>

        <p className="mt-2 text-gray-600">
          Find everything you need for your home.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4">
          {/* Cleaning */}
          <Link
            href="/categories/cleaning"
            className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-left transition hover:border-blue-600 hover:bg-blue-50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl">
              🧹
            </div>

            <h3 className="mt-4 text-base font-semibold text-gray-900">
              Cleaning Supplies
            </h3>

            <p className="mt-1 text-sm text-gray-600">
              Keep your home clean
            </p>
          </Link>

          {/* Bathroom */}
          <Link
            href="/categories/bathroom"
            className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-left transition hover:border-blue-600 hover:bg-blue-50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-2xl">
              🚿
            </div>

            <h3 className="mt-4 text-base font-semibold text-gray-900">
              Bathroom
            </h3>

            <p className="mt-1 text-sm text-gray-600">
              Bathroom essentials
            </p>
          </Link>

          {/* Kitchen */}
          <Link
            href="/categories/kitchen"
            className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-left transition hover:border-blue-600 hover:bg-blue-50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-2xl">
              🍳
            </div>

            <h3 className="mt-4 text-base font-semibold text-gray-900">
              Kitchen
            </h3>

            <p className="mt-1 text-sm text-gray-600">
              Kitchen essentials
            </p>
          </Link>

          {/* Appliances */}
          <Link
            href="/categories/appliances"
            className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-left transition hover:border-blue-600 hover:bg-blue-50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl">
              ⚡
            </div>

            <h3 className="mt-4 text-base font-semibold text-gray-900">
              Appliances
            </h3>

            <p className="mt-1 text-sm text-gray-600">
              Useful home appliances
            </p>
          </Link>

          {/* Home & Storage */}
          <Link
            href="/categories/home-storage"
            className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-left transition hover:border-blue-600 hover:bg-blue-50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-2xl">
              📦
            </div>

            <h3 className="mt-4 text-base font-semibold text-gray-900">
              Home & Storage
            </h3>

            <p className="mt-1 text-sm text-gray-600">
              Organize and improve your home
            </p>
          </Link>
        </div>
      </section>

      {/* =====================================================
          POPULAR PRODUCTS
      ====================================================== */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Popular Products
          </h2>

          <Link
            href="/categories"
            className="text-sm font-semibold text-blue-700 transition hover:text-blue-800"
          >
            See all
          </Link>
        </div>

        <p className="mt-2 text-gray-600">
          Shop products our customers love.
        </p>

        {productsLoading ? (
          <div className="mt-6 rounded-xl bg-gray-50 p-8 text-center">
            <p className="font-semibold text-gray-700">
              Loading products...
            </p>
          </div>
        ) : popularProducts.length === 0 ? (
          <div className="mt-6 rounded-xl bg-gray-50 p-8 text-center">
            <p className="font-semibold text-gray-700">
              No products available yet.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
            {popularProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}
      </section>

      {/* =====================================================
          BEST SELLERS
      ====================================================== */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Best Sellers
          </h2>

          <Link
            href="/categories"
            className="text-sm font-semibold text-blue-700 transition hover:text-blue-800"
          >
            See all
          </Link>
        </div>

        <p className="mt-2 text-gray-600">
          Our most popular products right now.
        </p>

        {productsLoading ? (
          <div className="mt-6 rounded-xl bg-gray-50 p-8 text-center">
            <p className="font-semibold text-gray-700">
              Loading products...
            </p>
          </div>
        ) : bestSellers.length === 0 ? (
          <div className="mt-6 rounded-xl bg-gray-50 p-8 text-center">
            <p className="font-semibold text-gray-700">
              Best sellers will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
            {bestSellers.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}
      </section>

      {/* =====================================================
          WHY ASCOHOMES
      ====================================================== */}
      <section className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Why ASCOHOMES?
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-gray-600">
              Everything you need for your home, conveniently in one place.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {/* Quality */}
            <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-2xl">
                ✓
              </div>

              <h3 className="mt-4 font-semibold text-gray-900">
                Quality Products
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                Carefully selected products for your home.
              </p>
            </div>

            {/* Affordable */}
            <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-2xl">
                ₦
              </div>

              <h3 className="mt-4 font-semibold text-gray-900">
                Affordable Prices
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                Great products at prices you can afford.
              </p>
            </div>

            {/* Delivery */}
            <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-2xl">
                🚚
              </div>

              <h3 className="mt-4 font-semibold text-gray-900">
                Reliable Delivery
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                Get your household essentials delivered to you.
              </p>
            </div>

            {/* Convenience */}
            <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-2xl">
                🛍️
              </div>

              <h3 className="mt-4 font-semibold text-gray-900">
                Easy Shopping
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                Find and order what you need with ease.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}
      <footer className="bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="text-2xl font-bold">
                <span className="text-blue-400">ASCO</span>
                <span className="text-orange-400">HOMES</span>
              </div>

              <p className="mt-3 max-w-xs text-sm leading-6 text-gray-300">
                Everything your home needs, all in one place.
              </p>
            </div>

            {/* Shop */}
            <div>
              <h3 className="font-semibold text-white">
                Shop
              </h3>

              <ul className="mt-4 space-y-3 text-sm text-gray-300">
                <li>
                  <Link
                    href="/categories"
                    className="hover:text-white"
                  >
                    All Products
                  </Link>
                </li>

                <li>
                  <Link
                    href="/categories"
                    className="hover:text-white"
                  >
                    Categories
                  </Link>
                </li>

                <li>
                  <Link
                    href="/categories"
                    className="hover:text-white"
                  >
                    Popular Products
                  </Link>
                </li>

                <li>
                  <Link
                    href="/categories"
                    className="hover:text-white"
                  >
                    Best Sellers
                  </Link>
                </li>
              </ul>
            </div>

            {/* Help */}
            <div>
              <h3 className="font-semibold text-white">
                Help
              </h3>

              <ul className="mt-4 space-y-3 text-sm text-gray-300">
                <li>
                  <button
                    type="button"
                    className="hover:text-white"
                  >
                    Contact Us
                  </button>
                </li>

                <li>
                  <button
                    type="button"
                    className="hover:text-white"
                  >
                    Delivery Information
                  </button>
                </li>

                <li>
                  <button
                    type="button"
                    className="hover:text-white"
                  >
                    Returns
                  </button>
                </li>

                <li>
                  <button
                    type="button"
                    className="hover:text-white"
                  >
                    FAQs
                  </button>
                </li>
              </ul>
            </div>

            {/* Account */}
            <div>
              <h3 className="font-semibold text-white">
                Account
              </h3>

              <ul className="mt-4 space-y-3 text-sm text-gray-300">
                <li>
                  <Link
                    href={user ? "/profile" : "/login"}
                    className="hover:text-white"
                  >
                    My Account
                  </Link>
                </li>

                <li>
                  <Link
                    href="/orders"
                    className="hover:text-white"
                  >
                    My Orders
                  </Link>
                </li>

                <li>
                  <Link
                    href="/cart"
                    className="hover:text-white"
                  >
                    Shopping Cart
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="mt-10 border-t border-gray-700 pt-6 text-center">
            <p className="text-sm text-gray-400">
              © 2026 ASCOHOMES. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
