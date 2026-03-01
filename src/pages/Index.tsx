import { Hero } from "@/components/sections/Hero";
import { Features } from "@/components/sections/Features";
import { Channels } from "@/components/sections/Channels";
import { Pricing } from "@/components/sections/Pricing";
import { DownloadSection } from "@/components/sections/Download";
import { Setup } from "@/components/sections/Setup";
import { Footer } from "@/components/sections/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <Features />
      <Channels />
      <Pricing />
      <DownloadSection />
      <Setup />
      <Footer />
      
      <WhatsAppButton phoneNumber="27123456789" message="Hi! I'm interested in RealTV subscription." />
      <Toaster />
    </div>
  );
};

export default Index;
