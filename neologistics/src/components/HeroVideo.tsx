import { useEffect, useRef, useState } from "react";
import { assets } from "../data/assets.ts";
import { site } from "../data/site.ts";
import { AnimatedStatGrid } from "./AnimatedStatGrid.tsx";
import { HeroTagStrip } from "./HeroTagStrip.tsx";

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onReady = () => setReady(true);
    v.addEventListener("canplay", onReady);
    v.play().catch(() => {});
    return () => v.removeEventListener("canplay", onReady);
  }, []);

  return (
    <section id="top" className="hero-cinematic" aria-labelledby="hero-heading">
      {/* Layer 0 — video */}
      <div className="hero-media" aria-hidden>
        <video
          ref={videoRef}
          className={`hero-video ${ready ? "hero-video-ready" : ""}`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src={assets.heroVideoStock} type="video/mp4" />
        </video>
      </div>

      {/* Layer 1 — overlays (no content bleeds through) */}
      <div className="hero-overlay-base" aria-hidden />
      <div className="hero-overlay-vignette" aria-hidden />
      <div className="hero-overlay-accent" aria-hidden />

      {/* Layer 2 — content (no ScrollReveal — always crisp, no ghost frames) */}
      <div className="hero-content">
        <div className="container-wide">
          <div className="hero-copy">
            <p className="hero-eyebrow">{site.tagline}</p>
            <h1 id="hero-heading" className="hero-title">
              {site.heroHeadline}
              <span className="hero-title-accent">{site.heroHeadlineAccent}</span>
            </h1>
            <p className="hero-subtitle">{site.heroSubline}</p>

            <HeroTagStrip items={site.heroPills} />

            <div className="hero-actions">
              <a href="#callback" className="btn-primary">Get a Callback</a>
              <a href="#services" className="btn-ghost">Our Services</a>
            </div>
          </div>

          <div className="hero-dock">
            <div className="hero-dock-quote">
              <span className="hero-dock-label">24/7 Operations</span>
              <p className="hero-dock-title">Satisfaction Forever</p>
              <p className="hero-dock-text">
                Sincerity and integrity — nuances that cannot be bought or measured with money.
              </p>
            </div>
            <AnimatedStatGrid stats={site.stats} dark hero />
          </div>
        </div>
      </div>

      <a href="#industries" aria-label="Scroll to next section" className="hero-scroll-cue">
        <span>Explore</span>
        <svg className="animate-bob h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </section>
  );
}
