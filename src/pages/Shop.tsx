import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Check,
  X,
  Zap,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";

import mav1 from "@/assets/mav1.webp";
import mav2 from "@/assets/mav2.webp";
import mav3 from "@/assets/mav3.webp";
import max1 from "@/assets/max1.webp";
import max2 from "@/assets/max2.webp";
import max3 from "@/assets/max3.webp";
import max4 from "@/assets/max4.webp";
import q1 from "@/assets/q1.webp";
import q2 from "@/assets/q2.webp";
import q4 from "@/assets/q4.webp";
import cool1 from "@/assets/cool1.webp";
import cool2 from "@/assets/cool2.webp";
import cool3 from "@/assets/cool3.webp";
import cool4 from "@/assets/cool4.webp";

import { SHOW_SUBSCRIPTIONS } from "@/lib/featureFlags";

const WHATSAPP_NUMBER = "27769681973";

// ─── Data ───────────────────────────────────────────────

const standardPlans = [
  {
    id: "std-monthly",
    title: "Standard Monthly",
    price: 130,
    priceLabel: "R130",
    period: "month",
    features: [
      "1000+ live channels",
      "Movies & series library",
      "HD streaming",
      "1 TV + 1 Phone (Android only)",
    ],
  },
  {
    id: "std-3month",
    title: "3-Month Plan",
    price: 350,
    priceLabel: "R350",
    period: "3 months",
    features: [
      "Everything in Standard",
      "Save R40",
      "HD & 4K streaming",
      "1 TV + 1 Phone (Android only)",
    ],
  },
  {
    id: "std-6month",
    title: "6-Month Plan",
    price: 700,
    priceLabel: "R700",
    period: "6 months",
    features: [
      "Everything in Standard",
      "Save R80",
      "HD & 4K streaming",
      "1 TV + 1 Phone (Android only)",
    ],
  },
  {
    id: "std-yearly",
    title: "Yearly Plan",
    price: 1300,
    priceLabel: "R1300",
    period: "year",
    features: [
      "Everything in Standard",
      "Save R260",
      "Priority support",
      "1 TV + 1 Phone (Android only)",
    ],
    badge: "Best Value",
  },
];

const premiumPlans = [
  {
    id: "std-premium-monthly",
    title: "Premium Monthly",
    price: 230,
    priceLabel: "R230",
    period: "month",
    features: [
      "1000+ live channels",
      "Movies & series library",
      "HD streaming",
      "2 TVs + 2 Phones (Android only)",
    ],
  },
  {
    id: "std-premium-3month",
    title: "3-Month Plan",
    price: 620,
    priceLabel: "R620",
    period: "3 months",
    features: [
      "Everything in Premium",
      "Save R70",
      "HD & 4K streaming",
      "2 TVs + 2 Phones (Android only)",
    ],
  },
  {
    id: "std-premium-6month",
    title: "6-Month Plan",
    price: 1200,
    priceLabel: "R1200",
    period: "6 months",
    features: [
      "Everything in Premium",
      "Save R180",
      "HD & 4K streaming",
      "2 TVs + 2 Phones (Android only)",
    ],
  },
  {
    id: "std-premium-yearly",
    title: "Yearly Plan",
    price: 2200,
    priceLabel: "R2200",
    period: "year",
    features: [
      "Everything in Premium",
      "Save R560",
      "Priority support",
      "2 TVs + 2 Phones (Android only)",
    ],
    badge: "Best Value",
  },
];



