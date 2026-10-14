"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SignInPage, Testimonial } from "@/components/ui/sign-in";

const marketingTestimonials: Testimonial[] = [
  {
    avatarSrc: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    name: "Sarah Chen",
    handle: "@sarahgrowth",
    text: "NexaReach reduced our cold outreach bounce rate to 0.4% and streamlined our bulk email verification completely.",
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    name: "Marcus Vance",
    handle: "@marcusops",
    text: "The real-time Reoon Power Mode integration and Inngest queues handled our 50k subscriber list effortlessly.",
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    name: "David Martinez",
    handle: "@davidmartinez",
    text: "Having lead verification, email workflows, and analytics unified in one dashboard saved us hours every week.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = (formData.get("email") as string) || "";
    const password = (formData.get("password") as string) || "";

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid email or password");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    alert("Google authentication is being configured. Please sign in with your email and password.");
  };

  const handleResetPassword = () => {
    alert("To reset your password, please contact support or sign in with your registered account.");
  };

  const handleCreateAccount = () => {
    router.push("/signup");
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

      <SignInPage
        title={
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
              Sign in to <span className="text-blue-600 dark:text-blue-400">NexaReach</span>
            </div>
          </div>
        }
        description="Access your marketing OS, lead intelligence, and verification engine."
        heroImageSrc="/images/login-waves.jpg"
        testimonials={[]}
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        onResetPassword={handleResetPassword}
        onCreateAccount={handleCreateAccount}
        error={error}
        loading={loading}
      />
    </div>
  );
}
