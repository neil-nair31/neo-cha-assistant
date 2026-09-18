import { Link } from "react-router-dom";
import { assets } from "../data/assets.ts";

type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className = "" }: BrandLogoProps) {
  return (
    <Link
      to="/"
      className={`navbar-logo group ${className}`}
      aria-label="Neo Logistics — home"
    >
      <span className="navbar-logo-frame">
        <img
          src={assets.logo}
          alt="Neo Logistics"
          className="navbar-logo-img"
          width={120}
          height={36}
        />
      </span>
    </Link>
  );
}
