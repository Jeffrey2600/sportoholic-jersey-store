import { MessageCircle } from "lucide-react";

const FloatingWhatsApp = () => {
  const handleClick = () => {
    window.open(
      "https://wa.me/919360565212?text=Hi! I'm interested in your jerseys.",
      "_blank"
    );
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 left-6 z-50 h-14 w-14 rounded-full bg-green-500 text-white shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl animate-bounce-subtle"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-6 w-6 fill-current" />
    </button>
  );
};

export default FloatingWhatsApp;
