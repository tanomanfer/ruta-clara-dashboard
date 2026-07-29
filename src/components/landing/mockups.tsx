const COLORS = {
  bg: "#1A1D1F",
  surface: "#26292C",
  surface2: "#2F3336",
  border: "#3A3E42",
  text: "#F2F2F0",
  muted: "#9A9D9F",
  accent: "#FF6B35",
  go: "#00C853",
  warn: "#FFB300",
  stop: "#E53935",
};

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 280 560"
      className="w-full h-auto max-w-[220px] mx-auto drop-shadow-xl"
      role="img"
    >
      <rect x="0" y="0" width="280" height="560" rx="34" fill="#000" />
      <rect x="8" y="8" width="264" height="544" rx="26" fill={COLORS.bg} />
      <rect x="100" y="16" width="80" height="18" rx="9" fill="#000" />
      {children}
    </svg>
  );
}

export function SetupMockup() {
  return (
    <PhoneFrame>
      <text x="140" y="70" textAnchor="middle" fill={COLORS.muted} fontSize="9" letterSpacing="2">
        PASO 1 · OBJETIVOS
      </text>
      <text x="140" y="98" textAnchor="middle" fill={COLORS.text} fontSize="17" fontWeight="700">
        ¿Cuánto necesitás
      </text>
      <text x="140" y="118" textAnchor="middle" fill={COLORS.text} fontSize="17" fontWeight="700">
        ganar?
      </text>

      <text x="30" y="160" fill={COLORS.muted} fontSize="9">
        Ganancia mínima por kilómetro
      </text>
      <rect x="28" y="168" width="224" height="56" rx="14" fill={COLORS.surface} stroke={COLORS.border} />
      <text x="46" y="204" fill={COLORS.text} fontSize="24" fontWeight="800" fontFamily="monospace">
        $450
      </text>
      <text x="234" y="202" textAnchor="end" fill={COLORS.muted} fontSize="9">
        $/km
      </text>

      <text x="30" y="252" fill={COLORS.muted} fontSize="9">
        Ganancia mínima por hora
      </text>
      <rect x="28" y="260" width="224" height="56" rx="14" fill={COLORS.surface} stroke={COLORS.border} />
      <text x="46" y="296" fill={COLORS.text} fontSize="24" fontWeight="800" fontFamily="monospace">
        $3.800
      </text>
      <text x="234" y="294" textAnchor="end" fill={COLORS.muted} fontSize="9">
        $/hora
      </text>

      <rect x="28" y="340" width="224" height="48" rx="14" fill={COLORS.accent} />
      <text x="140" y="369" textAnchor="middle" fill="#15110d" fontSize="13" fontWeight="700">
        Guardar y seguir
      </text>
    </PhoneFrame>
  );
}

export function HomeMockup() {
  return (
    <PhoneFrame>
      <text x="30" y="66" fill={COLORS.muted} fontSize="8" letterSpacing="2">
        RUTA CLARA
      </text>
      <text x="30" y="82" fill={COLORS.text} fontSize="10" opacity="0.8">
        Miércoles · turno tarde
      </text>
      <circle cx="242" cy="72" r="16" fill={COLORS.surface} stroke={COLORS.border} />

      <rect x="28" y="104" width="224" height="128" rx="18" fill={COLORS.surface} stroke={COLORS.border} />
      <circle cx="48" cy="128" r="4" fill={COLORS.go} />
      <text x="60" y="132" fill={COLORS.text} fontSize="10" fontWeight="600">
        Esperando viajes
      </text>
      <text x="48" y="160" fill={COLORS.muted} fontSize="8" letterSpacing="1.5">
        GANANCIA HOY
      </text>
      <text x="48" y="200" fill={COLORS.accent} fontSize="34" fontWeight="800" fontFamily="monospace">
        $24.850
      </text>
      <text x="48" y="218" fill={COLORS.muted} fontSize="9">
        7 viajes · 4h 20m en línea
      </text>

      <rect x="28" y="246" width="106" height="80" rx="14" fill={COLORS.surface} stroke={COLORS.border} />
      <text x="40" y="266" fill={COLORS.muted} fontSize="7" letterSpacing="1">
        PROMEDIO $/KM
      </text>
      <text x="40" y="296" fill={COLORS.go} fontSize="20" fontWeight="700" fontFamily="monospace">
        612
      </text>

      <rect x="146" y="246" width="106" height="80" rx="14" fill={COLORS.surface} stroke={COLORS.border} />
      <text x="158" y="266" fill={COLORS.muted} fontSize="7" letterSpacing="1">
        PROMEDIO $/HORA
      </text>
      <text x="158" y="296" fill={COLORS.go} fontSize="20" fontWeight="700" fontFamily="monospace">
        5.730
      </text>

      <rect x="28" y="342" width="106" height="44" rx="12" fill={COLORS.surface} stroke={COLORS.border} />
      <text x="81" y="368" textAnchor="middle" fill={COLORS.text} fontSize="9" fontWeight="600">
        Ver historial
      </text>
      <rect x="146" y="342" width="106" height="44" rx="12" fill={COLORS.surface} stroke={COLORS.border} />
      <text x="199" y="368" textAnchor="middle" fill={COLORS.text} fontSize="9" fontWeight="600">
        Simular viaje
      </text>
    </PhoneFrame>
  );
}

