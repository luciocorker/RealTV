import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  style?: React.CSSProperties;
}

export function FeatureCard({ icon: Icon, title, description, className, style }: FeatureCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-xl bg-card p-6 text-center card-hover",
        className
      )}
      style={style}
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-secondary transition-colors group-hover:bg-primary/10">
        <Icon className="h-7 w-7 text-primary transition-transform group-hover:scale-110" />
      </div>
      <h3 className="mb-2 font-display text-lg font-semibold text-foreground">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
