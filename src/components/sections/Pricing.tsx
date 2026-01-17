import { PricingCard } from "@/components/PricingCard";

const plans = [
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

export function Pricing() {
  const generatePaymentUrl = (amount: number, planTitle: string) => {
    const reference = planTitle.toLowerCase().replace(/\\s+/g, '-');
    return `https://pay.yoco.com/realtv?amount=${amount}&reference=${encodeURIComponent(reference)}`;
  };

  return (
    <section id="pricing" className="relative py-20 px-4">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
            Simple, Transparent{" "}
            <span className="gradient-text">Pricing</span>
          </h2>
          <p className="text-muted-foreground md:text-lg">
            Choose the plan that works for you
          </p>
        </div>

        {/* Pricing grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 justify-center">
          {plans.map((plan, index) => (
            <PricingCard
              key={plan.title}
              title={plan.title}
              price={plan.price}
              period={plan.period}
              features={plan.features}
              href={plan.isTrial ? "#download" : generatePaymentUrl(plan.amount, plan.title)}
              popular={plan.popular}
              badge={plan.badge}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
              isTrial={plan.isTrial}
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
