"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    const requestedPath = new URLSearchParams(window.location.search).get("next");
    const destination =
      requestedPath?.startsWith("/admin/") && !requestedPath.startsWith("//")
        ? requestedPath
        : "/admin/landing";

    router.refresh();
    router.push(destination);
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8"
      >
        <h1 className="text-2xl font-semibold">Paradise Internal Login</h1>

        <label className="mt-6 block text-sm text-neutral-300">
          Email
          <input
            className="mt-2 w-full rounded-lg bg-black border border-white/10 px-4 py-3 text-white"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="mt-4 block text-sm text-neutral-300">
          Password
          <input
            className="mt-2 w-full rounded-lg bg-black border border-white/10 px-4 py-3 text-white"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {errorMessage && (
          <p className="mt-4 text-sm text-red-400">{errorMessage}</p>
        )}

        <button
          type="submit"
          className="mt-6 w-full rounded-lg bg-[#fb5411] px-4 py-3 font-semibold text-white hover:bg-[#e64d0f]"
        >
          Log in
        </button>
      </form>
    </main>
  );
}
