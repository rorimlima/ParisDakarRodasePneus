import React, { useState, useEffect } from 'react';

interface ParisDakarLogoProps {
  className?: string;
  variant?: 'full' | 'stacked' | 'icon' | 'compact';
  colorMode?: 'default' | 'light' | 'white';
  height?: number | string;
  customLogoUrl?: string;
}

export const ParisDakarLogo: React.FC<ParisDakarLogoProps> = ({
  className = '',
  variant = 'full',
  colorMode = 'default',
  height = 44,
  customLogoUrl
}) => {
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Trigger the wheel pass-through entrance animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRevealed(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Responsive color palette based on current site theme & colorMode
  const isLightMode = colorMode === 'light';
  const isWhiteMode = colorMode === 'white';

  // Primary Brand Colors
  const beduinoPrimaryColor = isWhiteMode ? '#FFFFFF' : '#8B0000';
  const beduinoSecondaryColor = isWhiteMode ? '#E2E8F0' : isLightMode ? '#B91C1C' : '#EF4444';
  const mainTextColor = isWhiteMode ? '#FFFFFF' : isLightMode ? '#0F172A' : '#FFFFFF';
  const subTextColor = isWhiteMode ? '#E2E8F0' : isLightMode ? '#8B0000' : '#DC2626';

  // High-Precision 3D Tuareg Beduíno Emblem SVG Component
  const BeduinoEmblem = (
    <div className="relative group/beduino flex items-center justify-center shrink-0">
      <svg
        width={typeof height === 'number' ? height : 44}
        height={typeof height === 'number' ? height : 44}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 transition-all duration-500 transform ${
          isHovered ? 'scale-110 drop-shadow-[0_0_12px_rgba(220,38,38,0.8)]' : 'drop-shadow-md'
        }`}
      >
        <defs>
          <linearGradient id={`beduinoGrad_${colorMode}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={beduinoSecondaryColor} />
            <stop offset="50%" stopColor={beduinoPrimaryColor} />
            <stop offset="100%" stopColor={isWhiteMode ? '#CBD5E1' : '#450A0A'} />
          </linearGradient>
          <filter id={`beduinoGlow_${colorMode}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g fill={`url(#beduinoGrad_${colorMode})`} filter={`url(#beduinoGlow_${colorMode})`}>
          {/* Top Turban Crown Curve */}
          <path d="M60 8 C48 8, 38 15, 34 22 C42 19, 54 18, 62 20 C70 22, 78 20, 84 16 C78 11, 70 8, 60 8 Z" />
          {/* Main Turban Wrap Layer 1 */}
          <path d="M30 25 C24 31, 23 39, 26 45 C32 38, 41 31, 55 31 C68 31, 78 36, 85 42 C88 36, 86 28, 80 23 C71 27, 60 26, 52 24 C44 22, 36 22, 30 25 Z" />
          {/* Turban Wrap Layer 2 */}
          <path d="M25 48 C22 55, 23 63, 28 70 C34 62, 45 54, 58 54 C72 54, 82 61, 87 69 C92 61, 91 52, 87 45 C78 40, 67 36, 56 36 C44 36, 33 40, 25 48 Z" />
          {/* Veil Nose & Chin Cover Layer */}
          <path d="M30 73 C36 80, 44 88, 56 93 C67 88, 75 80, 80 73 C73 77, 64 78, 56 78 C48 78, 39 76, 30 73 Z" />
          {/* Shoulder Garment Swirls */}
          <path d="M35 95 C43 102, 50 107, 56 107 C62 107, 69 102, 77 95 C70 99, 63 100, 56 100 C49 100, 42 99, 35 95 Z" />
          {/* Side Swirls */}
          <path d="M21 40 C17 48, 18 56, 22 62 C23 55, 26 49, 30 44 C25 42, 22 41, 21 40 Z" />
          <path d="M91 40 C95 48, 94 56, 90 62 C89 55, 86 49, 82 44 C87 42, 90 41, 91 40 Z" />
        </g>
      </svg>
    </div>
  );

  // High-Performance 3D Luxury Sports Wheel SVG Icon
  const Wheel3DIcon = (
    <svg
      width={typeof height === 'number' ? height * 0.85 : 36}
      height={typeof height === 'number' ? height * 0.85 : 36}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-500 animate-spin-slow drop-shadow-lg"
    >
      <defs>
        <radialGradient id={`wheelMetal_${colorMode}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor={isWhiteMode ? '#94A3B8' : '#64748B'} />
          <stop offset="85%" stopColor={isWhiteMode ? '#334155' : '#1E293B'} />
          <stop offset="100%" stopColor="#090A0F" />
        </radialGradient>
        <linearGradient id={`wheelRimRed_${colorMode}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#8B0000" />
        </linearGradient>
      </defs>

      {/* Outer Low-Profile Sports Tire Tread */}
      <circle cx="50" cy="50" r="48" fill="#111216" stroke="#2D3748" strokeWidth="2" />
      <circle cx="50" cy="50" r="42" fill="none" stroke="#374151" strokeWidth="3" strokeDasharray="6 3" />

      {/* Outer Rim Lip with Dakar Red Accent */}
      <circle cx="50" cy="50" r="37" fill="none" stroke={`url(#wheelRimRed_${colorMode})`} strokeWidth="3" />

      {/* Forged Alloy Wheel Spokes (6-spoke luxury design) */}
      <circle cx="50" cy="50" r="33" fill={`url(#wheelMetal_${colorMode})`} />

      {/* Spoke cutouts */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <g key={i} transform={`rotate(${angle} 50 50)`}>
          <path d="M44 20 L56 20 L53 35 L47 35 Z" fill="#090A0F" opacity="0.9" />
        </g>
      ))}

      {/* Center Cap Beduíno Crimson Badge */}
      <circle cx="50" cy="50" r="11" fill="#8B0000" stroke="#EF4444" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="5" fill="#FFFFFF" opacity="0.9" />
    </svg>
  );

  return (
    <div
      className={`relative inline-flex items-center gap-3 select-none cursor-pointer group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      
      {/* --- A. ANIMATED PASS-THROUGH WHEEL REVEAL OVERLAY --- */}
      <div
        className={`absolute inset-0 pointer-events-none z-30 flex items-center transition-all duration-1000 ease-out ${
          isRevealed ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
        }`}
      >
        <div className="animate-spin-fast text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.9)]">
          {Wheel3DIcon}
        </div>
      </div>

      {/* --- B. LOGO CONTAINER WITH RESPONSIVE BACKGROUND & THEME --- */}
      <div
        className={`flex items-center gap-2.5 transition-all duration-700 ${
          isRevealed ? 'opacity-100 translate-x-0' : 'opacity-20 -translate-x-4'
        }`}
      >
        {/* Tuareg Beduíno Emblem */}
        {BeduinoEmblem}

        {/* --- C. DOCKING WHEEL EFFECT ON HOVER --- */}
        {/* Wheel smooth docking effect beside Beduíno on mouse hover */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-spring flex items-center justify-center ${
            isHovered ? 'w-9 opacity-100 translate-x-0 scale-100 mr-0.5' : 'w-0 opacity-0 -translate-x-3 scale-75'
          }`}
        >
          <div className="transform rotate-45 transition-transform duration-500 group-hover:rotate-0">
            {Wheel3DIcon}
          </div>
        </div>

        {/* Brand Text Typography */}
        {variant !== 'icon' && (
          <div className="flex flex-col justify-center leading-none">
            <span
              className={`font-black uppercase tracking-wider font-serif transition-colors duration-300 ${
                variant === 'compact' ? 'text-base sm:text-lg' : 'text-lg sm:text-xl md:text-2xl'
              }`}
              style={{
                color: mainTextColor,
                fontFamily: 'Georgia, "Times New Roman", Times, serif',
                letterSpacing: '0.08em'
              }}
            >
              PARIS DAKAR
            </span>
            <span
              className={`font-bold tracking-[0.22em] font-serif italic uppercase mt-0.5 transition-colors duration-300 ${
                variant === 'compact' ? 'text-[0.55rem] sm:text-[0.62rem]' : 'text-[0.62rem] sm:text-[0.7rem]'
              }`}
              style={{
                color: subTextColor,
                fontFamily: 'Georgia, "Times New Roman", Times, serif'
              }}
            >
              RODAS E PNEUS
            </span>
          </div>
        )}
      </div>

    </div>
  );
};
