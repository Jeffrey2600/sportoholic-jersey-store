const brands = [
  { name: "Manchester United", emoji: "🔴" },
  { name: "Real Madrid", emoji: "⚪" },
  { name: "Barcelona", emoji: "🔵" },
  { name: "Liverpool", emoji: "🔴" },
  { name: "Chelsea", emoji: "🔵" },
  { name: "Arsenal", emoji: "🔴" },
  { name: "PSG", emoji: "🔵" },
  { name: "Bayern Munich", emoji: "🔴" },
  { name: "Juventus", emoji: "⚪" },
  { name: "AC Milan", emoji: "🔴" },
  { name: "Inter Milan", emoji: "🔵" },
  { name: "Manchester City", emoji: "🔵" },
];

const BrandMarquee = () => {
  return (
    <div className="py-6 bg-secondary overflow-hidden">
      <div className="relative flex overflow-x-hidden">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-8">
          {brands.map((brand, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-4 py-2 bg-background rounded-full shadow-sm"
            >
              <span className="text-lg">{brand.emoji}</span>
              <span className="font-medium text-sm">{brand.name}</span>
            </div>
          ))}
        </div>
        <div className="animate-marquee2 absolute top-0 whitespace-nowrap flex items-center gap-8">
          {brands.map((brand, index) => (
            <div
              key={`dup-${index}`}
              className="flex items-center gap-2 px-4 py-2 bg-background rounded-full shadow-sm"
            >
              <span className="text-lg">{brand.emoji}</span>
              <span className="font-medium text-sm">{brand.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrandMarquee;
