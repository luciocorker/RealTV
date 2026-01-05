import { useState } from "react";
import { Hero } from "@/components/sections/Hero";
import { Features } from "@/components/sections/Features";
import { Channels } from "@/components/sections/Channels";
import { Pricing } from "@/components/sections/Pricing";
import { DownloadSection } from "@/components/sections/Download";
import { Footer } from "@/components/sections/Footer";
import { TrialModal } from "@/components/TrialModal";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const openTrialModal = () => setIsTrialModalOpen(true);
  const closeTrialModal = () => setIsTrialModalOpen(false);
  
  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  return (
    <div className="min-h-screen bg-background">
      <Hero onStartTrial={openTrialModal} />
      <Features />
      <Channels />
      <Pricing onStartTrial={openTrialModal} onLoginRequired={openLoginModal} />
      <DownloadSection />
      <Footer />
      
      <TrialModal isOpen={isTrialModalOpen} onClose={closeTrialModal} />
      <TrialModal isOpen={isLoginModalOpen} onClose={closeLoginModal} loginOnly />
      <WhatsAppButton phoneNumber="27123456789" message="Hi! I'm interested in RealTV subscription." />
      <Toaster />
    </div>
  );
};

export default Index;
