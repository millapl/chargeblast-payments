// The four icons in the top-bar apps pill. The reference shows third-party app icons whose
// brands could not be identified from the screenshot, so these are drawings traced by eye from
// the 7x-zoomed reference (shape, colors, proportions), not official assets.

const SIZE = 16;

function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden
      width={SIZE}
      height={SIZE}
      viewBox="0 0 16 16"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

/** Black "L" with a blue "D". */
export function LdAppIcon() {
  return (
    <Svg>
      <g transform="translate(2.1 2.2) scale(0.74)">
        <path d="M2.2 3.2h3.1v7.5h3.1v2.2H2.2z" fill="#111" />
        <path
          d="M7.1 3.2h2a4.85 4.85 0 0 1 0 9.7h-2v-2.3h2a2.55 2.55 0 0 0 0-5.1h-2z"
          fill="#3b4fe0"
        />
      </g>
    </Svg>
  );
}

/** Light-blue tile with a white cube-like hexagon. */
export function HexAppIcon() {
  return (
    <Svg>
      <rect width={16} height={16} rx={3.6} fill="#4ba3dd" />
      <g fill="none" stroke="#fff" strokeLinejoin="round" strokeLinecap="round">
        <path d="M8 2.9 13.2 5.9v4.2L8 13.1 2.8 10.1V5.9z" strokeWidth={1.15} />
        <path d="M8 5.5 10.2 6.8v2.4L8 10.5 5.8 9.2V6.8z" strokeWidth={1} />
        <path
          d="M8 2.9V5.5M13.2 5.9 10.2 6.8M13.2 10.1 10.2 9.2M8 13.1V10.5M2.8 10.1 5.8 9.2M2.8 5.9 5.8 6.8"
          strokeWidth={0.95}
        />
      </g>
    </Svg>
  );
}

/** Black tile with a green corner arrow. */
export function ArrowAppIcon() {
  return (
    <Svg>
      <rect width={16} height={16} rx={3.6} fill="#000" />
      <path d="M4.8 4.8h6.6v6.6L9 9V7.2H6.8z" fill="#5fd778" />
    </Svg>
  );
}

/** Outlined grid of apps with a plus, generic "more apps" mark. */
export function MoreAppsIcon() {
  return (
    <Svg>
      <g fill="none" stroke="#3f4658" strokeWidth={1.35} strokeLinecap="round">
        <rect x={1.9} y={2.4} width={4.9} height={4.9} rx={1.3} />
        <rect x={1.9} y={9.2} width={4.9} height={4.9} rx={1.3} />
        <rect x={9.2} y={9.2} width={4.9} height={4.9} rx={1.3} />
        <path d="M9.2 4.85h4.9M11.65 2.4v4.9" />
      </g>
    </Svg>
  );
}
