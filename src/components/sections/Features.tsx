import { Tv, Film, PlayCircle, Wifi } from "lucide-react";
import { FeatureCard } from "@/components/FeatureCard";

const features = [
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

export function Features() {
  return (
    <section id="features" className="relative py-20 px-4">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
            Everything You Need to{" "}
            <span className="gradient-text">Stream</span>
          </h2>
          <p className="text-muted-foreground md:text-lg">
            Premium entertainment at your fingertips
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
