import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

interface HeroSlide {
  title: string;
  subtitle: string;
  cta: string;
  bgColor: string;
  image?: string;
}

const slides: HeroSlide[] = [
  {
    title: "Suit Up. Play Bold.",
    subtitle: "Explore our latest collections and wear your passion!",
    cta: "Explore Collection",
    bgColor: "bg-foreground",
  },
  {
    title: "New Season Jerseys",
    subtitle: "24/25 Season kits now available",
    cta: "Shop Now",
    bgColor: "bg-foreground",
  },
  {
    title: "Retro Collection",
    subtitle: "Classic jerseys from legendary seasons",
    cta: "View Retro",
    bgColor: "bg-foreground",
  },
];

const HeroCarousel = () => {
  const navigate = useNavigate();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className="relative">
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 4000,
            stopOnInteraction: false,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent>
          {slides.map((slide, index) => (
            <CarouselItem key={index}>
              <div className={`${slide.bgColor} text-background`}>
                <div className="container mx-auto px-4 py-12 md:py-20">
                  <div className="max-w-lg">
                    <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                      {slide.title}
                    </h1>
                    <p className="text-base md:text-lg mb-6 opacity-90">
                      {slide.subtitle}
                    </p>
                    <Button
                      size="lg"
                      variant="secondary"
                      className="bg-background text-foreground hover:bg-background/90"
                      onClick={() => navigate("/products")}
                    >
                      {slide.cta}
                    </Button>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Dots indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              current === index ? "bg-background w-6" : "bg-background/50"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;