import React from 'react';

interface ParisDakarLogoProps {
  className?: string;
  variant?: 'full' | 'stacked' | 'icon' | 'compact';
  colorMode?: 'default' | 'light' | 'white';
  height?: number | string;
  /** Ativa o relevo/paralaxe 3D. Desligue em contextos densos (tabelas, listas). */
  enable3D?: boolean;
}

/* Silhueta do nômade Tuareg: cabeça envolta no turbante e a cauda do véu ao vento. */
const HEAD_PATH =
  'M60 14c-13 0-24 6-31 16-6 9-8 20-6 31 2 12 9 23 19 30 9 6 20 9 31 8 9-1 17-4 24-10-8 3-16 3-24 1 9-6 16-15 19-25 4-13 2-27-6-38C80 19 70 14 60 14Z';
const TAIL_PATH = 'M84 84c8 1 16 0 23-4-4 9-11 16-20 20-3 1-6 2-9 2 4-5 6-11 6-18Z';
/* Vãos entre as voltas do turbante (recortes na máscara). */
const WRAP_GAPS = [
  'M26 40c14-11 34-14 51-8l-3 10c-15-6-32-3-45 6Z',
  'M22 58c17-12 40-14 59-6l-3 10c-17-7-37-5-53 5Z',
  'M28 76c15-10 35-12 51-6l-3 10c-14-5-31-4-45 4Z'
];

/**
 * Emblema Tuareg Paris Dakar — SVG vetorial leve (sem imagem raster).
 * O volume vem de uma camada de extrusão atrás, do gradiente da face e de um
 * realce especular no topo.
 */
const TuaregEmblem: React.FC<{ size: number | string; mono?: boolean; idSuffix: string }> = ({
  size,
  mono = false,
  idSuffix
}) => {
  const faceId = `pdFace-${idSuffix}`;
  const edgeId = `pdEdge-${idSuffix}`;
  const maskId = `pdMask-${idSuffix}`;

  const mask = (
    <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">
      <rect width="120" height="120" fill="#000" />
      <path d={HEAD_PATH} fill="#fff" />
      <path d={TAIL_PATH} fill="#fff" />
      {WRAP_GAPS.map((d) => (
        <path key={d} d={d} fill="#000" />
      ))}
    </mask>
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Emblema Paris Dakar"
      className="block shrink-0"
    >
      <defs>
        <linearGradient id={faceId} x1="18" y1="8" x2="102" y2="114" gradientUnits="userSpaceOnUse">
          {mono ? (
            <>
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="55%" stopColor="#EFE8E6" />
              <stop offset="100%" stopColor="#C2B5B2" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#D93A3A" />
              <stop offset="45%" stopColor="#A31414" />
              <stop offset="100%" stopColor="#5E0000" />
            </>
          )}
        </linearGradient>

        <linearGradient id={edgeId} x1="60" y1="6" x2="60" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={mono ? 0.55 : 0.45} />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        {mask}
      </defs>

      {/* Extrusão traseira — dá a espessura da peça */}
      <g transform="translate(1.8 2.6)" opacity="0.5">
        <rect width="120" height="120" fill={mono ? '#8A8280' : '#3A0000'} mask={`url(#${maskId})`} />
      </g>

      {/* Face principal */}
      <rect width="120" height="120" fill={`url(#${faceId})`} mask={`url(#${maskId})`} />

      {/* Realce especular no topo */}
      <rect
        width="120"
        height="120"
        fill={`url(#${edgeId})`}
        mask={`url(#${maskId})`}
        style={{ mixBlendMode: 'screen' }}
      />
    </svg>
  );
};

export const ParisDakarLogo: React.FC<ParisDakarLogoProps> = ({
  className = '',
  variant = 'full',
  colorMode = 'default',
  height = 48,
  enable3D = true
}) => {
  const mono = colorMode === 'white';
  const idSuffix = React.useId().replace(/[:]/g, '');
  const emblemSize = typeof height === 'number' ? height : height;

  const wordSize = typeof height === 'number' ? Math.round(height * 0.44) : 20;
  const subSize = typeof height === 'number' ? Math.max(8, Math.round(height * 0.155)) : 8;

  const shell3D = enable3D ? 'logo-3d' : '';
  const inner3D = enable3D ? 'logo-3d__inner' : 'inline-flex items-center gap-3';
  const badge3D = enable3D ? 'logo-3d__badge' : '';
  const invert = mono ? 'logo-3d--invert' : '';

  const emblem = (
    <span className={`relative inline-flex ${badge3D}`}>
      <TuaregEmblem size={emblemSize} mono={mono} idSuffix={idSuffix} />
      {enable3D && <span className="logo-3d__shine" aria-hidden="true" />}
    </span>
  );

  const wordmark = (stacked: boolean) => (
    <span className={`flex flex-col ${stacked ? 'items-center text-center' : 'justify-center'} leading-none`}>
      <span className="logo-3d__word" style={{ fontSize: `${wordSize}px` }}>
        PARIS DAKAR
      </span>
      <span className="logo-3d__sub mt-1" style={{ fontSize: `${subSize}px` }}>
        RODAS E PNEUS
      </span>
    </span>
  );

  if (variant === 'icon') {
    return (
      <span className={`${shell3D} ${invert} select-none ${className}`}>
        <span className={enable3D ? 'logo-3d__inner' : 'inline-flex'}>{emblem}</span>
      </span>
    );
  }

  if (variant === 'stacked') {
    return (
      <span className={`${shell3D} ${invert} select-none ${className}`}>
        <span className={`${inner3D} !flex-col !gap-2`}>
          {emblem}
          {wordmark(true)}
          {enable3D && <span className="logo-3d__floor" aria-hidden="true" />}
        </span>
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <span className={`${shell3D} ${invert} select-none ${className}`}>
        <span className={inner3D}>{emblem}</span>
      </span>
    );
  }

  return (
    <span className={`${shell3D} ${invert} select-none ${className}`}>
      <span className={`${inner3D} relative`}>
        {emblem}
        {wordmark(false)}
        {enable3D && <span className="logo-3d__floor" aria-hidden="true" />}
      </span>
    </span>
  );
};
