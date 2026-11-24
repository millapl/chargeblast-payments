import {
  STRIPE_ICONS,
  type IconDefinition,
  type StripeIconName,
} from "./stripe-icon-data";

interface StripeIconProps {
  name: StripeIconName;
  /** Rendered width in CSS px; the height keeps the icon's own aspect ratio. */
  size?: number;
  className?: string;
}

/** Real Stripe Dashboard icon, filled with `currentColor`. Decorative: hidden from assistive tech. */
export function StripeIcon({ name, size, className }: StripeIconProps) {
  const icon: IconDefinition = STRIPE_ICONS[name];
  const width = size ?? icon.width;
  const height = (width / icon.width) * icon.height;
  return (
    <svg
      aria-hidden
      width={width}
      height={height}
      viewBox={icon.viewBox}
      fill="currentColor"
      className={className}
    >
      {icon.paths.map((path) => (
        <path
          key={path.d}
          d={path.d}
          fillRule={path.evenodd ? "evenodd" : undefined}
          clipRule={path.evenodd ? "evenodd" : undefined}
        />
      ))}
      {icon.circles?.map((circle) => (
        <circle
          key={`${circle.cx}-${circle.cy}`}
          cx={circle.cx}
          cy={circle.cy}
          r={circle.r}
        />
      ))}
    </svg>
  );
}
