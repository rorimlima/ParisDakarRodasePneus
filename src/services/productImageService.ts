import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { obterAuth, obterStorage } from '../firebase/config';

/**
 * Upload de fotos reais de produto para o Firebase Storage.
 *
 * A validação de tipo/tamanho aqui é só UX (feedback rápido antes de gastar upload) —
 * quem realmente barra arquivo malicioso ou fora do limite é `storage.rules`
 * (`produtos/{codigo}/{arquivo}`), que exige o mesmo whitelist e é a fonte da verdade.
 * SVG fica de fora de propósito: vira XSS armazenado se servido do mesmo domínio.
 */
const TIPOS_AUTORIZADOS = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;

export class ImagemInvalidaError extends Error {}

function sanitizarNomeArquivo(nomeOriginal: string): string {
  const extensaoBruta = nomeOriginal.split('.').pop()?.toLowerCase() || '';
  const extensao = /^[a-z0-9]{2,5}$/.test(extensaoBruta) ? extensaoBruta : 'jpg';
  const sufixoAleatorio = Math.random().toString(36).slice(2, 8);
  return `${Date.now()}-${sufixoAleatorio}.${extensao}`;
}

/** Só letras/números/hífen/underscore no caminho do Storage — SKU digitado pode conter qualquer coisa. */
function sanitizarCodigoProduto(codigo: string): string {
  const limpo = codigo.trim().replace(/[^a-zA-Z0-9-_]/g, '_');
  return limpo || 'rascunho';
}

export async function enviarFotoProduto(codigoProduto: string, arquivo: File): Promise<string> {
  if (!TIPOS_AUTORIZADOS.includes(arquivo.type)) {
    throw new ImagemInvalidaError('Formato não suportado. Envie uma foto em JPEG, PNG, WEBP ou AVIF.');
  }
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    throw new ImagemInvalidaError('Foto maior que 5MB. Reduza o tamanho antes de enviar.');
  }

  const storage = obterStorage();
  const auth = obterAuth();

  if (!storage || !auth?.currentUser) {
    throw new ImagemInvalidaError(
      'Envio de fotos indisponível: Firebase Storage não está configurado ou a sessão administrativa expirou.'
    );
  }

  const caminho = `produtos/${sanitizarCodigoProduto(codigoProduto)}/${sanitizarNomeArquivo(arquivo.name)}`;
  const referencia = ref(storage, caminho);

  try {
    await uploadBytes(referencia, arquivo, { contentType: arquivo.type });
    return await getDownloadURL(referencia);
  } catch (err: any) {
    if (err?.code === 'storage/unauthorized') {
      throw new ImagemInvalidaError(
        'Permissão negada pelo Storage. Confirme que sua conta de administrador tem e-mail verificado e o cargo correto.'
      );
    }
    throw new ImagemInvalidaError('Falha ao enviar a foto para o servidor. Tente novamente.');
  }
}
