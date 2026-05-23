import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Loader2, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface OrderDetails {
  reference: string;
  productName: string;
  price: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  paxiPoint?: string;
  subscriptions?: string[];
  tvBoxes?: string[];
  standardSubPlanIds?: string[];
  hasTVBox?: boolean;
  hasSubscription?: boolean;
  timestamp: number;
}

export default function OrderSuccess() {
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [status, setStatus] = useState<"loading" | "verifying" | "success" | "error" | "no-order">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const processOrder = async () => {
      // Get order details from localStorage
      const storedOrder = localStorage.getItem("pendingTVBoxOrder");
      
      if (!storedOrder) {
        setStatus("no-order");
        return;
      }

      const order: OrderDetails = JSON.parse(storedOrder);
      setOrderDetails(order);

      // Only process if order is less than 1 hour old
      const isRecent = Date.now() - order.timestamp < 60 * 60 * 1000;
      
      if (!isRecent) {
        setStatus("error");
        setErrorMessage("Order has expired. Please try again.");
        localStorage.removeItem("pendingTVBoxOrder");
        return;
      }

      setStatus("verifying");

      try {
        // Yoco redirected here = payment succeeded
        // Mark order as paid in database
        await supabase
          .from("tv_box_orders")
          .update({ payment_status: "paid" })
          .eq("payment_reference", order.reference);

        // Extend line for standard subscriptions
        if (order.standardSubPlanIds && order.standardSubPlanIds.length > 0 && order.email) {
          for (const planId of order.standardSubPlanIds) {
            try {
              console.log(`Extending line for ${order.email}, plan: ${planId}`);
              const extendResponse = await fetch(
                "https://bdtgjltygenmxlrifeds.supabase.co/functions/v1/extend-line",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    userEmail: order.email,
                    planId: planId,
                  }),
                }
              );
              const extendResult = await extendResponse.json();
              if (extendResult.success) {
                console.log(`Line extended successfully:`, extendResult);
              } else {
                console.error(`Failed to extend line:`, extendResult);
              }
            } catch (extendError) {
              console.error(`Error extending line:`, extendError);
            }
          }
        }

        // Send WhatsApp notifications (admin + customer).
        // The webhook may also attempt this, but the notified flag prevents duplicates.
        try {
          await fetch(
            "https://bdtgjltygenmxlrifeds.supabase.co/functions/v1/send-order-notification",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reference: order.reference }),
            }
          );
        } catch (waError) {
          console.error("WhatsApp notification failed:", waError);
        }

        // Clear the stored order
        localStorage.removeItem("pendingTVBoxOrder");
        setStatus("success");
      } catch (err) {
        console.error("Error:", err);
        setStatus("error");
        setErrorMessage("Something went wrong. Please contact support.");
      }
    };

    processOrder();
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (status === "verifying") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground mb-2">Verifying payment with Yoco...</p>
          <p className="text-sm text-muted-foreground">Attempt {attempts + 1} of 15</p>
        </div>
      </div>
    );
  }

  if (status === "no-order") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">No Order Found</h1>
          <p className="text-muted-foreground mb-6">
            We couldn't find any pending orders. If you just made a payment, please contact support.
          </p>
          <Button onClick={() => navigate("/")} size="lg" className="w-full">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">Something Went Wrong</h1>
          <p className="text-muted-foreground mb-6">{errorMessage}</p>
          <Button onClick={() => navigate("/")} size="lg" className="w-full">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
        </div>
        
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Payment Successful!
        </h1>
        
        <p className="text-muted-foreground mb-6">
          Thank you for your order, {orderDetails?.fullName}!
        </p>

        {orderDetails?.hasSubscription && (
          <div className="bg-card rounded-lg p-4 mb-4 text-left border border-border">
            <p className="text-sm text-muted-foreground mb-1">Subscription:</p>
            <p className="text-foreground font-semibold">{orderDetails.subscriptions?.join(", ")}</p>
            <p className="text-sm text-green-500 mt-1">Your subscription has been activated</p>
          </div>
        )}

        {orderDetails?.hasTVBox && (
          <>
            <div className="bg-card rounded-lg p-4 mb-4 text-left border border-border">
              <p className="text-sm text-muted-foreground mb-1">TV Box:</p>
              <p className="text-foreground font-semibold">{orderDetails.tvBoxes?.join(", ")}</p>
            </div>
            <div className="bg-card rounded-lg p-4 mb-4 text-left border border-border">
              <p className="text-sm text-muted-foreground mb-1">Paxi Collection Point:</p>
              <p className="text-foreground">{orderDetails?.paxiPoint || orderDetails?.address}</p>
            </div>
          </>
        )}

        <p className="text-sm text-muted-foreground mb-6">
          We've sent your order details via WhatsApp. You'll receive a confirmation 
          and delivery updates soon.
        </p>

        <Button onClick={() => navigate("/")} size="lg" className="w-full">
          Back to Home
        </Button>
      </div>
    </div>
  );
}
