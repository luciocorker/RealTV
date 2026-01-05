const channels = [
  { name: "SuperSport", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/3/3d/SuperSport_logo.svg/1200px-SuperSport_logo.svg.png" },
  { name: "DSTV", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/DStv_Logo.svg/2560px-DStv_Logo.svg.png" },
  { name: "Sky Sports", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/a/a5/Sky_Sports_logo_2020.svg/1200px-Sky_Sports_logo_2020.svg.png" },
  { name: "ESPN", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/1200px-ESPN_wordmark.svg.png" },
  { name: "BeIN Sports", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/BeIN_Sports_logo.svg/2560px-BeIN_Sports_logo.svg.png" },
  { name: "HBO", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/HBO_logo.svg/1200px-HBO_logo.svg.png" },
  { name: "Netflix", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/1200px-Netflix_2015_logo.svg.png" },
  { name: "Disney+", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Disney%2B_logo.svg/2560px-Disney%2B_logo.svg.png" },
];

export function ChannelGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
      {channels.map((channel, index) => (
        <div
          key={channel.name}
          className="group flex h-20 items-center justify-center rounded-lg bg-card p-4 transition-all duration-300 hover:bg-secondary"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <img
            src={channel.logo}
            alt={channel.name}
            className="h-8 max-w-full object-contain opacity-70 transition-all duration-300 group-hover:opacity-100 grayscale group-hover:grayscale-0"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}
