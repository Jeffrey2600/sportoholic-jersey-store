import { Phone, MessageCircle } from "lucide-react";

const contacts = [
  { name: "Rohit", phone: "9360565212" },
  { name: "Haris", phone: "9750536411" },
];

const ContactSection = () => {
  return (
    <section id="contact" className="py-12 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Talk to Us Directly</h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Got a question about a jersey, sizing or your order? Our team is just a call away.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {contacts.map((c) => (
            <div
              key={c.phone}
              className="group bg-card border border-border rounded-2xl p-5 hover:shadow-[var(--shadow-hover)] transition-all hover:-translate-y-1"
            >
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-sport-accent to-sport-red text-white flex items-center justify-center text-xl font-bold shadow-md">
                  {c.name[0]}
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Sportoholic Team</p>
                  <h3 className="font-bold text-lg">{c.name}</h3>
                  <p className="font-mono text-sm text-muted-foreground">+91 {c.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <a
                  href={`tel:+91${c.phone}`}
                  className="flex items-center justify-center gap-2 text-sm font-medium border border-border rounded-lg py-2 hover:bg-foreground hover:text-background transition-colors"
                >
                  <Phone className="h-4 w-4" /> Call
                </a>
                <a
                  href={`https://wa.me/91${c.phone}?text=Hi%20${c.name}!%20I'm%20interested%20in%20your%20jerseys.`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 text-sm font-medium bg-green-500 text-white rounded-lg py-2 hover:bg-green-600 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
