import { Truck, Shield, RefreshCw, Headphones } from "lucide-react";

const badges = [
  { icon: Truck, title: "Free Shipping", description: "Above ₹999" },
  { icon: Shield, title: "Authentic", description: "100% Genuine" },
  { icon: RefreshCw, title: "Easy Returns", description: "7-day policy" },
  { icon: Headphones, title: "24/7 Support", description: "Always on" },
];

const TrustBadges = () => {
  return (
    <section className="border-y border-border bg-secondary/30">
      <div className="container mx-auto px-3 py-3 md:py-6">
        {/* Mobile: horizontal scroll, compact pills */}
        <div className="flex md:hidden gap-2 overflow-x-auto no-scrollbar -mx-3 px-3">
          {badges.map((badge, index) => (
            <div
              key={index}
              className="flex items-center gap-2 shrink-0 bg-background border border-border rounded-full pl-2 pr-3 py-1.5 shadow-sm"
            >
              <div className="h-6 w-6 rounded-full bg-foreground text-background flex items-center justify-center">
                <badge.icon className="h-3 w-3" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[11px] font-semibold">{badge.title}</span>
                <span className="text-[9px] text-muted-foreground">{badge.description}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: original grid */}
        <div className="hidden md:grid grid-cols-4 gap-4">
          {badges.map((badge, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-4 group"
            >
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-3 group-hover:bg-foreground group-hover:text-background transition-colors duration-300">
                <badge.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{badge.title}</h3>
              <p className="text-xs text-muted-foreground">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
