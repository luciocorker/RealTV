import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import FeaturesPage from "./pages/Features";
import ChannelsPage from "./pages/Channels";
import ShopPage from "./pages/Shop";
import AccountPage from "./pages/Account";
import DownloadPage from "./pages/Download";
import SetupPage from "./pages/Setup";
import NotFound from "./pages/NotFound";
import OrderSuccess from "./pages/OrderSuccess";
import AdminPage from "./pages/Admin";
import { ComingSoonModal } from "./components/ComingSoonModal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <CartProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {/* TODO: Remove ComingSoonModal once website is ready */}
      <ComingSoonModal />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/channels" element={<ChannelsPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/download" element={<DownloadPage />} />
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
