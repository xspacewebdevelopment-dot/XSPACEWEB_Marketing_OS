import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/home/Hero";
import { SocialProof } from "@/components/home/SocialProof";
import { ProductOverview } from "@/components/home/ProductOverview";
import { Statistics } from "@/components/home/Statistics";
import { Visibility } from "@/components/home/Visibility";
import { GrowthStack } from "@/components/home/GrowthStack";
import { CoreFeatures } from "@/components/home/CoreFeatures";
import { PowerPack } from "@/components/home/PowerPack";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Testimonials } from "@/components/home/Testimonials";
import { Integrations } from "@/components/home/Integrations";
import { Pricing } from "@/components/home/Pricing";
import { FAQ } from "@/components/home/FAQ";
import { Blog } from "@/components/home/Blog";
import { Contact } from "@/components/home/Contact";
import { FinalCTA } from "@/components/home/FinalCTA";
import { Footer } from "@/components/layout/Footer";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-white text-slate-900 selection:bg-slate-200 selection:text-black">
      {/* 1. Global Fixed Floating App Bar / Navigation */}
      <Navbar />

      <main>
        {/* Full-Screen Minimal Black-and-White Hero Section with Background Video */}
        <Hero />

        {/* 4. Social Proof Infinite Marquee */}
        <SocialProof />

        {/* 5. Product Introduction & Overview Detail Cards */}
        <ProductOverview />

        {/* 6. Statistics & Credibility Counters Strip */}
        <Statistics />

        {/* 7. Sales Visibility & Operational Insights (Asymmetric Media) */}
        <Visibility />

        {/* 8. AI-Powered Growth Stack Switcher */}
        <GrowthStack />

        {/* 9. Core Features Bento Grid (6 Cards) */}
        <CoreFeatures />

        {/* 10. Power Pack Capabilities (Dual-column Sticky Storytelling) */}
        <PowerPack />

        {/* 11. How It Works (3 Connected Steps) */}
        <HowItWorks />

        {/* 12. Testimonials & Customer Results Carousel */}
        <Testimonials />

        {/* 13. Integrations Hub & Connectivity Node Grid */}
        <Integrations />

        {/* 14. Simple Pricing with Monthly/Yearly Discount Toggle */}
        <Pricing />

        {/* 15. FAQs Accordion */}
        <FAQ />

        {/* 16. Blog & Editorial Insights Cards */}
        <Blog />

        {/* 17. Contact Us Section */}
        <Contact />

        {/* 18. Final CTA Banner with Fluted Ribbon Stage */}
        <FinalCTA />
      </main>

      {/* 19. Multi-Column Footer with Watermark Branding */}
      <Footer />
    </div>
  );
}
