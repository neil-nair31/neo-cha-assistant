type HeroTagStripProps = {
  items: string[];
};

export function HeroTagStrip({ items }: HeroTagStripProps) {
  return (
    <div className="hero-tag-strip" role="list" aria-label="Service availability">
      {items.map((item, index) => (
        <div key={item} role="listitem" className="hero-tag-cell">
          {index > 0 && <span className="hero-tag-separator" aria-hidden="true" />}
          <span className="hero-tag-word">{item}</span>
        </div>
      ))}
    </div>
  );
}
