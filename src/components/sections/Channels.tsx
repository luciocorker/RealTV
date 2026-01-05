import { ChannelGrid } from "@/components/ChannelGrid";

export function Channels() {
  return (
    <section id="channels" className="relative py-20 px-4 bg-secondary/30">
      <div className="mx-auto max-w-5xl">
        {/* Section header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
            Popular{" "}
            <span className="gradient-text">Channels</span>
          </h2>
          <p className="text-muted-foreground md:text-lg">
            Stream content from the world's top networks
          </p>
        </div>

        {/* Channel logos grid */}
        <ChannelGrid />

        {/* More channels text */}
        <p className="mt-8 text-center text-lg font-semibold text-muted-foreground">
          ...and <span className="text-primary">1000+</span> more channels!
        </p>
      </div>
    </section>
  );
}
