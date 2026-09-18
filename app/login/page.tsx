 "use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("Login failed. Please try again.");
        setLoading(false);
        return;
      }

      // ==========================================
      // CHECK USER ROLE
      // ==========================================

      const role = data.user.app_metadata?.role;

      // ==========================================
      // ADMIN
      // ==========================================

      if (role === "admin") {
        router.replace("/admin");
        return;
      }

      // ==========================================
      // CUSTOMER
      // ==========================================

      const redirect = searchParams.get("redirect");

      // Only allow internal redirects.
      // This prevents redirecting users to
      // an external website after login.
      if (
        redirect &&
        redirect.startsWith("/") &&
        !redirect.startsWith("//")
      ) {
        router.replace(redirect);
      } else {
        router.replace("/");
      }
    } catch (err) {
      console.error("Login error:", err);

      setError(
        "Something went wrong while logging in. Please try again."
      );

      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-md sm:p-8">

        {/* Logo */}

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">
            <span className="text-blue-600">ASCO</span>
            <span className="text-orange-500">HOMES</span>
          </h1>

          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Welcome Back
          </h2>

          <p className="mt-2 text-gray-600">
            Login to your ASCOHOMES account
          </p>
        </div>

        {/* Login Form */}

        <form onSubmit={handleLogin} className="space-y-5">

          {/* Email */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900">
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Password */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Forgot Password */}

          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Error */}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Login Button */}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Sign Up */}

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-blue-600 hover:underline"
          >
            Create Account
          </Link>
        </p>
      </div>
    </main>
  );
}

// ==========================================
// LOGIN PAGE
// ==========================================

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="text-center">
            <p className="text-gray-700">
              Loading login...
            </p>
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
