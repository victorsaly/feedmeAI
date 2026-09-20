/*
 * The pitch in one picture, drawn in the app's own blue so it reads as
 * part of the screen rather than a poster stuck on it: a fridge you're
 * unsure about, an arrow, and the answer — photograph it, get recipes
 * from what's actually there. Pure SVG, so it stays crisp on any phone.
 */
export function HowItWorks() {
  return (
    <section className="how" aria-labelledby="how-title">
      <h2 id="how-title" className="sr-only">How it works</h2>
      <svg className="how-art" viewBox="0 0 360 440" role="img" aria-label="A fridge with a question mark, an arrow down to the app: photograph it, and get instant recipes based on what you have">
        <defs>
          <clipPath id="how-phone"><rect x="28" y="248" width="66" height="112" rx="10" /></clipPath>
        </defs>

        {/* the question */}
        <g className="how-q">
          <text x="138" y="62" textAnchor="middle" fill="var(--blue)" fontSize="46" fontWeight="800">?</text>
          <path d="M108 40c-6-20 12-36 30-32" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" opacity=".3" />
          <path d="M102 46c-8-28 16-50 40-42" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" opacity=".15" />
        </g>
        <g className="how-dots" fill="var(--blue)">
          <circle cx="150" cy="70" r="3.5" />
          <circle cx="160" cy="86" r="2.5" />
          <circle cx="240" cy="52" r="5" />
          <circle cx="228" cy="70" r="3" />
        </g>

        {/* the fridge, door open */}
        <g transform="translate(-14 0)" fill="none" stroke="var(--blue)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          {/* the cabinet, lit inside */}
          <rect x="116" y="82" width="108" height="134" rx="8" fill="#fff" />
          <rect x="122" y="88" width="96" height="102" rx="4" fill="var(--blue-tint)" stroke="none" />
          <path d="M122 124h96M122 156h96" />
          {/* top shelf: milk, a jar, a bottle */}
          <path d="M130 124v-16l4-5h10l4 5v16M134 108h14" />
          <rect x="156" y="108" width="14" height="16" rx="2" /><path d="M158 108v-4h10v4" />
          <path d="M186 124v-13l-2-3v-4h8v4l-2 3v13" />
          {/* middle: apple, orange, a bowl, eggs */}
          <circle cx="136" cy="149" r="7" /><path d="M136 142c1-4 5-5 7-3" />
          <circle cx="153" cy="150" r="6" />
          <path d="M164 148h26c0 5-4 8-8 8h-10c-4 0-8-3-8-8z" />
          <ellipse cx="201" cy="151" rx="3.5" ry="4.5" /><ellipse cx="210" cy="151" rx="3.5" ry="4.5" />
          {/* bottom: a box, cheese, a bottle */}
          <rect x="128" y="176" width="22" height="12" rx="2" /><path d="M126 176h26" />
          <path d="M158 188l10-10 14 10z" />
          <path d="M200 188v-12l-2-3v-4h8v4l-2 3v12" />
          <path d="M122 188h96" />
          {/* the drawer, and the feet */}
          <rect x="124" y="194" width="92" height="14" rx="3" fill="#fff" /><path d="M164 201h12" />
          <path d="M124 216v6M216 216v6" />
          {/* the door, hinged on the cabinet's right edge and swung open towards you */}
          <path d="M270 76l8 5v142l-8-3z" fill="var(--light-2)" />
          <path d="M224 82l46-6 8 5-46 7z" fill="var(--light-2)" />
          <path d="M224 82l46-6v144l-46-4z" fill="var(--light)" />
          <path d="M231 92l32-4v122l-32-3z" fill="#fff" opacity=".6" />
          <path d="M282 120v30" strokeWidth="4" />
          <path d="M278 122h4M278 148h4" strokeWidth="2" />
        </g>

        {/* the arrow — tail and head fade in as one */}
        <g className="how-arrow">
          <path d="M183 226l-9 30" fill="none" stroke="var(--light-2)" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="4 5" />
          <path d="M181 258l-18-4 6 18z" fill="var(--light-2)" />
        </g>

        {/* the answer */}
        <g transform="translate(0 40)">
        <rect x="10" y="232" width="340" height="156" rx="26" fill="var(--blue)" />
        <text x="180" y="256" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700" letterSpacing=".12em" opacity=".8">THE ANSWER</text>

        <g>
          <rect x="28" y="248" width="66" height="112" rx="10" fill="#fff" />
          <g clipPath="url(#how-phone)">
            <rect x="36" y="264" width="50" height="60" rx="4" fill="var(--blue-tint)" />
            <g fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round">
              <path d="M44 274v-4h4M78 270h4v4M44 314v4h4M82 314v4h-4" />
              <rect x="50" y="284" width="22" height="16" rx="3" />
              <circle cx="61" cy="292" r="4" />
              <path d="M56 281h10" />
            </g>
            <path d="M42 292h4M76 292h4M61 278v-4M61 306v4" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" />
          </g>
          <text x="61" y="343" textAnchor="middle" fill="var(--blue)" fontSize="9.5" fontWeight="700">FeedMe AI</text>
          <circle cx="61" cy="354" r="2.5" fill="none" stroke="var(--blue)" strokeWidth="1.5" />
        </g>

        <path d="M108 302h16M120 296l6 6-6 6" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity=".9" />

        <circle cx="160" cy="302" r="24" fill="#fff" />
        <path d="M150 312h20v-4h-20zM149 306c-5-1-6-8-1-10-1-6 7-9 11-5 4-4 12-1 11 5 5 2 4 9-1 10z" fill="var(--blue)" />

        <text x="196" y="296" fill="#fff" fontSize="17" fontWeight="800" letterSpacing="-.01em">Instant recipes</text>
        <text x="196" y="314" fill="#fff" fontSize="11.5" opacity=".9">from what you already have</text>

        <g className="how-progress">
          <rect x="196" y="332" width="112" height="20" rx="10" fill="none" stroke="#fff" strokeWidth="1.5" opacity=".9" />
          <rect className="how-bar" x="199" y="335" width="60" height="14" rx="7" fill="var(--light-2)" />
          <text x="252" y="346" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="800" letterSpacing=".08em">COOKING</text>
        </g>
        <g transform="translate(320 332)" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 8h18v9a4 4 0 01-4 4H6a4 4 0 01-4-4zM0 8h22M8 4v-3M14 4v-3" />
        </g>
        </g>
      </svg>
    </section>
  )
}
