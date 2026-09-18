"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SupabaseTestPage() {
  const [status, setStatus] = useState("Testing Supabase connection...");

  useEffect(() => {
    const testConnection = async () => {
      const { error } = await supabase.auth.getSession();

      if (error) {
        setStatus(`Supabase error: ${error.message}`);
      } else {
        setStatus("Supabase is connected successfully! ✅");
      }
    };

    testConnection();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          ASCOHOMES Supabase Test
        </h1>

        <p className="text-gray-700">
          {status}
        </p>
      </div>
    </main>
  );
}
