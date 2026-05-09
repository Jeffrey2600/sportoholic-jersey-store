import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";

const Newsletter = () => {
  const [phone, setPhone] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error("Please enter a valid 10-digit Indian mobile number");
      return;
    }
    setIsSubmitted(true);
    toast.success("Thanks! We'll WhatsApp you exclusive deals 🎉");
    setTimeout(() => {
      setPhone("");
      setIsSubmitted(false);
    }, 3000);
  };

  return (
    <section className="py-12 bg-gradient-to-br from-foreground via-foreground/95 to-foreground text-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-sport-accent/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-sport-red/20 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-background/10 rounded-full px-4 py-1.5 mb-4">
            <Sparkles className="h-4 w-4 text-sport-accent" />
            <span className="text-sm font-medium">Exclusive Deals</span>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Get 10% Off Your First Order
          </h2>
          <p className="text-background/70 mb-6 text-sm md:text-base">
            Drop your number — we'll WhatsApp you exclusive deals and new arrivals!
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <span className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">+91</span>
              <Input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                className="pl-16 bg-background text-foreground h-12"
                required
              />
            </div>
            <Button 
              type="submit"
              className={`h-12 px-6 transition-all duration-300 ${
                isSubmitted 
                  ? "bg-green-600 hover:bg-green-600" 
                  : "bg-sport-accent hover:bg-sport-accent/90"
              }`}
              disabled={isSubmitted}
            >
              {isSubmitted ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Subscribed!
                </>
              ) : (
                "Subscribe"
              )}
            </Button>
          </form>
          
          <p className="text-xs text-background/50 mt-4">
            No spam, unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
