import { Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  title: string;
  price: string;
  period?: string;
  features: (string | React.ReactNode)[];
  badge?: string;
  popular?: boolean;
  href: string;
  className?: string;
  style?: React.CSSProperties;
  isTrial?: boolean;
}

export function PricingCard({
  title,
  price,
  period,
  features,
  badge,
  popular,
  href,
  className,
  style,
  isTrial,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl bg-card p-6 card-hover",
        popular && "gradient-border glow",
        className
      )}
      style={style}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-block rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
            {badge}
          </span>
        </div>
      )}

      <div className="mb-6 text-center">
        <h3 className="mb-2 font-display text-xl font-semibold text-foreground">
          {title}
        </h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className={cn("text-4xl font-bold", popular ? "gradient-text" : "text-foreground")}>
            {price}
          </span>
          {period && (
            <span className="text-sm text-muted-foreground">/{period}</span>
          )}
        </div>
      </div>

      <ul className="mb-6 flex-1 space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 shrink-0 text-primary" />
            {feature}
          </li>
        ))}
      </ul>

      <Button
        asChild
        variant={popular ? "default" : "outline"}
        className={cn(
          "w-full font-semibold relative z-10",
          popular && "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        <a href={href} className="w-full h-full flex items-center justify-center">
          {isTrial ? (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download App
            </>
          ) : (
            "Choose Plan"
          )}
        </a>
      </Button>
    </div>
  );
}
