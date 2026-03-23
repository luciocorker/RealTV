import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import { ReactNode } from "react";
import { CheckoutModal } from "@/components/CheckoutModal";

interface ProductCardProps {
  name: string;
  price: string;
  originalPrice?: string;
  amount: number;
  images?: string[];
  features: (string | ReactNode)[];
  badge?: string;
}

export function ProductCard({
  name,
  price,
  originalPrice,
  amount,
  images,
  features,
  badge,
}: ProductCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi>();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const hasImages = images && images.length > 0;

  // Handle dot click to navigate to specific slide
  const goToSlide = (index: number) => {
    api?.scrollTo(index);
  };

  return (
    <>
    <Card className="relative overflow-hidden border-border bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
      {badge && (
        <Badge className={`absolute right-4 top-4 z-10 ${badge === "Sale" ? "bg-red-500 text-white" : "bg-primary text-primary-foreground"}`}>
          {badge}
        </Badge>
      )}
      
      {/* Product Images */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted/30">
        {hasImages ? (
          <>
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
                {images.map((image, index) => (
                  <CarouselItem key={index} className="h-full">
                    <div className="flex h-full items-center justify-center p-4">
                      <img
                        src={image}
                        alt={`${name} - Image ${index + 1}`}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              
              {/* Navigation buttons */}
              {images.length > 1 && (
                <>
                  <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/80 hover:bg-background hidden md:flex" />
                  <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/80 hover:bg-background hidden md:flex" />
                </>
              )}
            </Carousel>
            
            {/* Clickable image indicators */}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-2.5 w-2.5 rounded-full transition-colors cursor-pointer ${
                      index === currentIndex
                        ? "bg-primary"
                        : "bg-muted-foreground/40 hover:bg-muted-foreground/60"
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-center text-muted-foreground">
              <ShoppingCart className="mx-auto h-16 w-16 mb-2 opacity-50" />
              <span className="text-sm">Image coming soon</span>
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-6">
        <h3 className="mb-2 font-display text-xl font-bold text-foreground">
          {name}
        </h3>
        <div className="mb-4 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-primary">{price}</span>
          {originalPrice && (
            <span className="text-lg text-muted-foreground line-through">{originalPrice}</span>
          )}
        </div>
        {originalPrice && (
          <div className="mb-3 inline-block rounded-full bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-500">
            🔥 Sale
          </div>
        )}
        
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="p-6 pt-0">
        <Button
          onClick={() => setIsCheckoutOpen(true)}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          size="lg"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Buy Now
        </Button>
      </CardFooter>
    </Card>

    <CheckoutModal
      isOpen={isCheckoutOpen}
      onClose={() => setIsCheckoutOpen(false)}
      productName={name}
      price={price}
      amount={amount}
    />
    </>
  );
}
