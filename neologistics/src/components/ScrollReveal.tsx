import type { ReactNode } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal.ts";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: 0 | 1 | 2 | 3;
  as?: "div" | "section" | "article";
};

const delayClass = { 0: "", 1: "delay-100", 2: "delay-200", 3: "delay-300" } as const;

export function ScrollReveal({ children, className = "", delay = 0, as: Tag = "div" }: ScrollRevealProps) {
  const { ref, visible } = useScrollReveal<HTMLElement>();

  return (
    <Tag
      ref={ref as never}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } ${delayClass[delay]} ${className}`}
    >
      {children}
    </Tag>
  );
}
