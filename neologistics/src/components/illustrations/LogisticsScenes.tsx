export function LogisticsHeroScene({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 480" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Port logistics illustration">
      <defs>
        <linearGradient id="neo-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14244a" />
          <stop offset="100%" stopColor="#0c1733" />
        </linearGradient>
        <linearGradient id="neo-water" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0d9488" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#1f47c7" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0d9488" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="neo-container" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3563eb" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>
      <rect width="640" height="480" fill="url(#neo-sky)" rx="16" />
      <rect y="320" width="640" height="160" fill="url(#neo-water)" />

      {/* Crane */}
      <g className="animate-float">
        <rect x="80" y="120" width="12" height="200" fill="#598aff" rx="2" />
        <rect x="40" y="115" width="140" height="8" fill="#2dd4bf" rx="2" />
        <line x1="170" y1="123" x2="170" y2="200" stroke="#fbbf24" strokeWidth="2" />
        <rect x="155" y="200" width="30" height="22" fill="url(#neo-container)" rx="2" />
      </g>

      {/* Ship */}
      <g className="animate-float-slow">
        <path d="M300 310 L520 310 L500 350 L280 350 Z" fill="#1d3160" stroke="#598aff" strokeWidth="2" />
        <rect x="340" y="260" width="120" height="50" fill="#284178" rx="4" />
        <rect x="360" y="240" width="30" height="20" fill="#2dd4bf" opacity="0.8" />
        <rect x="410" y="235" width="25" height="25" fill="#fbbf24" opacity="0.7" />
        {/* Containers on deck */}
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={350 + i * 32} y={268} width="26" height="18" fill={i % 2 ? "#3563eb" : "#0d9488"} rx="2" opacity="0.9" />
        ))}
      </g>

      {/* Stacked containers */}
      <g>
        {[
          [60, 280], [92, 280], [124, 280],
          [60, 252], [92, 252], [124, 252],
          [76, 224],
        ].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="28" height="20" fill={i % 2 ? "#1f47c7" : "#14b8a6"} rx="2" opacity="0.85" />
        ))}
      </g>

      {/* Route line */}
      <path d="M180 340 Q320 300 460 330" stroke="#2dd4bf" strokeWidth="2" strokeDasharray="8 6" opacity="0.6" />
      <circle cx="180" cy="340" r="5" fill="#2dd4bf" />
      <circle cx="460" cy="330" r="5" fill="#fbbf24" />

      {/* Stats overlay */}
      <g transform="translate(420, 80)">
        <rect width="180" height="72" rx="12" fill="rgba(255,255,255,0.06)" stroke="rgba(45,212,191,0.3)" />
        <text x="16" y="28" fill="#94a3b8" fontSize="10" fontFamily="Inter,sans-serif" letterSpacing="2">AEO–LO · 24/7</text>
        <text x="16" y="52" fill="#2dd4bf" fontSize="18" fontWeight="700" fontFamily="Plus Jakarta Sans,sans-serif">Cochin · Chennai</text>
      </g>
    </svg>
  );
}

export function SupplyChainScene({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 480" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Supply chain flow">
      <rect width="640" height="480" fill="#f8fafc" rx="16" />
      <rect x="40" y="40" width="560" height="400" rx="12" fill="white" stroke="#e2e8f0" />

      {[
        { x: 80, label: "Origin", sub: "Factory / Seller" },
        { x: 240, label: "Customs", sub: "CHA Clearance" },
        { x: 400, label: "Port", sub: "Steamer Agency" },
        { x: 520, label: "Delivery", sub: "Consignee" },
      ].map((node, i) => (
        <g key={node.label}>
          <circle cx={node.x + 40} cy="220" r="36" fill={i % 2 ? "#eef4ff" : "#effcf9"} stroke={i % 2 ? "#598aff" : "#14b8a6"} strokeWidth="2" />
          <text x={node.x + 40} y="225" textAnchor="middle" fill="#1d3160" fontSize="11" fontWeight="700" fontFamily="Plus Jakarta Sans,sans-serif">{node.label}</text>
          {i < 3 && (
            <path d={`M${node.x + 76} 220 H${node.x + 164}`} stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrow)" />
          )}
          <text x={node.x + 40} y="280" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="Inter,sans-serif">{node.sub}</text>
        </g>
      ))}

      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#598aff" />
        </marker>
      </defs>

      <rect x="80" y="340" width="480" height="60" rx="8" fill="#0c1733" />
      <text x="320" y="365" textAnchor="middle" fill="#2dd4bf" fontSize="10" fontWeight="600" letterSpacing="3" fontFamily="Inter,sans-serif">END-TO-END VISIBILITY</text>
      <text x="320" y="385" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="Inter,sans-serif">Customs · Freight · Warehousing · Multimodal</text>
    </svg>
  );
}

export function PortOperationsScene({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 480" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Port operations">
      <rect width="640" height="480" fill="#060d1f" rx="16" />
      <rect y="300" width="640" height="180" fill="#0d9488" opacity="0.15" />

      {/* Warehouse */}
      <polygon points="80,280 80,180 200,140 320,180 320,280" fill="#14244a" stroke="#598aff" strokeWidth="1.5" />
      <rect x="120" y="200" width="40" height="50" fill="#2dd4bf" opacity="0.4" />
      <rect x="180" y="200" width="40" height="50" fill="#598aff" opacity="0.4" />
      <rect x="240" y="200" width="40" height="50" fill="#fbbf24" opacity="0.35" />

      {/* Truck */}
      <g transform="translate(360, 250)">
        <rect x="0" y="20" width="80" height="30" fill="#284178" rx="4" />
        <rect x="80" y="10" width="50" height="40" fill="#1f47c7" rx="4" />
        <circle cx="25" cy="55" r="12" fill="#0c1733" stroke="#2dd4bf" strokeWidth="2" />
        <circle cx="105" cy="55" r="12" fill="#0c1733" stroke="#2dd4bf" strokeWidth="2" />
      </g>

      {/* Globe network */}
      <circle cx="500" cy="120" r="60" stroke="#598aff" strokeWidth="1" opacity="0.4" />
      <ellipse cx="500" cy="120" rx="60" ry="25" stroke="#2dd4bf" strokeWidth="1" opacity="0.5" />
      <ellipse cx="500" cy="120" rx="25" ry="60" stroke="#2dd4bf" strokeWidth="1" opacity="0.5" />
      <circle cx="500" cy="120" r="4" fill="#fbbf24" />

      <text x="40" y="420" fill="#64748b" fontSize="11" fontFamily="Inter,sans-serif">Willingdon Island · Kochi · Egmore · Chennai</text>
    </svg>
  );
}
