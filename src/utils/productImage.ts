/**
 * Placeholder para produtos sem foto cadastrada.
 *
 * A importação em massa por planilha (rota /api/v1/stock/import) grava
 * `image: ''`, porque a planilha não carrega fotos — só SKU, nome, preço e
 * medidas. `<img src="">` é comportamento indefinido entre navegadores (em
 * alguns, refaz a requisição da própria página), então nunca deixamos essa
 * string vazia chegar ao DOM.
 */
const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#1c1918"/>
      <g fill="none" stroke="#8B0000" stroke-width="2.5" opacity="0.55">
        <circle cx="200" cy="150" r="62"/>
        <circle cx="200" cy="150" r="30"/>
        <circle cx="200" cy="150" r="6" fill="#8B0000" stroke="none"/>
      </g>
      <text x="200" y="240" text-anchor="middle" font-family="system-ui, sans-serif"
            font-size="13" font-weight="700" letter-spacing="1.5" fill="#6b625d">
        FOTO EM CADASTRO
      </text>
    </svg>
  `);

export const productImageSrc = (image: string | undefined | null): string =>
  image && image.trim() ? image : PLACEHOLDER_IMAGE;
