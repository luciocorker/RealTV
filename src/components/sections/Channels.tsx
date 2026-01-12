import { ChannelGrid } from "@/components/ChannelGrid";

const streamingProviders = [
  { name: "Netflix", logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" },
  { name: "Amazon Prime", logo: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Amazon_Prime_Logo.svg" },
  { name: "Disney+", logo: "https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg" },
  { name: "HBO Max", logo: "https://upload.wikimedia.org/wikipedia/commons/1/17/HBO_Max_Logo.svg" },
  { name: "Hulu", logo: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Hulu_Logo.svg" },
  { name: "Apple TV+", logo: "https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_Plus_Logo.svg" },
  { name: "Paramount+", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Paramount_Plus.svg" },
  { name: "Peacock", logo: "https://upload.wikimedia.org/wikipedia/commons/d/d3/NBCUniversal_Peacock_Logo.svg" },
];

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

        {/* Streaming Providers Section */}
        <div className="mt-16">
          <div className="mb-8 text-center">
            <h3 className="mb-2 font-display text-2xl font-bold text-foreground md:text-3xl">
              Movies & Series from{" "}
              <span className="gradient-text">Top Providers</span>
            </h3>
            <p className="text-muted-foreground">
              All your favorite streaming content in one place
            </p>
          </div>

          <div 
            className="relative overflow-x-auto scrollbar-hide" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex space-x-8">
              {streamingProviders.map((provider) => (
                <div
                  key={provider.name}
                  className="flex h-16 w-28 flex-shrink-0 items-center justify-center rounded-lg bg-card p-3 transition-transform hover:scale-105"
                >
                  <img
                    src={provider.logo}
                    alt={provider.name}
                    className="h-8 max-w-full object-contain brightness-0 invert opacity-70 hover:opacity-100 transition-opacity"
                    width="120"
                    height="32"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ))}
            </div>
            <style>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>
          </div>
        </div>
      </div>
    </section>
  );
}
