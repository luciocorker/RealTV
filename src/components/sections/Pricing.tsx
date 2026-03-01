import { PricingCard } from "@/components/PricingCard";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Zap, Monitor } from "lucide-react";

const standardPlans = [
  {
    title: "Standard Monthly",
    price: "R130",
    amount: 130,
    period: "month",
    features: [
      "1000+ live channels",
      "Movies & series library",
      "HD streaming",
      <span key="devices"><span className="font-bold text-cyan-400">1 TV + 1 Mobile</span> (Android only)</span>,
    ],
  },
  {
    title: "Premium Monthly",
    price: "R250",
    amount: 250,
    period: "month",
    features: [
      "1000+ live channels",
      "Movies & series library",
      "HD & 4K streaming",
      <span key="devices"><span className="font-bold text-cyan-400">2 TVs + 2 Mobiles</span> (Android only)</span>,
    ],
    popular: true,
    badge: "Popular",
  },
  {
    title: "6-Month Plan",
    price: "R700",
    amount: 700,
    period: "6 months",
    features: [
      "Everything in Premium",
      "Save R800",
      "HD & 4K streaming",
      <span key="devices"><span className="font-bold text-cyan-400">1 TV + 1 Mobile</span> (Android only)</span>,
    ],
  },
  {
    title: "Yearly Plan",
    price: "R1300",
    amount: 1300,
    period: "year",
    features: [
      "Everything in Premium",
      "Save R1800",
      "Priority support",
      <span key="devices"><span className="font-bold text-cyan-400">1 TV + 1 Mobile</span> (Android only)</span>,
    ],
    badge: "Best Value",
  },
];

const dstvPremiumPlans = [
  {
    title: "Standard Monthly",
    price: "R300",
    amount: 300,
    period: "month",
    features: [
      "Full DStv Premium package",
      "Movies & series library",
      "HD & 4K channels",
      "No buffering",
      <span key="devices"><span className="font-bold text-cyan-400">1 TV</span> (TV only, no mobile)</span>,
    ],
  },
  {
    title: "Premium Monthly",
    price: "R600",
    amount: 600,
    period: "month",
    features: [
      "Full DStv Premium package",
      "Movies & series library",
      "HD & 4K channels",
      "No buffering",
      <span key="devices"><span className="font-bold text-cyan-400">2 TVs</span> (TV only, no mobile)</span>,
    ],
    popular: true,
    badge: "Popular",
  },
  {
    title: "6-Month Plan",
    price: "R1750",
    amount: 1750,
    period: "6 months",
    features: [
      "Full DStv Premium package",
      "Movies & series library",
      "HD & 4K channels",
      "No buffering",
      <span key="devices"><span className="font-bold text-cyan-400">2 TVs</span> (TV only, no mobile)</span>,
    ],
  },
  {
    title: "Yearly Plan",
    price: "R3400",
    amount: 3400,
    period: "year",
    features: [
      "Full DStv Premium package",
      "Movies & series library",
      "HD & 4K channels",
      "No buffering",
      <span key="devices"><span className="font-bold text-cyan-400">2 TVs</span> (TV only, no mobile)</span>,
    ],
    badge: "Best Value",
  },
];

export function Pricing() {
  const [activeTab, setActiveTab] = useState<"standard" | "dstv">("standard");
  
  const generatePaymentUrl = (amount: number, planTitle: string) => {
    const prefix = activeTab === "dstv" ? "dstv-premium-" : "";
    const reference = prefix + planTitle.toLowerCase().replace(/\s+/g, '-');
    return `https://pay.yoco.com/realtv?amount=${amount}&reference=${encodeURIComponent(reference)}`;
  };

  const plans = activeTab === "standard" ? standardPlans : dstvPremiumPlans;

  return (
    <section id="pricing" className="relative py-20 px-4">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-8 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
            Simple, Transparent{" "}
            <span className="gradient-text">Pricing</span>
          </h2>
          <p className="text-muted-foreground md:text-lg">
            Choose the plan that works for you
          </p>
        </div>

        {/* Account Type Comparison */}
        <div className="mb-12 grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {/* Standard Account Card */}
          <div className="rounded-xl bg-card p-6 border border-border">
            <h3 className="mb-4 font-display text-xl font-semibold text-foreground flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              Standard Accounts
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>1000+ live channels from around the world</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Movies & series library included</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>HD & 4K streaming quality</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong className="text-foreground">Works on TV + Mobile</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Best for variety & flexibility</span>
              </li>
            </ul>
            <p className="mt-4 text-xs text-muted-foreground/80">Starting from R130/month</p>
          </div>

          {/* DStv Premium Card */}
          <div className="rounded-xl bg-card p-6 border border-primary/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg font-medium">
              Premium
            </div>
            <h3 className="mb-4 font-display text-xl font-semibold text-foreground flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              DStv Premium Package
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Full DStv Premium channels (SuperSport, M-Net, etc.)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Movies & series library included</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>HD & 4K channels available</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong className="text-foreground">No buffering - smooth streaming</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">!</span>
                <span><strong className="text-foreground">TV only</strong> (no mobile support)</span>
              </li>
            </ul>
            <p className="mt-4 text-xs text-muted-foreground/80">Starting from R300/month</p>
          </div>
        </div>

        {/* Pricing Tabs */}
        <div className="mb-10 flex justify-center">
          <div className="inline-flex rounded-lg bg-secondary p-1">
            <button
              onClick={() => setActiveTab("standard")}
              className={cn(
                "rounded-md px-6 py-2.5 text-sm font-medium transition-all",
                activeTab === "standard"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Standard Accounts
            </button>
            <button
              onClick={() => setActiveTab("dstv")}
              className={cn(
                "rounded-md px-6 py-2.5 text-sm font-medium transition-all",
                activeTab === "dstv"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              DStv Premium Package
            </button>
          </div>
        </div>

        {/* Tab description */}
        <p className="mb-8 text-center text-sm text-muted-foreground">
          {activeTab === "standard" 
            ? "Access to 1000+ live channels, movies & series" 
            : "Full DStv Premium package with all premium channels"}
        </p>

        {/* Pricing grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 justify-center">
          {plans.map((plan, index) => (
            <PricingCard
              key={`${activeTab}-${plan.title}`}
              title={plan.title}
              price={plan.price}
              period={plan.period}
              features={plan.features}
              href={generatePaymentUrl(plan.amount, plan.title)}
              popular={plan.popular}
              badge={plan.badge}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            />
          ))}
        </div>
        
        {/* Sign up notice */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Download the app to create your account and start streaming
        </p>
      </div>
    </section>
  );
}
