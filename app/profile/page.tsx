"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profile = {
  full_name: string | null;
  phone: string | null;
};

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ==========================================
  // LOAD PROFILE
  // ==========================================

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        // Get currently logged-in user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Could not get user:", userError);
          setError("Could not verify your account.");
          setLoading(false);
          return;
        }

        // ==========================================
        // NOT LOGGED IN
        // ==========================================

        if (!user) {
          router.replace("/login");
          return;
        }

        // ==========================================
        // USER INFORMATION
        // ==========================================

        setEmail(user.email || "");

        // ==========================================
        // LOAD CUSTOMER PROFILE
        // ==========================================

        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Profile query error:", profileError);

          setError(
            "Could not load your profile information. Please try again."
          );

          setLoading(false);
          return;
        }

        // ==========================================
        // PROFILE EXISTS
        // ==========================================

        if (data) {
          setProfile(data);

          setFullName(data.full_name || "");
          setPhone(data.phone || "");
        } else {
          // ==========================================
          // PROFILE DOES NOT EXIST YET
          // ==========================================

          setProfile({
            full_name: null,
            phone: null,
          });

          setFullName("");
          setPhone("");
        }
      } catch (err) {
        console.error("Profile loading error:", err);

        setError("Could not load your profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  // ==========================================
  // SAVE PROFILE
  // ==========================================

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setSaving(true);

    try {
      // Get logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setError("Could not verify your account.");
        setSaving(false);
        return;
      }

      // ==========================================
      // NOT LOGGED IN
      // ==========================================

      if (!user) {
        setError("You are not logged in.");
        setSaving(false);
        return;
      }

      // ==========================================
      // UPDATE PROFILE
      // ==========================================

      const { data: updatedProfile, error: profileError } =
        await supabase
          .from("profiles")
          .upsert(
            {
              id: user.id,
              full_name: fullName.trim(),
              phone: phone.trim(),
            },
            {
              onConflict: "id",
            }
          )
          .select("full_name, phone")
          .single();

      if (profileError) {
        console.error("Profile update error:", profileError);

        setError(profileError.message);
        setSaving(false);
        return;
      }

      // ==========================================
      // UPDATE EMAIL
      // ==========================================

      if (email.trim() !== (user.email || "")) {
        const { error: emailError } =
          await supabase.auth.updateUser({
            email: email.trim(),
          });

        if (emailError) {
          console.error("Email update error:", emailError);

          setError(emailError.message);
          setSaving(false);
          return;
        }

        setMessage(
          "Profile updated. Please check your email to confirm your new email address."
        );
      } else {
        setMessage("Profile updated successfully! ✅");
      }

      // ==========================================
      // UPDATE LOCAL STATE
      // ==========================================

      if (updatedProfile) {
        setProfile(updatedProfile);

        setFullName(updatedProfile.full_name || "");
        setPhone(updatedProfile.phone || "");
      }
    } catch (err) {
      console.error("Profile save error:", err);

      setError("Something went wrong while saving your profile.");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = async () => {
    setError("");
    setMessage("");
    setLoggingOut(true);

    try {
      const { error: logoutError } =
        await supabase.auth.signOut();

      if (logoutError) {
        setError(logoutError.message);
        setLoggingOut(false);
        return;
      }

      router.replace("/");
    } catch (err) {
      console.error("Logout error:", err);

      setError("Could not log you out.");
      setLoggingOut(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="mt-4 text-gray-700">
            Loading profile...
          </p>
        </div>
      </main>
    );
  }

  // ==========================================
  // PROFILE PAGE
  // ==========================================

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl bg-white p-6 shadow-md sm:p-8">

          {/* Header */}

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              My Profile
            </h1>

            <p className="mt-2 text-gray-600">
              Manage your ASCOHOMES account information.
            </p>
          </div>

          {/* Profile Form */}

          <form
            onSubmit={handleSave}
            className="mt-8 space-y-5"
          >

            {/* Full Name */}

            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Full Name
              </label>

              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) =>
                  setFullName(e.target.value)
                }
                placeholder="Enter your full name"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Email */}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter your email"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-2 text-xs text-gray-500">
                Changing your email may require email confirmation.
              </p>
            </div>

            {/* Phone */}

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Phone Number
              </label>

              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder="Enter your phone number"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Error */}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Success */}

            {message && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                {message}
              </div>
            )}

            {/* Save */}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving Changes..."
                : "Save Changes"}
            </button>
          </form>

          {/* Continue Shopping */}

          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-4 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-semibold text-gray-900 transition hover:bg-gray-50"
          >
            Continue Shopping
          </button>

          {/* Logout */}

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-4 w-full rounded-lg bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loggingOut
              ? "Logging Out..."
              : "Logout"}
          </button>

        </div>
      </div>
    </main>
  );
}
