import React from 'react';

interface ParisDakarLogoProps {
  className?: string;
  variant?: 'full' | 'stacked' | 'icon' | 'compact';
  colorMode?: 'default' | 'light' | 'white';
  height?: number | string;
}

export const ParisDakarLogo: React.FC<ParisDakarLogoProps> = ({
  className = '',
  variant = 'full',
  colorMode = 'default',
  height = 48
}) => {
  // Brand Deep Burgundy Red (#8B0000)
  const brandRed = colorMode === 'white' ? '#FFFFFF' : '#8B0000';
  const subTextColor = colorMode === 'white' ? '#FFFFFF' : colorMode === 'light' ? '#1E293B' : '#8B0000';

  // O ícone escala de forma fluida: nunca menor que 32px, nunca maior que
  // o `height` pedido pelo componente. Em telas estreitas ele encolhe junto
  // com a viewport em vez de forçar a largura do Header.
  const numericHeight = typeof height === 'number' ? height : parseInt(String(height), 10) || 48;
  const fluidSize = `clamp(32px, 9vw, ${numericHeight}px)`;

  // High-fidelity Tuareg Dakar Nomad Silhouette SVG
  const TuaregIcon = (
    <svg
      width={numericHeight}
      height={numericHeight}
      style={{ width: fluidSize, height: fluidSize }}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-300 hover:scale-105 filter drop-shadow-sm"
    >
      <g fill={brandRed}>
        {/* Top Turban Crown Curve */}
        <path d="M60 8 C48 8, 38 15, 34 22 C42 19, 54 18, 62 20 C70 22, 78 20, 84 16 C78 11, 70 8, 60 8 Z" />
        {/* Main Turban Wrap Layer 1 */}
        <path d="M30 25 C24 31, 23 39, 26 45 C32 38, 41 31, 55 31 C68 31, 78 36, 85 42 C88 36, 86 28, 80 23 C71 27, 60 26, 52 24 C44 22, 36 22, 30 25 Z" />
        {/* Turban Wrap Layer 2 (Eye Slit Contour above) */}
        <path d="M25 48 C22 55, 23 63, 28 70 C34 62, 45 54, 58 54 C72 54, 82 61, 87 69 C92 61, 91 52, 87 45 C78 40, 67 36, 56 36 C44 36, 33 40, 25 48 Z" />
        {/* Veil Nose & Chin Cover Layer */}
        <path d="M30 73 C36 80, 44 88, 56 93 C67 88, 75 80, 80 73 C73 77, 64 78, 56 78 C48 78, 39 76, 30 73 Z" />
        {/* Shoulder Garment Swirls (Dakar Rally Classic Lines) */}
        <path d="M35 95 C43 102, 50 107, 56 107 C62 107, 69 102, 77 95 C70 99, 63 100, 56 100 C49 100, 42 99, 35 95 Z" />
        {/* Accent Side Swirl Left */}
        <path d="M21 40 C17 48, 18 56, 22 62 C23 55, 26 49, 30 44 C25 42, 22 41, 21 40 Z" />
        {/* Accent Side Swirl Right */}
        <path d="M91 40 C95 48, 94 56, 90 62 C89 55, 86 49, 82 44 C87 42, 90 41, 91 40 Z" />
      </g>
    </svg>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center select-none ${className}`}>{TuaregIcon}</div>;
  }

  if (variant === 'stacked') {
    return (
      <div className={`inline-flex flex-col items-center text-center select-none ${className}`}>
        {TuaregIcon}
        <div className="flex flex-col items-center mt-1">
          <span
            className="font-black tracking-wider text-xl sm:text-2xl font-serif uppercase leading-none"
            style={{ color: brandRed, fontFamily: 'Georgia, "Times New Roman", Times, serif', letterSpacing: '0.1em' }}
          >
            PARIS DAKAR
          </span>
          <span
            className="text-[0.65rem] sm:text-[0.75rem] font-bold tracking-[0.25em] font-serif italic uppercase mt-1 leading-none"
            style={{ color: subTextColor, fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
          >
            RODAS E PNEUS
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex min-w-0 max-w-full items-center gap-2 sm:gap-3 select-none ${className}`}>
      {TuaregIcon}
      {variant !== 'icon' && (
        // `min-w-0` permite que o bloco de texto encolha dentro do flex do
        // Header. Sem ele, o min-content do logotipo (~200px) empurrava a
        // largura da página em telas de 320–360px.
        <div className="flex min-w-0 flex-col justify-center leading-none">
          {/* Tracking e corpo do texto reduzidos no mobile: o letter-spacing
              saiu do style inline para poder variar por breakpoint. */}
          <span
            className="font-black text-base sm:text-xl md:text-2xl font-serif uppercase leading-tight tracking-[0.04em] sm:tracking-[0.08em]"
            style={{ color: brandRed, fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
          >
            PARIS DAKAR
          </span>
          <span
            className="text-[0.55rem] sm:text-[0.7rem] font-bold tracking-[0.12em] sm:tracking-[0.22em] font-serif italic uppercase mt-0.5"
            style={{ color: subTextColor, fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
          >
            RODAS E PNEUS
          </span>
        </div>
      )}
    </div>
  );
};
