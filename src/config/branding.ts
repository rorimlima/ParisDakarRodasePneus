/**
 * Configurações de Identidade Visual e Branding Oficial
 * Paris Dakar Rodas e Pneus
 */
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const OFFICIAL_BRAND = {
  name: 'Paris Dakar Rodas e Pneus',
  shortName: 'Paris Dakar Rodas',
  slogan: 'Rodas e Pneus de Alta Performance',
  logo: {
    // Caminho da imagem oficial no projeto
    filePath: path.join(__dirname, '../../assets/logo/paris_dakar_official_logo.jpg'),
    publicPath: '/assets/logo.jpg',
    // Paleta de Cores extraída da marca oficial
    colors: {
      primaryRed: '#8B0000', // Crimson Red Oficial Dakar
      darkRed: '#5A0000',
      lightRed: '#A01111',
      bgDark: '#0D0E12',
      bgLight: '#FFFFFF',
      textPrimary: '#1A1A1A',
      textMuted: '#6B7280',
    },
    // Elemento SVG Vetorial Oficial (Tuareg Dakar Motif + Tipografia Serif)
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300" width="100%" height="100%">
  <g transform="translate(300, 90)">
    <!-- Dakar Tuareg Icon -->
    <path d="M -25,25 C -35,15 -35,-5 -25,-25 C -15,-40 0,-45 0,-45 C 0,-45 15,-40 25,-25 C 35,-5 35,15 25,25 C 15,35 0,35 0,35 C 0,35 -15,35 -25,25 Z" fill="#8B0000"/>
    <path d="M -15,-20 Q 0,-30 15,-20 Q 20,0 15,15 Q 0,25 -15,15 Q -20,0 -15,-20 Z" fill="#FFFFFF" opacity="0.95"/>
    <path d="M -10,-10 C -5,-18 5,-18 10,-10 C 12,-2 8,10 0,15 C -8,10 -12,-2 -10,-10 Z" fill="#8B0000"/>
  </g>
  <text x="300" y="210" text-anchor="middle" font-family="'Times New Roman', Times, 'Georgia', serif" font-weight="bold" font-size="42" fill="#8B0000" letter-spacing="2">PARIS DAKAR</text>
  <text x="300" y="250" text-anchor="middle" font-family="'Times New Roman', Times, 'Georgia', serif" font-style="italic" font-size="24" fill="#8B0000" letter-spacing="4">RODAS E PNEUS</text>
</svg>`,
  },
};
