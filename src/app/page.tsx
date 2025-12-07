
import Frame from "@/components/landing/tabs";
import FAQSection from "@/components/landing/FAQSection";
import Feature from "@/components/landing/Feature";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import PricingSection from "@/components/landing/PricingSection";
import UseCasesSection from "@/components/landing/UseCasesSection";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Frame />
      <main className="relative min-h-screen w-full overflow-hidden scroll-smooth pt-0">
        <HeroSection />
        <Feature />
        <HowItWorksSection />
        <UseCasesSection />
        <PricingSection />
        <FAQSection />
      </main>
      <Footer />
    </>
  );
}