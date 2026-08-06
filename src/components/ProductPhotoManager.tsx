import React, { useState } from 'react';
import { Upload, Camera, X, Loader2, ImageOff, Link as LinkIcon } from 'lucide-react';
import { enviarFotoProduto, ImagemInvalidaError } from '../services/productImageService';

interface ProductPhotoManagerProps {
  /** SKU do produto — organiza o caminho no Storage. Aceita rascunho antes do SKU existir. */
  codigoProduto: string;
  images: string[];
  onChange: (images: string[]) => void;
}

/**
 * Fotos reais de produto: upload do computador, captura direta pela câmera do
 * celular (input file com `capture="environment"`) ou colar uma URL já hospedada.
 * A primeira foto da lista é sempre a capa exibida no card do site.
 */
export const ProductPhotoManager: React.FC<ProductPhotoManagerProps> = ({
  codigoProduto,
  images,
  onChange
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [urlInput, setUrlInput] = useState('');

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const url = await enviarFotoProduto(codigoProduto, file);
      onChange([...images, url]);
    } catch (err) {
      setError(err instanceof ImagemInvalidaError ? err.message : 'Falha ao enviar a foto. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('protocolo inválido');
      onChange([...images, parsed.toString()]);
      setUrlInput('');
      setError('');
    } catch {
      setError('URL de imagem inválida — use um link http(s) direto para a foto.');
    }
  };

  return (
    <div className="space-y-2">
      {images.length > 0 ? (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img, idx) => (
            <div
              key={`${img}-${idx}`}
              className="relative aspect-square rounded-lg overflow-hidden border pd-border pd-surface-2"
            >
              <img
                src={img}
                alt={`Foto ${idx + 1} do produto`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.opacity = '0.15';
                }}
              />
              {idx === 0 && (
                <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[8px] font-bold uppercase text-center py-0.5">
                  Capa
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute top-1 right-1 w-5 h-5 bg-red-900/90 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition"
                title="Remover foto"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 pd-surface-2 border border-dashed pd-border rounded-lg text-[11px] pd-text-3">
          <ImageOff className="w-4 h-4 shrink-0" />
          <span>Nenhuma foto real cadastrada ainda. Envie uma foto do produto — não usamos mais imagens de banco de imagens.</span>
        </div>
      )}

      {error && <p className="text-[10px] text-red-400 font-bold">{error}</p>}

      <div className="grid grid-cols-2 gap-2">
        <label
          className={`flex items-center justify-center gap-2 px-3 py-2.5 pd-surface-2 border pd-border rounded cursor-pointer hover:border-[#8B0000] transition text-xs font-bold pd-text-2 ${
            uploading ? 'opacity-50 pointer-events-none' : ''
          }`}
          title="Selecionar arquivo do computador"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 pd-brand-text animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5 pd-brand-text" />
          )}
          Do Computador
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </label>

        <label
          className={`flex items-center justify-center gap-2 px-3 py-2.5 pd-surface-2 border pd-border rounded cursor-pointer hover:border-[#8B0000] transition text-xs font-bold pd-text-2 ${
            uploading ? 'opacity-50 pointer-events-none' : ''
          }`}
          title="Tirar foto com a câmera do celular"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 pd-brand-text animate-spin" />
          ) : (
            <Camera className="w-3.5 h-3.5 pd-brand-text" />
          )}
          Câmera / Celular
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </label>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Ou cole a URL de uma foto já hospedada..."
          className="flex-1 px-3 py-2 rounded pd-surface-2 border pd-border pd-text text-[11px]"
        />
        <button
          type="button"
          onClick={handleAddUrl}
          className="px-3 py-2 pd-surface-2 border pd-border rounded text-[10px] font-bold pd-text-2 hover:border-[#8B0000] transition flex items-center gap-1 shrink-0"
        >
          <LinkIcon className="w-3 h-3" />
          Add
        </button>
      </div>
    </div>
  );
};
