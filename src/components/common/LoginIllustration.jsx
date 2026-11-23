const ink = "#2a2f38";

function LoginIllustration() {
  return (
    <svg
      className="signin-illustration"
      viewBox="0 0 460 380"
      role="img"
      aria-label="A supermarket checkout counter with a cash register, groceries and a shopping basket"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* soft background blob */}
      <path
        d="M98 120c18-58 92-86 150-70 46 12 66-12 104 6 52 24 60 92 34 140-24 44-12 92-70 102-50 8-96-14-146-4-56 12-104-24-98-80 4-40 14-52 26-94z"
        fill="#fff1e8"
      />
      <rect x="40" y="70" width="46" height="14" rx="7" fill="#ffeadd" />
      <rect x="96" y="70" width="22" height="14" rx="7" fill="#ffeadd" />

      {/* floating confetti */}
      <circle cx="150" cy="70" r="5" stroke="#ff8a65" strokeWidth="3" />
      <circle cx="372" cy="102" r="4" stroke="#f26a21" strokeWidth="3" />
      <path d="M118 150l6 6M124 150l-6 6" stroke="#34c38f" strokeWidth="3" />
      <rect x="300" y="50" width="8" height="8" rx="2" transform="rotate(45 304 54)" fill="#ffa06b" />
      <path d="M342 160l8-4 2 9z" fill="#ffd166" />
      <path d="M386 190h28M392 200h14" stroke={ink} strokeWidth="3" />
      <circle cx="424" cy="200" r="4" stroke={ink} strokeWidth="3" />

      {/* price-tag icon */}
      <g transform="translate(108 92)">
        <path d="M0 10V0h10l16 16-10 10z" fill="#fff" stroke={ink} strokeWidth="3" />
        <circle cx="6" cy="6" r="2" fill={ink} />
      </g>

      {/* cash register */}
      <g>
        <rect x="186" y="128" width="104" height="22" rx="6" fill="#ff8a65" stroke={ink} strokeWidth="3" />
        <text x="238" y="144" textAnchor="middle" fontFamily="Montserrat, sans-serif" fontWeight="800" fontSize="12" fill="#fff">
          $ 24.50
        </text>
        <path d="M232 150v14h12v-14" fill="#fff" stroke={ink} strokeWidth="3" />
        <path d="M176 164h124l12 74H164z" fill="#fff" stroke={ink} strokeWidth="3" />
        {[0, 1, 2].map((row) =>
          [0, 1, 2, 3].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={190 + col * 24}
              y={176 + row * 16}
              width="16"
              height="9"
              rx="3"
              fill={row === 2 && col === 3 ? "#34c38f" : "#ffe3d1"}
            />
          )),
        )}
        <rect x="168" y="222" width="140" height="16" rx="4" fill="#f26a21" stroke={ink} strokeWidth="3" />
      </g>

      {/* grocery bag */}
      <g>
        <path d="M76 176h66l-6 62H82z" fill="#ffd166" stroke={ink} strokeWidth="3" />
        <path d="M94 176c0-14 6-22 15-22s15 8 15 22" stroke={ink} strokeWidth="3" />
        <path d="M88 168c-4-14 2-26 10-30" stroke="#34c38f" strokeWidth="5" />
        <path d="M128 172c2-18 10-26 18-26" stroke="#34c38f" strokeWidth="5" />
        <circle cx="116" cy="164" r="9" fill="#ff8a65" stroke={ink} strokeWidth="3" />
        <rect x="100" y="198" width="20" height="14" rx="3" fill="#fff" stroke={ink} strokeWidth="2.5" />
      </g>

      {/* milk + apple on counter */}
      <g>
        <path d="M330 188h22v50h-22z" fill="#fff" stroke={ink} strokeWidth="3" />
        <path d="M330 188l4-12h14l4 12" fill="#ffe3d1" stroke={ink} strokeWidth="3" />
        <rect x="334" y="204" width="14" height="14" rx="2" fill="#ffa06b" />
        <circle cx="378" cy="226" r="12" fill="#34c38f" stroke={ink} strokeWidth="3" />
        <path d="M378 214c0-6 4-9 8-10" stroke={ink} strokeWidth="3" />
      </g>

      {/* counter */}
      <rect x="54" y="238" width="352" height="16" rx="8" fill="#ffe3a3" stroke={ink} strokeWidth="3" />
      <path d="M86 254v74M374 254v74" stroke={ink} strokeWidth="3" />
      <path d="M86 254h12v74H86zM362 254h12v74h-12z" fill="#ffe3a3" stroke={ink} strokeWidth="3" />

      {/* shopping basket on floor */}
      <g>
        <path d="M262 290h74l-8 38h-58z" fill="#f26a21" stroke={ink} strokeWidth="3" />
        <path d="M276 290c0-14 8-22 23-22s23 8 23 22" stroke={ink} strokeWidth="3" />
        <path d="M282 300v20M299 300v20M316 300v20" stroke="#fff" strokeWidth="2.5" />
      </g>

      {/* floor line */}
      <path d="M30 330h40M84 330h290M388 330h20M420 330h10" stroke={ink} strokeWidth="3" />
    </svg>
  );
}

export default LoginIllustration;
