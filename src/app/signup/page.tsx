"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
  </svg>
);

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-blue-500/70 focus-within:bg-blue-500/10">
    {children}
  </div>
);

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    alert("Google authentication is being configured. Please sign up with your email and password.");
  };

  return (
    <div className="relative min-h-screen w-full bg-background">
      {/* Top Navigation Back Link */}
      <div className="absolute top-5 left-5 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background/80 hover:bg-foreground/10 border border-border backdrop-blur-md text-xs font-medium text-foreground/80 hover:text-foreground transition-all shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-blue-600" />
          <span>Back to <span className="text-blue-600 font-bold">NexaReach</span></span>
        </Link>
      </div>

      <div className="h-[100dvh] flex flex-col md:flex-row font-sans w-[100dvw] overflow-hidden bg-background text-foreground">
        {/* Left column: sign-up form */}
        <section className="flex-1 flex items-center justify-center p-6 md:p-8 overflow-y-auto">
          <div className="w-full max-w-md">
            <div className="flex flex-col gap-6">
              {/* Branding and Title */}
              <div className="space-y-3">
                <Link href="/" className="inline-flex items-center gap-2.5 mb-1 group">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform">
                    <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <g transform="rotate(-35 12 12)">
                        <rect x="5" y="5" width="5.5" height="14" rx="2.75" />
                        <rect x="13.5" y="5" width="5.5" height="14" rx="2.75" />
                      </g>
                    </svg>
                  </div>
                  <span className="font-bold text-2xl tracking-tight text-blue-600">
                    NexaReach
                  </span>
                </Link>
                <div className="font-bold tracking-tight text-foreground text-3xl md:text-4xl">
                  Create your <span className="text-blue-600 dark:text-blue-400">Account</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Start scaling your campaigns with lead intelligence and verified reach.
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs font-medium">
                  {error}
                </div>
              )}

              <form className="space-y-4 md:space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                  <GlassInputWrapper>
                    <input
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none"
                    />
                  </GlassInputWrapper>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Password</label>
                  <GlassInputWrapper>
                    <div className="relative">
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-3 flex items-center cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                        ) : (
                          <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                        )}
                      </button>
                    </div>
                  </GlassInputWrapper>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 py-4 font-semibold text-white shadow-lg shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              <div className="relative flex items-center justify-center">
                <span className="w-full border-t border-border"></span>
                <span className="px-4 text-sm text-muted-foreground bg-background absolute">Or continue with</span>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignUp}
                className="w-full flex items-center justify-center gap-3 border border-border rounded-2xl py-4 hover:bg-secondary transition-colors cursor-pointer"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-blue-600 dark:text-blue-400 hover:underline transition-colors font-semibold"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* Right column: high-resolution 3D wave wallpaper */}
        <section className="hidden md:block flex-1 relative p-4">
          <div
            className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center shadow-2xl border border-white/10 overflow-hidden"
            style={{ backgroundImage: `url('/images/auth-waves.jpg')` }}
          />
        </section>
      </div>
    </div>
  );
}
