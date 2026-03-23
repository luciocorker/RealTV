import { ProductCard } from "@/components/ProductCard";
import { Package } from "lucide-react";
import mav1 from "@/assets/mav1.webp";
import mav2 from "@/assets/mav2.webp";
import mav3 from "@/assets/mav3.webp";
import max1 from "@/assets/max1.webp";
import max2 from "@/assets/max2.webp";
import max3 from "@/assets/max3.webp";
import max4 from "@/assets/max4.webp"

const tvBoxes = [
  {
    name: "Maxdorf 4K Google TV Box",
    price: "R2100",
    originalPrice: "R2599",
    amount: 2100,
    images: [max1, max2, max3, max4],
    features: [
      <span key="preinstalled" className="font-bold text-green-500">RealTV pre-installed</span>,
      <span key="freeMonth" className="font-bold text-green-500">Free 1 month RealTV subscription</span>,
      <span key="plugplay" className="font-bold text-green-500">Plug & play - ready to use</span>,
      "4K Ultra HD streaming",
      "Google TV built-in",
      "Voice control with Google Assistant",
      "Access to Google Play Store",
      "Chromecast built-in",
      "Dolby Audio support",
    ],
    badge: "Sale",
  },
  {
    name: "Maverick Mediabox TV Box",
    price: "R2499",
    originalPrice: "R2999",
    amount: 2499,
    images: [mav2, mav1, mav3],
    features: [
      <span key="preinstalled" className="font-bold text-green-500">RealTV pre-installed</span>,
      <span key="freeMonth" className="font-bold text-green-500">Free 1 month RealTV subscription</span>,
      <span key="plugplay" className="font-bold text-green-500">Plug & play - ready to use</span>,
      "Full HD & 4K support",
      "Android OS",
      "Pre-installed streaming apps",
      "WiFi & Ethernet connectivity",
      "USB ports for external storage",
      "Compact design",
    ],
    badge: "Sale",
  },
];

export function TVBoxes() {
  return (
    <section id="tv-boxes" className="relative py-20 px-4 bg-muted/30">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
            Premium{" "}
            <span className="gradient-text">TV Boxes</span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground md:text-lg">
            Get the best streaming experience with our recommended TV boxes. 
            Perfect for enjoying RealTV in stunning 4K quality.
          </p>
        </div>

        {/* Products grid */}
        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {tvBoxes.map((box) => (
            <ProductCard
              key={box.name}
              name={box.name}
              price={box.price}
              originalPrice={box.originalPrice}
              amount={box.amount}
              images={box.images.length > 0 ? box.images : undefined}
              features={box.features}
              badge={box.badge}
            />
          ))}
        </div>

        {/* Bundle note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            💡 <span className="font-medium">Pro tip:</span> Bundle a TV box with any RealTV subscription for the ultimate streaming setup!
          </p>
        </div>
      </div>
    </section>
  );
}
