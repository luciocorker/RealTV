import { Tv, Film, PlayCircle, Wifi, Package, Zap, Headphones, Shield } from "lucide-react";
import { FeatureCard } from "@/components/FeatureCard";
import { SHOW_CONTENT_PAGES } from "@/lib/featureFlags";

const subscriptionFeatures = [
  {
    icon: Tv,
    title: "Live TV Channels",
    description: "Access 1000+ live channels including sports, news, and entertainment from around the world.",
  },
  {
    icon: Film,
    title: "Movies On Demand",
    description: "Unlimited access to thousands of movies, from blockbusters to classics and new releases.",
  },
  {
    icon: PlayCircle,
    title: "TV Series",
    description: "Binge-watch complete seasons of your favorite shows, updated with new episodes regularly.",
  },
  {
    icon: Wifi,
    title: "HD & 4K Quality",
    description: "Crystal clear streaming in HD and 4K quality with minimal buffering on any connection.",
  },
];

const tvBoxFeatures = [
  {
    icon: Package,
    title: "Ready Out the Box",
    description: "Pre-configured Android TV boxes delivered to your door — just plug in and start watching.",
  },
  {
    icon: Zap,
    title: "4K Ultra HD",
    description: "Experience stunning 4K quality with HDR support for the sharpest picture possible.",
  },
  {
    icon: Headphones,
    title: "Free Setup Support",
    description: "Our team will walk you through setup so you're streaming in minutes.",
  },
  {
    icon: Shield,
    title: "Quality Guaranteed",
    description: "Every box is tested before shipping. Backed by our customer satisfaction promise.",
  },
];

export function Features() {
  const features = SHOW_CONTENT_PAGES ? subscriptionFeatures : tvBoxFeatures;

  return (
    <section id="features" className="relative py-20 px-4" aria-labelledby="features-heading">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-12 text-center">
          <h2 id="features-heading" className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
            {SHOW_CONTENT_PAGES ? (
              <>Everything You Need to{" "}<span className="gradient-text">Stream</span></>
            ) : (
              <>Why Choose a{" "}<span className="gradient-text">RealTV Box</span></>
            )}
          </h2>
          <p className="text-muted-foreground md:text-lg">
            {SHOW_CONTENT_PAGES
              ? "Premium entertainment at your fingertips"
              : "Everything you need for the ultimate living room setup"}
          </p>
        </div>

        {/* Features grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
