import { Outlet, useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/sections/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Toaster } from "@/components/ui/toaster";

export function Layout() {
  const location = useLocation();
  const hideWhatsApp = location.pathname === "/shop" || location.pathname === "/admin";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Outlet />
      <Footer />
      {!hideWhatsApp && <WhatsAppButton phoneNumber="27769681973" message="Hi! I'm interested in RealTV subscription." />}
      <Toaster />
    </div>
  );
}
