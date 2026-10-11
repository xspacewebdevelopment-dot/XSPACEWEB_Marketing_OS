import { EmailVerificationNav } from "@/components/dashboard/email-verification-nav";

export const metadata = {
  title: "Email Verification | NexaReach Marketing OS",
  description: "Enterprise email verification, cleaning, and deliverability protection",
};

export default function EmailVerificationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <EmailVerificationNav />
      <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </div>
    </div>
  );
}
