import { PricingCard } from "@/components/PricingCard";
import { useUser } from "@/contexts/UserContext";

interface PricingProps {
  onStartTrial: () => void;
  onLoginRequired: () => void;
}

const plans = [
  {
    title: "24-Hour Trial",
    price: "FREE",
    amount: 0,
    features: [
      "Full access to all channels",
      "HD streaming quality",
      "All devices supported",
      "24-hour access period",
    ],
    isTrial: true,
  },
  {
    title: "Standard Monthly",
    price: "R130",
    amount: 130,
    period: "month",
    features: [
      "1000+ live channels",
      "Movies & series library",
      "HD streaming",
      "1 device connection",
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
      "2 device connections",
    ],
    popular: true,
    badge: "Most Popular",
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
      "1 device connection",
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
      "1 device connection",
    ],
    badge: "Best Value",
  },
];

export function Pricing({ onStartTrial, onLoginRequired }: PricingProps) {
  const { isLoggedIn, user } = useUser();

  const generatePaymentUrl = (amount: number, planTitle: string) => {
    const email = user?.username || '';
    const reference = planTitle.toLowerCase().replace(/\s+/g, '-');
    return `https://pay.yoco.com/realtv?amount=${amount}&email=${encodeURIComponent(email)}&reference=${encodeURIComponent(reference)}`;
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {plans.map((plan, index) => (
            <PricingCard
              key={plan.title}
              title={plan.title}
              price={plan.price}
              period={plan.period}
              features={plan.features}
              href={plan.isTrial ? "#" : generatePaymentUrl(plan.amount, plan.title)}
              popular={plan.popular}
              badge={plan.badge}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={plan.isTrial ? onStartTrial : undefined}
              requiresLogin={!plan.isTrial}
              isLoggedIn={isLoggedIn}
              onLoginRequired={onLoginRequired}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
