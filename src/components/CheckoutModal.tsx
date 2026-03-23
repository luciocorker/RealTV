import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  price: string;
  amount: number;
}

export function CheckoutModal({
  isOpen,
  onClose,
  productName,
  price,
  amount,
}: CheckoutModalProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    paxiPoint: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaxiMap, setShowPaxiMap] = useState(false);
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^(\+27|0)[0-9]{9}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Please enter a valid SA phone number (e.g., 0812345678)";
    }

    if (!formData.paxiPoint.trim()) {
      newErrors.paxiPoint = "Please select a Paxi point";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    // Generate unique payment reference
    const reference = `tvbox-${productName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

    try {
      // Save order to Supabase
      const { error } = await supabase.from("tv_box_orders").insert({
        product_name: productName,
        price: price,
        amount: amount,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.paxiPoint,
        city: "",
        postal_code: "",
        payment_reference: reference,
        payment_status: "pending",
        notified: false,
      });

      if (error) {
        console.error("Error saving order:", error);
        toast({
          title: "Error",
          description: "Failed to create order. Please try again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Store reference in localStorage for the success page
      localStorage.setItem("pendingTVBoxOrder", JSON.stringify({
        reference,
        productName,
        price,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        paxiPoint: formData.paxiPoint,
        timestamp: Date.now(),
      }));

      // Create Yoco checkout via Edge Function
      const checkoutResponse = await fetch(
        "https://bdtgjltygenmxlrifeds.supabase.co/functions/v1/create-checkout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: amount, // Amount in cents
            reference: reference,
            customerEmail: formData.email,
            customerName: formData.fullName,
            productName: productName,
          }),
        }
      );

      const checkoutData = await checkoutResponse.json();

      if (!checkoutResponse.ok) {
        console.error("Checkout error:", checkoutData);
        toast({
          title: "Payment Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Redirect to Yoco payment page
      window.location.href = checkoutData.redirectUrl;
    } catch (err) {
      console.error("Error:", err);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Order</DialogTitle>
          <DialogDescription>
            {productName} - {price}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              placeholder="John Doe"
            />
            {errors.fullName && (
              <p className="text-sm text-red-500">{errors.fullName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="john@example.com"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (SA only) *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="081 234 5678"
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Nearest PEP Paxi Point *</Label>
            <Input
              value={formData.paxiPoint}
              onChange={(e) => handleChange("paxiPoint", e.target.value)}
              placeholder="e.g. (P6465) PEP CPT BLUE ROUTE MALL"
            />
            <p className="text-xs text-muted-foreground">Use the map below to find your nearest Paxi point, then type the name above.</p>
            {errors.paxiPoint && (
              <p className="text-sm text-red-500">{errors.paxiPoint}</p>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowPaxiMap(!showPaxiMap)}
            >
              {showPaxiMap ? "Hide Map" : "Find Paxi Point on Map"}
            </Button>

            {showPaxiMap && (
              <div className="mt-2 rounded-lg border border-border overflow-hidden">
                <iframe
                  width="100%"
                  height="400"
                  src="https://map.paxi.co.za?size=l,m,s&status=1,3,4&maxordervalue=1000&output=nc"
                  frameBorder="0"
                  allow="geolocation"
                  title="Select Paxi Point"
                />
              </div>
            )}
          </div>

          <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3 text-sm">
            <p className="font-medium text-green-600 dark:text-green-400">🚚 FREE Delivery via PEP Paxi</p>
            <p className="mt-1 text-muted-foreground">Delivery takes 3–5 business days anywhere in South Africa.</p>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Proceed to Payment - ${price}`
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
