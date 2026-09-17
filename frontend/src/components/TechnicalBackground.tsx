import "../styles/TechnicalBackground.css";

export default function TechnicalBackground() {
  return (
    <div className="technical-bg" aria-hidden="true">
      <div className="technical-bg__grid" />
      <div className="technical-bg__glow technical-bg__glow--one" />
      <div className="technical-bg__glow technical-bg__glow--two" />

      <svg
        className="technical-bg__drawing"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        <g className="technical-bg__circuits">
          <path d="M80 160 H360 V245 H570" />
          <path d="M0 710 H250 V625 H470 V520 H680" />
          <path d="M1010 115 H1260 V210 H1515" />
          <path d="M920 780 H1130 V680 H1370 V590 H1600" />
          <path d="M630 70 V190 H770 V330" />
          <path d="M1330 350 V455 H1450 V520" />
          <circle cx="360" cy="160" r="7" />
          <circle cx="250" cy="625" r="7" />
          <circle cx="570" cy="245" r="7" />
          <circle cx="1260" cy="210" r="7" />
          <circle cx="1130" cy="680" r="7" />
          <circle cx="770" cy="330" r="7" />
        </g>

        <g className="technical-bg__gear technical-bg__gear--large" transform="translate(1230 760)">
          <circle r="118" />
          <circle r="72" />
          <circle r="24" />
          {Array.from({ length: 12 }).map((_, i) => (
            <rect key={i} x="-13" y="-148" width="26" height="43" rx="5" transform={`rotate(${i * 30})`} />
          ))}
        </g>

        <g className="technical-bg__gear technical-bg__gear--medium" transform="translate(260 335)">
          <circle r="82" />
          <circle r="48" />
          <circle r="17" />
          {Array.from({ length: 10 }).map((_, i) => (
            <rect key={i} x="-10" y="-103" width="20" height="31" rx="4" transform={`rotate(${i * 36})`} />
          ))}
        </g>

        <g className="technical-bg__gear technical-bg__gear--small" transform="translate(430 440)">
          <circle r="48" />
          <circle r="27" />
          <circle r="10" />
          {Array.from({ length: 8 }).map((_, i) => (
            <rect key={i} x="-7" y="-61" width="14" height="20" rx="3" transform={`rotate(${i * 45})`} />
          ))}
        </g>

        <g className="technical-bg__nodes">
          <circle cx="145" cy="815" r="4" />
          <circle cx="725" cy="580" r="4" />
          <circle cx="885" cy="250" r="4" />
          <circle cx="1420" cy="300" r="4" />
          <circle cx="1050" cy="900" r="4" />
        </g>
      </svg>

      <div className="technical-bg__scan" />
    </div>
  );
}
