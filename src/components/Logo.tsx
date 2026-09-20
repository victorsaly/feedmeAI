interface LogoProps {
  className?: string
  size?: number
}

/* A fridge: freezer over fridge, two handles, a little light on the top.
   Reads at 16px and at 64px. Cobalt, one weight. */
export function Logo({ className = '', size = 28 }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="fm-sheen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".18" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="5" y="1.5" width="22" height="29" rx="6" fill="#1f57ff" />
      <rect x="5" y="1.5" width="22" height="29" rx="6" fill="url(#fm-sheen)" />
      <path d="M5 12.5h22" stroke="#fff" strokeWidth="1.75" />
      <rect x="20.5" y="5" width="2.5" height="4.5" rx="1.25" fill="#fff" />
      <rect x="20.5" y="16" width="2.5" height="7" rx="1.25" fill="#fff" />
    </svg>
  )
}
