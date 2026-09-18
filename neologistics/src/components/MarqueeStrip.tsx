const dotColors = ["bg-neo-red", "bg-neo", "bg-neo-blue-accent", "bg-neo-blue-light"];

export function MarqueeStrip({ dark = true }: { dark?: boolean }) {
  const items = [
    "Licensed Customs Broker",
    "AEO–LO Authorized",
    "Cochin & Chennai Ports",
    "Extending the Limits",
    "Freight Forwarding",
    "Warehousing",
    "Multimodal Transport",
    "24/7 Operations",
    "Mining Logistics",
    "Since 2007",
  ];
  const track = [...items, ...items];

  return (
    <div
      className={`relative overflow-hidden border-y py-4 ${
        dark ? "border-neo-800 bg-neo-950" : "border-neo-100 bg-neo-50"
      }`}
    >
      <div className="animate-marquee relative flex w-max gap-10 whitespace-nowrap px-4">
        {track.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className={`flex items-center gap-10 font-sans text-[10px] font-bold uppercase tracking-[0.28em] ${
              dark ? "text-neo-200/75" : "text-neo-600"
            }`}
          >
            {item}
            <span className={`h-1.5 w-1.5 rounded-full ${dotColors[i % dotColors.length]}`} />
          </span>
        ))}
      </div>
    </div>
  );
}
