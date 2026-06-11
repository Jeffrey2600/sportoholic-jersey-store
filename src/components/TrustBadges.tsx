import { Truck, Shield, RefreshCw, Headphones, Zap, Award } from "lucide-react";

const badges = [
  { icon: Truck, title: "Free Shipping", description: "Above ₹999", color: "from-emerald-500 to-teal-600" },
  { icon: Shield, title: "Authentic", description: "100% Genuine", color: "from-blue-500 to-indigo-600" },
  { icon: RefreshCw, title: "Easy Returns", description: "7-day policy", color: "from-orange-500 to-rose-600" },
  { icon: Headphones, title: "24/7 Support", description: "Always on", color: "from-violet-500 to-purple-600" },
  { icon: Zap, title: "Fast Delivery", description: "Pan India", color: "from-amber-500 to-orange-600" },
  { icon: Award, title: "Top Quality", description: "Premium fabric", color: "from-pink-500 to-rose-600" },
];

const Pill = ({ badge }: { badge: typeof badges[number] }) => (
  <div className="flex items-center gap-2 shrink-0 bg-background border border-border rounded-full pl-1.5 pr-4 py-1.5 shadow-sm mx-2">
    <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${badge.color} text-white flex items-center justify-center shadow-md`}>
      <badge.icon className="h-3.5 w-3.5" />
    </div>
    <div className="flex flex-col leading-tight">
      <span className="text-[11px] md:text-xs font-semibold whitespace-nowrap">{badge.title}</span>
      <span className="text-[9px] md:text-[10px] text-muted-foreground whitespace-nowrap">{badge.description}</span>
    </div>
  </div>
);

const TrustBadges = () => {
  return (
    <section className="border-y border-border bg-gradient-to-r from-secondary/60 via-background to-secondary/60 overflow-hidden py-3">
      <div className="relative flex overflow-x-hidden">
        <div className="animate-marquee-rev whitespace-nowrap flex items-center">
          {badges.map((badge, i) => (
            <Pill key={i} badge={badge} />
          ))}
        </div>
        <div className="animate-marquee-rev2 absolute top-0 whitespace-nowrap flex items-center">
          {badges.map((badge, i) => (
            <Pill key={`d-${i}`} badge={badge} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
