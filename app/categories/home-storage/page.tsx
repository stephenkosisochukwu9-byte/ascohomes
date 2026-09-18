"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/components/store/CartContext";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  old_price: number | null;
  stock: number;
  category: string | null;
  image: string | null;
};

export default function HomeStoragePage() {
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, description, price, old_price, stock, category, image"
      )
      .eq("category", "Home & Storage")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Could not load home and storage products:", error);
      setLoading(false);
      return;
    }

    setProducts(data || []);
    setLoading(false);
  };

  const handleAddToCart = (product: Product) => {
    addToCart({
      name: product.name,
      price: Number(product.price),
      image: product.image || undefined,
    });

    setMessage(`${product.name} added to cart!`);

    setTimeout(() => {
      setMessage("");
    }, 2000);
  };

  const formatAmount = (amount: number) => {
    return `₦${Number(amount).toLocaleString("en-NG")}`;
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-xl font-bold sm:text-2xl"
          >
            <span className="text-blue-700">ASCO</span>
            <span className="text-orange-500">HOMES</span>
          </Link>

          <Link
            href="/cart"
            className="text-sm font-bold text-blue-600 hover:underline"
          >
            View Cart
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back */}
        <Link
          href="/categories"
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          ← All Categories
        </Link>

        {/* Title */}
        <div className="mt-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Home & Storage
          </h1>

          <p className="mt-2 text-gray-600">
            Smart storage and home essentials to keep your space organized.
          </p>
        </div>

        {/* Success Message */}
        {message && (
          <div className="fixed right-4 top-24 z-50 rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white shadow-lg">
            ✓ {message}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="mt-10 rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="font-semibold text-gray-700">
              Loading products...
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="mt-10 rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">📦</div>

            <h2 className="mt-5 text-xl font-bold text-gray-900">
              No home and storage products yet
            </h2>

            <p className="mt-2 text-gray-600">
              Products added from the Admin Dashboard will appear here.
            </p>
          </div>
        ) : (
          /* Product Grid */
          <div className="mt-8 grid grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="overflow-hidden rounded-xl bg-white shadow-sm"
              >
                {/* Product Image */}
                <div className="aspect-square overflow-hidden bg-gray-100">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl sm:text-5xl">
                      📦
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-2 sm:p-4">
                  <h2 className="line-clamp-2 text-xs font-bold text-gray-900 sm:text-base">
                    {product.name}
                  </h2>

                  <div className="mt-2">
                    <p className="text-xs font-bold text-blue-700 sm:text-base">
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
                    <p className="mt-2 text-[10px] font-bold text-red-600 sm:text-xs">
                      Out of stock
                    </p>
                  ) : (
                    <p className="mt-2 text-[10px] font-semibold text-gray-500 sm:text-xs">
                      {product.stock} in stock
                    </p>
                  )}

                  {/* Add to Cart */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock <= 0}
                    className="mt-3 w-full rounded-lg bg-blue-600 px-2 py-2 text-[10px] font-bold text-white transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-400 sm:px-3 sm:py-2.5 sm:text-sm"
                  >
                    {product.stock <= 0
                      ? "Out of Stock"
                      : "Add to Cart"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
