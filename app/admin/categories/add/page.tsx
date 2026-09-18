"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, FolderPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AddCategoryPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      setLoading(true);

      const slug = generateSlug(name);

      let imageUrl: string | null = null;

      // Upload image if one was selected
      if (image) {
        const fileExtension = image.name.split(".").pop();
        const fileName = `${slug}-${Date.now()}.${fileExtension}`;

        const { error: uploadError } = await supabase.storage
          .from("categories")
          .upload(fileName, image);

        if (uploadError) {
          console.error("Image upload error:", uploadError);
          setError("Could not upload category image.");
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("categories")
          .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
      }

      // Insert category into database
      const { error: insertError } = await supabase
        .from("categories")
        .insert([
          {
            name: name.trim(),
            description: description.trim() || null,
            slug,
            image: imageUrl,
          },
        ]);

      if (insertError) {
        console.error("Category insert error:", insertError);

        setError(
          insertError.message || "Could not create category."
        );

        return;
      }

      setSuccess("Category created successfully!");

      // Redirect back to categories page
      setTimeout(() => {
        router.push("/admin/categories");
        router.refresh();
      }, 800);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Something went wrong while creating the category.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/categories"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft size={16} />
            Back to Categories
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
              <FolderPlus
                size={26}
                className="text-orange-600"
              />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Add Category
              </h1>

              <p className="mt-1 text-gray-600">
                Create a new category for your store.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8"
        >
          {/* Error */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {/* Category Name */}
          <div className="mb-6">
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Category Name
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Personal Care"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Description
            </label>

            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this category..."
              rows={4}
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              disabled={loading}
            />
          </div>

          {/* Image */}
          <div className="mb-8">
            <label
              htmlFor="image"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Category Image
            </label>

            <label
              htmlFor="image"
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center transition hover:border-blue-400 hover:bg-blue-50"
            >
              <Upload
                size={32}
                className="mb-3 text-gray-400"
              />

              <span className="text-sm font-medium text-gray-700">
                {image
                  ? image.name
                  : "Click to upload an image"}
              </span>

              <span className="mt-1 text-xs text-gray-500">
                PNG, JPG, JPEG or WEBP
              </span>

              <input
                id="image"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setImage(file);
                }}
                disabled={loading}
              />
            </label>
          </div>

          {/* Buttons */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/admin/categories"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-6 py-3 font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FolderPlus size={18} />

              {loading
                ? "Creating..."
                : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
