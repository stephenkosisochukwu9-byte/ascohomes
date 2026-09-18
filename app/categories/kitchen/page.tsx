"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
};

export default function KitchenPage() {
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addedProduct, setAddedProduct] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, description, price, old_price, stock, category, image"
        )
        .eq("category", "Kitchen")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Could not load kitchen products:", error);
        setError(error.message);
        setLoading(false);
        return;
      }

      setProducts(data || []);
      setLoading(false);
    };

    loadProducts();
  }, []);

  const handleAddToCart = (product: Product) => {
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

  const formatAmount = (amount: number) => {
    return `₦${Number(amount).toLocaleString("en-NG")}`;
  };

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Added Notification */}
      {addedProduct && (
        <div className="fixed left-4 right-4 top-20 z-50 mx-auto max-w-sm rounded-xl bg-green-600 px-4 py-3 text-center text-sm font-bold text-white shadow-lg sm:left-auto sm:right-6 sm:mx-0">
          ✓ {addedProduct} added to cart
        </div>
      )}

      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between px-3 py-2 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight sm:text-2xl"
          >
            <span className="text-blue-700">ASCO</span>
            <span className="text-orange-500">HOMES</span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/orders"
              className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-gray-800 transition hover:bg-gray-100"
            >
              <span className="text-xs font-semibold sm:text-sm">
                My Orders
              </span>
            </Link>

            <Link
              href="/cart"
              aria-label="Shopping cart"
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-800 transition hover:bg-gray-100"
            >
              🛒
            </Link>

            <Link
              href="/profile"
              aria-label="Account"
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-800 transition hover:bg-gray-100"
            >
              👤
            </Link>
          </div>
        </div>
      </header>

      {/* Page Header */}
      <section className="border-b border-gray-100 bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/categories"
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            ← All Categories
          </Link>

          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Kitchen
          </h1>

          <p className="mt-2 text-gray-600">
            Shop kitchen essentials and appliances for your home.
          </p>
        </div>
      </section>

      {/* Products */}
      <section className="px-3 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {loading ? (
            <div className="py-16 text-center">
              <p className="text-gray-700">
                Loading kitchen products...
              </p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              {error}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 p-10 text-center">
              <div className="text-5xl">🍳</div>

              <h2 className="mt-5 text-xl font-bold text-gray-900">
                No kitchen products yet
              </h2>

              <p className="mt-2 text-gray-600">
                Products added from the admin dashboard will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                >
                  {/* Image */}
                  <div className="flex aspect-square items-center justify-center bg-gray-100">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-3xl sm:text-5xl">🍳</div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-2 sm:p-4">
                    <h2 className="line-clamp-2 text-xs font-bold text-gray-900 sm:text-base">
                      {product.name}
                    </h2>

                    <div className="mt-2">
                      <p className="text-xs font-bold text-gray-900 sm:text-base">
                        {formatAmount(product.price)}
                      </p>

                      {product.old_price !== null && (
                        <p className="text-[10px] text-gray-500 line-through sm:text-sm">
                          {formatAmount(product.old_price)}
                        </p>
                      )}
                    </div>

                    <p
                      className={`mt-2 text-[10px] font-semibold sm:text-xs ${
                        product.stock > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {product.stock > 0
                        ? `${product.stock} in stock`
                        : "Out of stock"}
                    </p>

                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock <= 0}
                      className="mt-3 w-full rounded-lg bg-blue-600 px-2 py-2 text-[10px] font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 sm:px-3 sm:py-2.5 sm:text-sm"
                    >
                      {product.stock > 0
                        ? "Add to Cart"
                        : "Out of Stock"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
