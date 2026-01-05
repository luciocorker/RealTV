import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  title: string;
  price: string;
  period?: string;
  features: string[];
  badge?: string;
  popular?: boolean;
  href: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
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
  onClick,
}: PricingCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

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
        asChild={!onClick}
        variant={popular ? "default" : "outline"}
        className={cn(
          "w-full font-semibold",
          popular && "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
        onClick={onClick ? handleClick : undefined}
      >
        {onClick ? (
          "Choose Plan"
        ) : (
          <a href={href} target="_blank" rel="noopener noreferrer">
            Choose Plan
          </a>
        )}
      </Button>
    </div>
  );
}
