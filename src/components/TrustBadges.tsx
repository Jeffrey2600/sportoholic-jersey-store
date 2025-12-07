import { Truck, Shield, RefreshCw, Headphones } from "lucide-react";

const badges = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "On orders above ₹999",
  },
  {
    icon: Shield,
    title: "100% Authentic",
    description: "Genuine products only",
  },
  {
    icon: RefreshCw,
    title: "Easy Returns",
    description: "7 days return policy",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Always here to help",
  },
];

const TrustBadges = () => {
  return (
    <section className="py-8 border-y border-border bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
