import type { ReactNode } from "react";

/** Tiny markdown → safe React nodes (bold, lists, paragraphs, links). No deps. */
export function formatAssistReply(text: string): ReactNode[] {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
  const nodes: ReactNode[] = [];

  blocks.forEach((block, bi) => {
    const lines = block.split("\n");
    if (lines.length === 1 && /^#{1,3}\s+/.test(lines[0].trim())) {
      nodes.push(
        <p key={`h-${bi}`} className="neo-md-p" style={{ fontWeight: 700 }}>
          {inlineFormat(lines[0].replace(/^#{1,3}\s+/, ""))}
        </p>
      );
      return;
    }
    const isList = lines.every(
      (l) => !l.trim() || /^[-*•]\s+/.test(l.trim()) || /^\d+\.\s+/.test(l.trim())
    );
    if (
      isList &&
      lines.some((l) => /^[-*•]\s+/.test(l.trim()) || /^\d+\.\s+/.test(l.trim()))
    ) {
      nodes.push(
        <ul key={`ul-${bi}`} className="neo-md-list">
          {lines
            .filter((l) => l.trim())
            .map((l, li) => (
              <li key={li}>{inlineFormat(l.replace(/^([-*•]|\d+\.)\s+/, ""))}</li>
            ))}
        </ul>
      );
      return;
    }
    nodes.push(
      <p key={`p-${bi}`} className="neo-md-p">
        {lines.map((line, li) => (
          <span key={li}>
            {li > 0 ? <br /> : null}
            {inlineFormat(line)}
          </span>
        ))}
      </p>
    );
  });

  return nodes;
}

function inlineFormat(s: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^)]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    if (m[2]) out.push(<strong key={`b-${i++}`}>{m[2]}</strong>);
    else if (m[3] && m[4])
      out.push(
        <a key={`a-${i++}`} href={m[4]} target="_blank" rel="noreferrer">
          {m[3]}
        </a>
      );
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

export const ASSIST_STARTERS = [
  { label: "Are you AEO certified?", text: "Is Neo Logistics AEO certified?" },
  {
    label: "First-time import help",
    text: "I'm importing to India for the first time — what does Neo need from me?",
  },
  {
    label: "Cochin / Chennai contact",
    text: "How do I reach Neo's Cochin or Chennai CHA desk?",
  },
  {
    label: "Cashew export clearance",
    text: "We export cashew kernels from Cochin — can Neo handle customs clearance?",
  },
  {
    label: "Need a shipping quote",
    text: "I need a quote for import clearance and freight — can Neo help?",
  },
];
