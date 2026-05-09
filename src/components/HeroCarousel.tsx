import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";
import { supabase } from "@/integrations/supabase/client";
import bannerFootball from "@/assets/banner-football.jpg";
import bannerCricket from "@/assets/banner-cricket.jpg";
import bannerCollection from "@/assets/banner-collection.jpg";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

interface SlideData {
  title: string;
  subtitle: string | null;
  cta_text: string | null;
  cta_link: string | null;
  image_url: string | null;
  bg_color: string | null;
}

const defaultSlides: SlideData[] = [
  {
    title: "Suit Up. Play Bold.",
    subtitle: "Explore our latest collections and wear your passion!",
    cta_text: "Explore Collection",
    cta_link: "/products",
    bg_color: "#1a1a2e",
    image_url: bannerFootball,
  },
  {
    title: "New Season Jerseys",
    subtitle: "24/25 Season kits now available — football, cricket, F1 & more",
    cta_text: "Shop Now",
    cta_link: "/products",
    bg_color: "#0f1d3a",
    image_url: bannerCricket,
  },
  {
    title: "Authentic Kits, Bold Style",
    subtitle: "Premium jerseys for every fan, every sport",
    cta_text: "Browse Collection",
    cta_link: "/products",
    bg_color: "#1a0f0a",
    image_url: bannerCollection,
  },
];

const HeroCarousel = () => {
  const navigate = useNavigate();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState<SlideData[]>(defaultSlides);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (!error && data && data.length > 0) {
      const bannerSlides: SlideData[] = data.map((banner) => ({
        title: banner.title,
        subtitle: banner.subtitle,
        cta_text: banner.cta_text,
        cta_link: banner.cta_link,
        image_url: banner.image_url,
        bg_color: banner.bg_color,
      }));
      setSlides(bannerSlides);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!api) return;

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  if (loading) {
    return (
      <div className="bg-foreground text-background">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-lg animate-pulse">
            <div className="h-10 bg-background/20 rounded mb-4 w-3/4"></div>
            <div className="h-6 bg-background/20 rounded mb-6 w-1/2"></div>
            <div className="h-12 bg-background/20 rounded w-40"></div>
          </div>
        </div>
      </div>
    );
  }

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
              <div 
                className={`${slide.bg_color?.startsWith('bg-') ? slide.bg_color : ''} text-background relative`}
                style={!slide.bg_color?.startsWith('bg-') ? { backgroundColor: slide.bg_color || '#1a1a2e' } : undefined}
              >
                {slide.image_url && (
                  <img
                    src={slide.image_url}
                    alt={slide.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                  />
                )}
                <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
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
                      onClick={() => navigate(slide.cta_link || '/products')}
                    >
                      {slide.cta_text || 'Shop Now'}
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