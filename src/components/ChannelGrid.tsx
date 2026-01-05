const channels = [
  { name: "HDT", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/HDT.png" },
  { name: "DHD", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/DHD.png" },
  { name: "CC7", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/CC7.png" },
  { name: "FOC", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/FOC.png" },
  { name: "WWE", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/WWE.png" },
  { name: "BHD", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/BHD.png" },
  { name: "MTV", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/MTV.png" },
  { name: "RTK", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/RTK.png" },
  { name: "YHD", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/YHD.png" },
  { name: "T32", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/T32.png" },
  { name: "TND", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/TND.png" },
  { name: "NA8", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/NA8.png" },
  { name: "KHD", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/KHD.png" },
  { name: "K30", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/K30.png" },
  { name: "KNM", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/KNM.png" },
  { name: "AFM", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/AFM.png" },
  { name: "MZH", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/MZH.png" },
  { name: "M11", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/M11.png" },
  { name: "H26", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/H26.png" },
  { name: "BBL", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/BBL.png" },
  { name: "F26", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/F26.png" },
  { name: "Z26", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/Z26.png" },
  { name: "WHD", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/WHD.png" },
  { name: "N26", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/N26.png" },
  { name: "ETH", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/ETH.png" },
  { name: "M30", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/M30.png" },
  { name: "SSZ", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/SSZ.png" },
  { name: "SH4", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/SH4.png" },
  { name: "SH2", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/SH2.png" },
  { name: "TS2", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/TS2.png" },
  { name: "SSH", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/SSH.png" },
  { name: "MSH", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/MSH.png" },
  { name: "35L", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/35L.png" },
  { name: "I26", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/I26.png" },
  { name: "STV", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/STV.png" },
  { name: "1KZ", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/1KZ.png" },
  { name: "CTV", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/CTV.png" },
  { name: "CHD", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/CHD.png" },
  { name: "SO8", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/SO8.png" },
  { name: "NIK", logo: "https://03mcdecdnimagerepository.blob.core.windows.net/epguideimage/channel/NIK.png" },
];

export function ChannelGrid() {
  return (
    <div className="relative overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <div className="flex space-x-8">
        {/* All logos - manually scrollable */}
        {channels.map((channel) => (
          <div
            key={channel.name}
            className="flex h-20 w-32 flex-shrink-0 items-center justify-center rounded-lg bg-card p-3"
          >
            <img
              src={channel.logo}
              alt={channel.name}
              className="h-12 max-w-full object-contain"
              loading="lazy"
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
  );
}