const tvBoxes = [
  {
    id: "maxdorf-4k",
    name: "Maxdorf 4K Google TV Box",
    price: 2100,
    priceLabel: "R2100",
    originalPrice: "R2599",
    images: [max1, max2, max3, max4],
    features: [
      "Plug & play - ready to use",
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
    id: "maverick-mediabox",
    name: "Maverick Mediabox TV Box",
    price: 2499,
    priceLabel: "R2499",
    originalPrice: "R2999",
    images: [mav2, mav1, mav3],
    features: [
      "Plug & play - ready to use",
      "Full HD & 4K support",
      "Android OS",
      "Pre-installed streaming apps",
      "WiFi & Ethernet connectivity",
      "USB ports for external storage",
      "Compact design",
    ],
    badge: "Sale",
  },
  {
    id: "qvwi-leap-s3",
    name: "QVWi 4K Google Streaming Box Leap-S3",
    price: 1699,
    priceLabel: "R1699",
    originalPrice: "R2100",
    images: [q1, q2, q4],
    features: [
      "Plug & play - ready to use",
      "4K Ultra HD streaming",
      "Google TV built-in",
      "Voice control with Google Assistant",
      "Access to Google Play Store",
      "WiFi & Ethernet connectivity",
      "Compact design",
    ],
    badge: "Sale",
  },
  {
    id: "mecool-km7-plus",
    name: "MECOOL KM7 PLUS",
    price: 1899,
    priceLabel: "R1899",
    originalPrice: "R2500",
    images: [cool4, cool1, cool2, cool3],
    features: [
      "Plug & play - ready to use",
      "4K Ultra HD streaming",
      "Google TV built-in",
      "Voice control with Google Assistant",
      "Access to Google Play Store",
      "WiFi & Ethernet connectivity",
      "Compact design",
    ],
    badge: "Sale",
  },
];

// ─── TV Box Image Carousel ──────────────────────────────

function TVBoxCard({
  box,
  onSelect,
}: {
  box: (typeof tvBoxes)[0];
  onSelect: () => void;
}) {
  return (
    <div
      className="relative cursor-pointer rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
      onClick={onSelect}
    >
      {box.badge && (
        <Badge className="absolute right-3 top-3 z-10 bg-red-500 text-white">
          {box.badge}
        </Badge>
      )}
      <div className="flex items-center justify-center p-4">
        <img
          src={box.images[0]}
          alt={box.name}
          className="h-40 w-auto object-contain"
        />
      </div>
      <div className="px-4 pb-4 text-center">
        <h3 className="font-display text-sm font-bold text-foreground">{box.name}</h3>
        <div className="mt-1 flex items-baseline justify-center gap-2">
          <span className="text-lg font-bold text-primary">{box.priceLabel}</span>
          {box.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {box.originalPrice}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function TVBoxDetail({
  box,
  onClose,
}: {
  box: (typeof tvBoxes)[0];
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi>();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 flex w-full max-w-2xl flex-col md:flex-row rounded-xl border border-primary/50 bg-card backdrop-blur-sm overflow-hidden shadow-2xl shadow-primary/20"
        onClick={(e) => e.stopPropagation()}
      >
        {box.badge && (
          <Badge className="absolute right-3 top-3 z-10 bg-red-500 text-white">
            {box.badge}
          </Badge>
        )}
        <button
          onClick={onClose}
          className="absolute left-3 top-3 z-10 rounded-full bg-background/80 p-1.5 hover:bg-background transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Image carousel */}
        <div className="relative w-full md:w-56 flex-shrink-0 bg-muted/30">
          <Carousel
            className="w-full h-full"
            opts={{ loop: true }}
            setApi={(carouselApi) => {
              setApi(carouselApi);
              carouselApi?.on("select", () => {
                setCurrentIndex(carouselApi.selectedScrollSnap());
              });
            }}
          >
            <CarouselContent className="h-full">
              {box.images.map((image, index) => (
                <CarouselItem key={index} className="h-full">
                  <div className="flex items-center justify-center p-4">
                    <img
                      src={image}
                      alt={`${box.name} - Image ${index + 1}`}
                      className="max-h-56 md:max-h-full w-auto object-contain"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {box.images.length > 1 && (
              <>
                <CarouselPrevious className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 bg-background/80 hover:bg-background hidden md:flex" />
                <CarouselNext className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 bg-background/80 hover:bg-background hidden md:flex" />
              </>
            )}
          </Carousel>
          {box.images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {box.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => api?.scrollTo(index)}
                  className={`h-2 w-2 rounded-full transition-colors cursor-pointer ${
                    index === currentIndex
                      ? "bg-primary"
                      : "bg-muted-foreground/40 hover:bg-muted-foreground/60"
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="mb-1 font-display text-lg font-bold text-foreground">
            {box.name}
          </h3>
          <div className="mb-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">{box.priceLabel}</span>
            {box.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {box.originalPrice}
              </span>
            )}
          </div>

          <ul className="mb-4 flex-1 space-y-1">
            {box.features.slice(0, 4).map((f, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi! I'd like to buy the ${box.name} (${box.priceLabel}).`)}`, "_blank")}
          >
            Buy
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Shop Page ──────────────────────────────────────────

export default function Shop() {
  const [activeCategory, setActiveCategory] = useState<"subscriptions" | "tvboxes">(SHOW_SUBSCRIPTIONS ? "subscriptions" : "tvboxes");
  const [activeTab, setActiveTab] = useState<"standard" | "premium">("standard");
  const [selectedBox, setSelectedBox] = useState<(typeof tvBoxes)[0] | null>(null);

  const plans = activeTab === "standard" ? standardPlans : premiumPlans;

  return (
    <div className="relative min-h-screen py-20 px-4">
      <div className="mx-auto max-w-6xl">
          {/* Page header */}
          <div className="mb-6 text-center">
            <h1 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
              <span className="gradient-text">Shop</span>
            </h1>
            <p className="text-muted-foreground md:text-lg">
              {SHOW_SUBSCRIPTIONS
                ? "Subscriptions, TV boxes & bundles — all in one place"
                : "Premium TV boxes for the best streaming experience"}
            </p>

            {/* Category toggle — only shown when SHOW_SUBSCRIPTIONS is true */}
            {SHOW_SUBSCRIPTIONS && (
            <div className="mt-6 flex justify-center">
              <div className="inline-flex rounded-lg bg-secondary p-1">
                <button
                  onClick={() => setActiveCategory("subscriptions")}
                  className={cn(
                    "rounded-md px-6 py-2.5 text-sm font-medium transition-all flex items-center gap-2",
                    activeCategory === "subscriptions"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Zap className="h-4 w-4" />
                  Subscriptions
                </button>
                <button
                  onClick={() => setActiveCategory("tvboxes")}
                  className={cn(
                    "rounded-md px-6 py-2.5 text-sm font-medium transition-all flex items-center gap-2",
                    activeCategory === "tvboxes"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Package className="h-4 w-4" />
                  TV Boxes
                </button>
              </div>
            </div>
            )}
          </div>

          {/* ───── Subscriptions ───── */}
          {SHOW_SUBSCRIPTIONS && activeCategory === "subscriptions" && <section className="mb-20">
            <div className="mb-8 text-center">
              <h2 className="mb-2 font-display text-2xl font-bold text-foreground md:text-3xl">
                Subscription Plans
              </h2>
              <p className="text-muted-foreground">Choose the plan that works for you</p>
            </div>

            {/* Tabs */}
            <div className="mb-6 flex justify-center">
              <div className="inline-flex rounded-lg bg-secondary p-1">
                <button
                  onClick={() => setActiveTab("standard")}
                  className={cn(
                    "rounded-md px-6 py-2.5 text-sm font-medium transition-all",
                    activeTab === "standard"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  1 TV &amp; 1 Phone
                </button>
                <button
                  onClick={() => setActiveTab("premium")}
                  className={cn(
                    "rounded-md px-6 py-2.5 text-sm font-medium transition-all",
                    activeTab === "premium"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  2 TV's &amp; 2 Phone's
                </button>
              </div>
            </div>

            <p className="mb-8 text-center text-sm text-muted-foreground">
              Access to 1000+ live channels, movies & series
            </p>

            {/* Plan cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan, index) => {
                return (
                  <div
                    key={`${activeTab}-${plan.id}`}
                    className={cn(
                      "relative flex flex-col rounded-xl bg-card p-6 card-hover animate-fade-in",
                      plan.popular && "gradient-border glow"
                    )}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="inline-block rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                          {plan.badge}
                        </span>
                      </div>
                    )}

                    <div className="mb-6 text-center">
                      <h3 className="mb-2 font-display text-xl font-semibold text-foreground">
                        {plan.title}
                      </h3>
                      <div className="flex items-baseline justify-center gap-1">
                        <span
                          className={cn(
                            "text-4xl font-bold",
                            plan.popular ? "gradient-text" : "text-foreground"
                          )}
                        >
                          {plan.priceLabel}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          /{plan.period}
                        </span>
                      </div>
                    </div>

                    <ul className="mb-6 flex-1 space-y-3">
                      {plan.features.map((feature, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <Check className="h-4 w-4 shrink-0 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={plan.popular ? "default" : "outline"}
                      className={cn(
                        "w-full font-semibold",
                        plan.popular &&
                          "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                      onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi! I'd like to buy the ${plan.title} (${plan.priceLabel}/${plan.period}).`)}`, "_blank")}
                    >
                      Buy
                    </Button>
                  </div>
                );
              })}
            </div>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Download the app to create your account and start streaming
            </p>
          </section>}

          {/* ───── TV Boxes ───── */}
          {(!SHOW_SUBSCRIPTIONS || activeCategory === "tvboxes") && <section>
            <div className="mb-12 text-center">
              <div className="mb-4 flex items-center justify-center gap-2">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <h2 className="mb-4 font-display text-2xl font-bold text-foreground md:text-3xl">
                Premium{" "}
                <span className="gradient-text">TV Boxes</span>
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground md:text-lg">
                Get the best streaming experience with our recommended TV boxes.
                Perfect for enjoying RealTV in stunning 4K quality.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {tvBoxes.map((box) => (
                <TVBoxCard key={box.id} box={box} onSelect={() => setSelectedBox(box)} />
              ))}
            </div>

            {selectedBox && (
              <TVBoxDetail box={selectedBox} onClose={() => setSelectedBox(null)} />
            )}

            {SHOW_SUBSCRIPTIONS && (
              <div className="mt-12 text-center">
                <p className="text-sm text-muted-foreground">
                  Bundle a TV box with any RealTV subscription for the ultimate streaming setup!
                </p>
              </div>
            )}
          </section>}
        </div>
    </div>
  );
}
