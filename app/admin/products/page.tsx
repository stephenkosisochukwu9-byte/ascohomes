"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [currentImage, setCurrentImage] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, description, price, old_price, stock, category, image"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Could not load products:", error);
      setError(error.message);
      setLoading(false);
      return;
    }

    setProducts(data || []);
    setLoading(false);
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setOldPrice("");
    setStock("");
    setCategory("");
    setImageFile(null);
    setImagePreview("");
    setCurrentImage("");
    setEditingProduct(null);
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setError("");
    setImageFile(file);

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please enter a product name.");
      return;
    }

    if (!price || Number(price) < 0) {
      setError("Please enter a valid price.");
      return;
    }

    if (!stock || Number(stock) < 0) {
      setError("Please enter a valid stock quantity.");
      return;
    }

    if (!category) {
      setError("Please select a category.");
      return;
    }

    setSaving(true);

    let imageUrl: string | null = null;

    try {
      if (imageFile) {
        const fileExtension = imageFile.name.split(".").pop();

        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExtension}`;

        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(filePath, imageFile);

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from("products")
          .getPublicUrl(filePath);

        imageUrl = publicUrlData.publicUrl;
      }

      const { error: insertError } = await supabase
        .from("products")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          price: Number(price),
          old_price: oldPrice ? Number(oldPrice) : null,
          stock: Number(stock),
          category,
          image: imageUrl,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      resetForm();
      setShowForm(false);

      setSuccess("Product added successfully!");

      await loadProducts();

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Could not add product:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while adding the product."
      );
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (product: Product) => {
    setEditingProduct(product);

    setName(product.name);
    setDescription(product.description || "");
    setPrice(String(product.price));
    setOldPrice(
      product.old_price !== null ? String(product.old_price) : ""
    );
    setStock(String(product.stock));
    setCategory(product.category || "");

    setCurrentImage(product.image || "");
    setImageFile(null);
    setImagePreview("");

    setError("");
    setSuccess("");
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingProduct) {
      return;
    }

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please enter a product name.");
      return;
    }

    if (!price || Number(price) < 0) {
      setError("Please enter a valid price.");
      return;
    }

    if (!stock || Number(stock) < 0) {
      setError("Please enter a valid stock quantity.");
      return;
    }

    if (!category) {
      setError("Please select a category.");
      return;
    }

    setSaving(true);

    try {
      let imageUrl = currentImage || null;

      if (imageFile) {
        const fileExtension = imageFile.name.split(".").pop();

        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExtension}`;

        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(filePath, imageFile);

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from("products")
          .getPublicUrl(filePath);

        imageUrl = publicUrlData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("products")
        .update({
          name: name.trim(),
          description: description.trim() || null,
          price: Number(price),
          old_price: oldPrice ? Number(oldPrice) : null,
          stock: Number(stock),
          category,
          image: imageUrl,
        })
        .eq("id", editingProduct.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      resetForm();
      setShowForm(false);

      setSuccess("Product updated successfully!");

      await loadProducts();

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Could not update product:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while updating the product."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setDeletingId(product.id);

    try {
      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      setProducts((currentProducts) =>
        currentProducts.filter(
          (item) => item.id !== product.id
        )
      );

      setSuccess("Product deleted successfully!");

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Could not delete product:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while deleting the product."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const formatAmount = (amount: number) => {
    return `₦${Number(amount).toLocaleString("en-NG")}`;
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Products
              </h1>

              <p className="mt-2 text-gray-600">
                Manage the products available in your ASCOHOMES store.
              </p>
            </div>

            <button
              onClick={() => {
                if (showForm) {
                  resetForm();
                  setShowForm(false);
                } else {
                  setShowForm(true);
                  setError("");
                  setSuccess("");
                }
              }}
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              {showForm ? "Close Form" : "+ Add Product"}
            </button>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
            ✓ {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Add / Edit Product Form */}
        {showForm && (
          <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-gray-900">
              {editingProduct
                ? "Edit Product"
                : "Add New Product"}
            </h2>

            <form
              onSubmit={
                editingProduct
                  ? handleUpdateProduct
                  : handleAddProduct
              }
              className="mt-6 grid gap-5 md:grid-cols-2"
            >
              {/* Product Name */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-900">
                  Product Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="e.g. Electric Blender"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-900">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Describe the product"
                  rows={4}
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Price */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">
                  Price
                </label>

                <input
                  type="number"
                  value={price}
                  onChange={(e) =>
                    setPrice(e.target.value)
                  }
                  placeholder="35000"
                  min="0"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Old Price */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">
                  Old Price
                </label>

                <input
                  type="number"
                  value={oldPrice}
                  onChange={(e) =>
                    setOldPrice(e.target.value)
                  }
                  placeholder="40000"
                  min="0"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Stock */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">
                  Stock
                </label>

                <input
                  type="number"
                  value={stock}
                  onChange={(e) =>
                    setStock(e.target.value)
                  }
                  placeholder="20"
                  min="0"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Category */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">
                  Category
                </label>

                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    Select category
                  </option>

                  <option value="Cleaning Supplies">
                    Cleaning Supplies
                  </option>

                  <option value="Bathroom">
                    Bathroom
                  </option>

                  <option value="Kitchen">
                    Kitchen
                  </option>

                  <option value="Appliances">
                    Appliances
                  </option>

                  <option value="Home & Storage">
                    Home & Storage
                  </option>
                </select>
              </div>

              {/* Product Image */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-900">
                  Product Image
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-blue-700"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Select an image from your computer or phone.
                  Maximum size: 5MB.
                </p>

                {/* New Image Preview */}
                {imagePreview && (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-semibold text-gray-900">
                      New Image Preview
                    </p>

                    <img
                      src={imagePreview}
                      alt="New product preview"
                      className="h-48 w-full rounded-xl border border-gray-200 object-cover sm:w-64"
                    />
                  </div>
                )}

                {/* Current Image */}
                {!imagePreview && currentImage && (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-semibold text-gray-900">
                      Current Image
                    </p>

                    <img
                      src={currentImage}
                      alt="Current product"
                      className="h-48 w-full rounded-xl border border-gray-200 object-cover sm:w-64"
                    />
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex flex-col gap-3 pt-2 sm:flex-row md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? editingProduct
                      ? "Updating Product..."
                      : "Adding Product..."
                    : editingProduct
                    ? "Update Product"
                    : "Add Product"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                    setError("");
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-900 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Product Count */}
        <div className="mb-5 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
          {products.length} product
          {products.length === 1 ? "" : "s"}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-gray-700">
              Loading products...
            </p>
          </div>
        ) : products.length === 0 ? (
          /* Empty State */
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">📦</div>

            <h2 className="mt-5 text-xl font-bold text-gray-900">
              No products found
            </h2>

            <p className="mt-2 text-gray-600">
              Click "Add Product" to add your first product.
            </p>
          </div>
        ) : (
          /* Product List */
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm"
              >
                {/* Product Image */}
                <div className="flex h-48 items-center justify-center bg-gray-100">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-5xl">📦</div>
                  )}
                </div>

                {/* Product Information */}
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                    {product.category ||
                      "Uncategorized"}
                  </p>

                  <h2 className="mt-2 line-clamp-2 text-lg font-bold text-gray-900">
                    {product.name}
                  </h2>

                  {product.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                      {product.description}
                    </p>
                  )}

                  <div className="mt-4">
                    <p className="text-lg font-bold text-gray-900">
                      {formatAmount(product.price)}
                    </p>

                    {product.old_price !== null && (
                      <p className="text-sm text-gray-500 line-through">
                        {formatAmount(
                          product.old_price
                        )}
                      </p>
                    )}
                  </div>

                  {/* Stock */}
                  <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <span className="text-sm font-medium text-gray-600">
                      Stock
                    </span>

                    <span
                      className={`text-sm font-bold ${
                        product.stock <= 5
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {product.stock}
                    </span>
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() =>
                      startEditing(product)
                    }
                    className="mt-4 w-full rounded-lg border border-blue-600 bg-white px-4 py-2.5 text-sm font-bold text-blue-600 transition hover:bg-blue-50"
                  >
                    Edit Product
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() =>
                      handleDeleteProduct(product)
                    }
                    disabled={
                      deletingId === product.id
                    }
                    className="mt-2 w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === product.id
                      ? "Deleting..."
                      : "Delete Product"}
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
