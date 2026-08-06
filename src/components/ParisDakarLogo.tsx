import React from 'react';
import {
  EMBLEM_PATH,
  EMBLEM_TRANSFORM,
  EMBLEM_VIEWBOX,
  WORDMARK_PATH,
  WORDMARK_TRANSFORM,
  WORDMARK_VIEWBOX
} from './brandLogoPaths';

interface ParisDakarLogoProps {
  className?: string;
  variant?: 'full' | 'stacked' | 'icon' | 'compact';
  colorMode?: 'default' | 'light' | 'white';
  height?: number | string;
  /** Ativa o relevo/paralaxe 3D. Desligue em contextos densos (tabelas, listas). */
  enable3D?: boolean;
}

/* Proporções da arte oficial, usadas para dimensionar cada peça. */
const [, , EMBLEM_W, EMBLEM_H] = EMBLEM_VIEWBOX.split(' ').map(Number);
const [, , WORD_W, WORD_H] = WORDMARK_VIEWBOX.split(' ').map(Number);
const EMBLEM_RATIO = EMBLEM_W / EMBLEM_H;
const WORD_RATIO = WORD_W / WORD_H;

/**
 * Logo oficial Paris Dakar Rodas e Pneus.
 *
 * O desenho vem da arte original vetorizada (src/components/brandLogoPaths.ts),
 * sem redesenho: gradiente, relevo e sombra são apenas acabamento aplicado por
 * cima do traço da marca.
 */
export const ParisDakarLogo: React.FC<ParisDakarLogoProps> = ({
  className = '',
  variant = 'full',
  colorMode = 'default',
  height = 48,
  enable3D = true
}) => {
  const mono = colorMode === 'white';
  const uid = React.useId().replace(/:/g, '');
  const gradientId = `pdBrand-${uid}`;

  const numericHeight = typeof height === 'number' ? height : parseInt(String(height), 10) || 48;

  const gradient = (
    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
      {mono ? (
        <>
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#F3EDEB" />
          <stop offset="100%" stopColor="#CFC4C1" />
        </>
      ) : (
        <>
          <stop offset="0%" stopColor="var(--pd-logo-1)" />
          <stop offset="48%" stopColor="var(--pd-logo-2)" />
          <stop offset="100%" stopColor="var(--pd-logo-3)" />
        </>
      )}
    </linearGradient>
  );

  const emblem = (
    <svg
      viewBox={EMBLEM_VIEWBOX}
      height={numericHeight}
      width={numericHeight * EMBLEM_RATIO}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Emblema Paris Dakar"
      className="block shrink-0 overflow-visible"
    >
      <defs>{gradient}</defs>
      <g transform={EMBLEM_TRANSFORM} fill={`url(#${gradientId})`}>
        <path d={EMBLEM_PATH} />
      </g>
    </svg>
  );

  const wordmark = (width: number) => (
    <svg
      viewBox={WORDMARK_VIEWBOX}
      width={width}
      height={width / WORD_RATIO}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Paris Dakar Rodas e Pneus"
      className="block shrink-0 overflow-visible"
    >
      <defs>{gradient}</defs>
      <g transform={WORDMARK_TRANSFORM} fill={`url(#${gradientId})`}>
        <path d={WORDMARK_PATH} />
      </g>
    </svg>
  );

  const shell = enable3D ? 'logo-3d' : '';
  const inner = enable3D ? 'logo-3d__inner' : 'inline-flex items-center gap-3';
  const badge = enable3D ? 'logo-3d__badge' : '';
  const plate = enable3D ? 'logo-3d__plate' : '';
  const invert = mono ? 'logo-3d--invert' : '';

  const emblemBlock = <span className={`relative inline-flex ${badge}`}>{emblem}</span>;

  if (variant === 'icon' || variant === 'compact') {
    return (
      <span className={`${shell} ${invert} select-none ${className}`}>
        <span className={enable3D ? 'logo-3d__inner' : 'inline-flex'}>{emblemBlock}</span>
      </span>
    );
  }

  if (variant === 'stacked') {
    return (
      <span className={`${shell} ${invert} select-none ${className}`}>
        <span className={`${inner} !flex-col !gap-3 relative`}>
          {emblemBlock}
          <span className={plate}>{wordmark(numericHeight * 2.9)}</span>
          {enable3D && <span className="logo-3d__floor" aria-hidden="true" />}
        </span>
      </span>
    );
  }

  // Padrão: emblema à esquerda, tipografia à direita.
  // `min-w-0` permite que o bloco encolha dentro do flex do Header em vez
  // de forçar a largura da página em telas estreitas.
  return (
    <span className={`${shell} ${invert} select-none min-w-0 max-w-full ${className}`}>
      <span className={`${inner} relative min-w-0`}>
        {emblemBlock}
        <span className={`${plate} min-w-0`}>{wordmark(numericHeight * 2.35)}</span>
        {enable3D && <span className="logo-3d__floor" aria-hidden="true" />}
      </span>
    </span>
  );
};
