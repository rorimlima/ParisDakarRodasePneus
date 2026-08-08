import React, { useState, useRef } from 'react';
import { Upload, Camera, X, Loader2, ImageOff, Link as LinkIcon, Star, ArrowLeft, ArrowRight, Eye, Image as ImageIcon } from 'lucide-react';
import { enviarFotoProduto, ImagemInvalidaError } from '../services/productImageService';

interface ProductPhotoManagerProps {
  /** SKU do produto — organiza o caminho no Storage. Aceita rascunho antes do SKU existir. */
  codigoProduto: string;
  images: string[];
  onChange: (images: string[]) => void;
}

/**
 * Galeria de fotos reais do produto:
 * - Upload de múltiplos arquivos simultâneos do computador ou câmera
 * - Suporte a Drag & Drop
 * - Definir foto de capa (primeira foto)
 * - Reordenar galeria (mover foto para esquerda/direita)
 * - Adicionar foto via URL externa
 * - Visualizar em tela cheia (Preview)
 */
export const ProductPhotoManager: React.FC<ProductPhotoManagerProps> = ({
  codigoProduto,
  images,
  onChange
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMultipleFiles = async (filesList: FileList | File[] | null) => {
    if (!filesList || filesList.length === 0) return;
    const files = Array.from(filesList);
    setError('');
    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    const newUrls: string[] = [];
    let hasError = false;

    for (let i = 0; i < files.length; i++) {
      setUploadProgress({ current: i + 1, total: files.length });
      try {
        const url = await enviarFotoProduto(codigoProduto, files[i]);
        newUrls.push(url);
      } catch (err) {
        hasError = true;
        setError(err instanceof ImagemInvalidaError ? err.message : 'Erro ao enviar algumas fotos.');
      }
    }

    if (newUrls.length > 0) {
      onChange([...images, ...newUrls]);
    }
    setUploading(false);
  };

  const handleRemove = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  const handleSetCover = (idx: number) => {
    if (idx === 0) return;
    const item = images[idx];
    const rest = images.filter((_, i) => i !== idx);
    onChange([item, ...rest]);
  };

  const handleMove = (idx: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= images.length) return;
    const nextImages = [...images];
    const temp = nextImages[idx];
    nextImages[idx] = nextImages[targetIdx];
    nextImages[targetIdx] = temp;
    onChange(nextImages);
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMultipleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-3">
      {/* Cabeçalho da Galeria */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold pd-text flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 pd-brand-text" />
          Galeria de Fotos do Produto ({images.length} {images.length === 1 ? 'foto' : 'fotos'})
        </label>
        {images.length > 0 && (
          <span className="text-[10px] pd-text-3 italic">
            A primeira foto da lista é a Foto de Capa
          </span>
        )}
      </div>

      {/* ÁREA DE DRAG AND DROP E GRID DE FOTOS */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-3 rounded-lg border transition ${
          isDragging
            ? 'border-[#8B0000] bg-[#8B0000]/10'
            : 'pd-border pd-surface-2'
        }`}
      >
        {images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {images.map((img, idx) => (
              <div
                key={`${img}-${idx}`}
                className={`relative aspect-square rounded-lg overflow-hidden border group bg-black/40 ${
                  idx === 0 ? 'border-amber-500 ring-2 ring-amber-500/30' : 'pd-border'
                }`}
              >
                <img
                  src={img}
                  alt={`Foto ${idx + 1} do produto`}
                  className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.opacity = '0.2';
                  }}
                />

                {/* Badge de Capa */}
                {idx === 0 ? (
                  <span className="absolute top-1 left-1 bg-amber-500 text-black text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-black" /> Capa
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetCover(idx)}
                    className="absolute top-1 left-1 bg-black/70 hover:bg-amber-500 hover:text-black text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded transition opacity-0 group-hover:opacity-100 flex items-center gap-1"
                    title="Definir como foto principal de capa"
                  >
                    <Star className="w-2.5 h-2.5" /> Tornar Capa
                  </button>
                )}

                {/* Overlay de Ações da Foto */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1 p-1">
                  {/* Visualizar */}
                  <button
                    type="button"
                    onClick={() => setPreviewUrl(img)}
                    className="p-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 transition"
                    title="Ampliar foto"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {/* Mover para esquerda */}
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => handleMove(idx, 'left')}
                      className="p-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 transition"
                      title="Mover foto para a esquerda"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Mover para direita */}
                  {idx < images.length - 1 && (
                    <button
                      type="button"
                      onClick={() => handleMove(idx, 'right')}
                      className="p-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 transition"
                      title="Mover foto para a direita"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Excluir */}
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1.5 bg-red-700 text-white rounded hover:bg-red-600 transition"
                    title="Remover esta foto"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center text-[11px] pd-text-3 gap-2">
            <ImageOff className="w-8 h-8 opacity-40 pd-brand-text" />
            <p className="font-semibold pd-text-2">Nenhuma foto na galeria deste produto.</p>
            <p className="text-[10px]">Arraste fotos para esta área ou use os botões de upload abaixo para incluir uma ou mais fotos.</p>
          </div>
        )}
      </div>

      {/* Progresso de Upload em Lote */}
      {uploading && (
        <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-400 font-medium">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>Enviando fotos ({uploadProgress.current}/{uploadProgress.total})... por favor aguarde.</span>
        </div>
      )}

      {/* Erro */}
      {error && <p className="text-[11px] text-red-400 font-bold bg-red-950/40 p-2 rounded border border-red-800/40">{error}</p>}

      {/* Botões de Upload Múltiplo */}
      <div className="grid grid-cols-2 gap-2">
        <label
          className={`flex items-center justify-center gap-2 px-3 py-2.5 pd-surface-2 border pd-border rounded cursor-pointer hover:border-[#8B0000] transition text-xs font-bold pd-text-2 ${
            uploading ? 'opacity-50 pointer-events-none' : ''
          }`}
          title="Selecionar uma ou mais fotos do computador"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 pd-brand-text animate-spin" />
          ) : (
            <Upload className="w-4 h-4 pd-brand-text" />
          )}
          Upload Fotos (Selecione Várias)
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              handleMultipleFiles(e.target.files);
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
            <Loader2 className="w-4 h-4 pd-brand-text animate-spin" />
          ) : (
            <Camera className="w-4 h-4 pd-brand-text" />
          )}
          Tirar Foto (Câmera)
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              handleMultipleFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
      </div>

      {/* Adicionar por URL Externa */}
      <div className="flex gap-2">
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Ou cole a URL de uma foto (http://... ou https://...)"
          className="flex-1 px-3 py-2 rounded pd-surface-2 border pd-border pd-text text-[11px]"
        />
        <button
          type="button"
          onClick={handleAddUrl}
          className="px-3 py-2 pd-surface-2 border pd-border rounded text-[10px] font-bold pd-text-2 hover:border-[#8B0000] transition flex items-center gap-1 shrink-0"
        >
          <LinkIcon className="w-3 h-3" />
          Adicionar URL
        </button>
      </div>

      {/* Modal de Preview da Foto Em Ampliação */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] p-2 bg-[#121212] border pd-border rounded-xl shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg hover:bg-red-500 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewUrl}
              alt="Ampliação da foto do produto"
              className="max-w-full max-h-[75vh] object-contain rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
};

