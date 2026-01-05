import { PricingCard } from "@/components/PricingCard";

interface PricingProps {
  onStartTrial: () => void;
}

const plans = [
  {
    title: "24-Hour Trial",
    price: "FREE",
    features: [
      "Full access to all channels",
      "HD streaming quality",
      "All devices supported",
      "24-hour access period",
    ],
    href: "#",
    isTrial: true,
  },
  {
    title: "Standard Monthly",
    price: "R150",
    period: "month",
    features: [
      "1000+ live channels",
      "Movies & series library",
      "HD streaming",
      "1 device connection",
    ],
    href: "https://pay.yoco.com/perfect-it-solutions-cc1",
  },
  {
    title: "Premium Monthly",
    price: "R250",
    period: "month",
    features: [
      "1000+ live channels",
      "Movies & series library",
      "HD & 4K streaming",
      "3 device connections",
    ],
    href: "https://pay.yoco.com/perfect-it-solutions-cc2",
    popular: true,
    badge: "Most Popular",
  },
  {
    title: "6-Month Plan",
    price: "R700",
    period: "6 months",
    features: [
      "Everything in Premium",
      "Save R800",
      "HD & 4K streaming",
      "3 device connections",
    ],
    href: "https://pay.yoco.com/perfect-it-solutions-cc3",
  },
  {
    title: "Yearly Plan",
    price: "R1200",
    period: "year",
    features: [
      "Everything in Premium",
      "Save R1800",
      "Priority support",
      "5 device connections",
    ],
    href: "https://pay.yoco.com/perfect-it-solutions-cc4",
    badge: "Best Value",
  },
];

export function Pricing({ onStartTrial }: PricingProps) {
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {plans.map((plan, index) => (
            <PricingCard
              key={plan.title}
              title={plan.title}
              price={plan.price}
              period={plan.period}
              features={plan.features}
              href={plan.isTrial ? "#" : plan.href}
              popular={plan.popular}
              badge={plan.badge}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={plan.isTrial ? onStartTrial : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
