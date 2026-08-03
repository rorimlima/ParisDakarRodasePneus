import React, { useMemo, useState } from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Save,
  ListChecks,
  Tag,
  Loader2
} from 'lucide-react';

import { CategoriaCatalogo, GrupoCategoria, ProdutoCatalogo } from '../../types/catalog';
import { catalogService } from '../../services/catalogService';
import { CAMPOS_POR_GRUPO, ROTULO_GRUPO } from '../../config/fichaTecnica';

interface GestaoCategoriasProps {
  categorias: CategoriaCatalogo[];
  produtos: ProdutoCatalogo[];
  onAviso: (mensagem: string) => void;
}

const GRUPOS: GrupoCategoria[] = [
  'rodas',
  'pneus',
  'kits-lift',
  'acessorios',
  'pecas',
  'iluminacao',
  'engate',
  'capota',
  'fixacao',
  'lubrificantes',
  'consumo',
  'usados',
  'outros'
];

export const GestaoCategorias: React.FC<GestaoCategoriasProps> = ({
  categorias,
  produtos,
  onAviso
}) => {
  const [expandida, setExpandida] = useState<string | null>(null);
  const [salvando, setSalvando] = useState<string | null>(null);

  const contagem = useMemo(() => {
    return produtos.reduce(
      (acc, p) => {
        const atual = acc[p.categoriaSlug] || { total: 0, ativos: 0, semEstoque: 0 };
        atual.total += 1;
        if (p.ativo) atual.ativos += 1;
        if (p.quantidade <= 0) atual.semEstoque += 1;
        acc[p.categoriaSlug] = atual;
        return acc;
      },
      {} as Record<string, { total: number; ativos: number; semEstoque: number }>
    );
  }, [produtos]);

  const atualizar = async (categoria: CategoriaCatalogo, mudancas: Partial<CategoriaCatalogo>) => {
    setSalvando(categoria.slug);
    try {
      const atualizada = { ...categoria, ...mudancas };
      // Trocar de grupo troca o formulário de ficha técnica que os produtos herdam.
      if (mudancas.grupo && mudancas.grupo !== categoria.grupo) {
        atualizada.campos = CAMPOS_POR_GRUPO[mudancas.grupo];
      }
      await catalogService.salvarCategoria(atualizada);
      onAviso(`Categoria "${atualizada.nomeExibicao}" atualizada.`);
    } catch (erro) {
      onAviso(`Falha ao salvar categoria: ${(erro as Error).message}`);
    } finally {
      setSalvando(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#111111] rounded-xl border border-white/10 p-6 space-y-2">
        <h3 className="text-sm font-black uppercase italic tracking-wider text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#8B0000]" />
          <span>Categorias &amp; Ficha Técnica ({categorias.length})</span>
        </h3>
        <p className="text-xs text-gray-400 max-w-3xl">
          As categorias nascem da coluna <code className="text-amber-400">TipoProduto_Descricao</code>{' '}
          na importação. Cada uma define os campos que o painel exige no cadastro do produto —
          furação, marcas de veículo atendidas, tipo de pneu, garantia — e é isso que monta a
          ficha técnica exibida no site.
        </p>
      </div>

      <div className="space-y-2">
        {categorias.map((categoria) => {
          const stats = contagem[categoria.slug] || { total: 0, ativos: 0, semEstoque: 0 };
          const aberta = expandida === categoria.slug;
          const campos = categoria.campos?.length
            ? categoria.campos
            : CAMPOS_POR_GRUPO[categoria.grupo] || [];

          return (
            <div
              key={categoria.slug}
              className="bg-[#111111] rounded-xl border border-white/10 overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-3 p-4">
                <button
                  onClick={() => setExpandida(aberta ? null : categoria.slug)}
                  className="flex items-center gap-2 flex-1 min-w-[240px] text-left"
                >
                  {aberta ? (
                    <ChevronDown className="w-4 h-4 text-[#8B0000] shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="font-black uppercase italic text-sm text-white block truncate">
                      {categoria.nomeExibicao}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono block truncate">
                      {categoria.nomeOriginal}
                    </span>
                  </div>
                </button>

                <div className="flex items-center gap-2 text-[10px] font-bold">
                  <span className="px-2 py-1 rounded bg-[#1a1a1a] border border-white/10 text-gray-300">
                    {stats.total} itens
                  </span>
                  <span className="px-2 py-1 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                    {stats.ativos} no site
                  </span>
                  {stats.semEstoque > 0 && (
                    <span className="px-2 py-1 rounded bg-red-950 border border-red-800 text-red-300">
                      {stats.semEstoque} zerados
                    </span>
                  )}
                </div>

                <select
                  value={categoria.grupo}
                  onChange={(e) => atualizar(categoria, { grupo: e.target.value as GrupoCategoria })}
                  className="px-2.5 py-1.5 rounded bg-[#1a1a1a] border border-white/10 text-[11px] text-white focus:outline-none"
                  title="Grupo define o formulário de ficha técnica"
                >
                  {GRUPOS.map((g) => (
                    <option key={g} value={g}>
                      {ROTULO_GRUPO[g]}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => atualizar(categoria, { visivelNoSite: !categoria.visivelNoSite })}
                  disabled={salvando === categoria.slug}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-wider border transition ${
                    categoria.visivelNoSite
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                      : 'bg-zinc-900 text-gray-400 border-white/10 hover:text-white'
                  }`}
                >
                  {salvando === categoria.slug ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : categoria.visivelNoSite ? (
                    <Eye className="w-3 h-3" />
                  ) : (
                    <EyeOff className="w-3 h-3" />
                  )}
                  {categoria.visivelNoSite ? 'Visível' : 'Oculta'}
                </button>
              </div>

              {aberta && (
                <div className="border-t border-white/10 p-4 space-y-4 bg-[#0A0A0A]">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                        <Tag className="w-3 h-3" />
                        Nome exibido no site
                      </label>
                      <input
                        type="text"
                        defaultValue={categoria.nomeExibicao}
                        onBlur={(e) => {
                          const valor = e.target.value.trim().slice(0, 80);
                          if (valor && valor !== categoria.nomeExibicao) {
                            atualizar(categoria, { nomeExibicao: valor });
                          }
                        }}
                        className="w-full px-3 py-2 rounded bg-[#111111] border border-white/10 text-white text-[11px] focus:outline-none focus:border-[#8B0000]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Ordem de exibição
                      </label>
                      <input
                        type="number"
                        defaultValue={categoria.ordem}
                        onBlur={(e) => {
                          const valor = Number(e.target.value);
                          if (Number.isFinite(valor) && valor !== categoria.ordem) {
                            atualizar(categoria, { ordem: valor });
                          }
                        }}
                        className="w-full px-3 py-2 rounded bg-[#111111] border border-white/10 text-white text-[11px] focus:outline-none focus:border-[#8B0000]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Identificador (slug)
                      </label>
                      <input
                        type="text"
                        value={categoria.slug}
                        readOnly
                        className="w-full px-3 py-2 rounded bg-[#111111] border border-white/10 text-gray-500 text-[11px] font-mono cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                      <ListChecks className="w-3 h-3 text-amber-400" />
                      Campos exigidos no cadastro ({campos.length})
                    </span>

                    <div className="overflow-x-auto rounded border border-white/10">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="bg-black text-gray-500 uppercase text-[9px] tracking-wider">
                            <th className="p-2">Campo</th>
                            <th className="p-2">Tipo</th>
                            <th className="p-2 text-center">Obrigatório</th>
                            <th className="p-2 text-center">No card</th>
                            <th className="p-2 text-center">Filtrável</th>
                            <th className="p-2">Opções</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {[...campos]
                            .sort((a, b) => a.ordem - b.ordem)
                            .map((campo) => (
                              <tr key={campo.key} className="hover:bg-[#111111]">
                                <td className="p-2">
                                  <span className="text-white font-bold block">{campo.label}</span>
                                  <span className="text-gray-600 font-mono text-[9px]">
                                    {campo.key}
                                  </span>
                                </td>
                                <td className="p-2 text-gray-400 font-mono">{campo.tipo}</td>
                                <td className="p-2 text-center">
                                  {campo.obrigatorio ? (
                                    <span className="text-[#8B0000] font-black">sim</span>
                                  ) : (
                                    <span className="text-gray-600">—</span>
                                  )}
                                </td>
                                <td className="p-2 text-center">
                                  {campo.destaqueNoCard ? '✓' : <span className="text-gray-600">—</span>}
                                </td>
                                <td className="p-2 text-center">
                                  {campo.filtravel ? '✓' : <span className="text-gray-600">—</span>}
                                </td>
                                <td className="p-2 text-gray-500 max-w-[280px] truncate">
                                  {campo.opcoes?.length
                                    ? `${campo.opcoes.length} opções: ${campo.opcoes
                                        .slice(0, 4)
                                        .join(', ')}${campo.opcoes.length > 4 ? '…' : ''}`
                                    : '—'}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>

                    <button
                      onClick={() => atualizar(categoria, { campos: CAMPOS_POR_GRUPO[categoria.grupo] })}
                      className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#1a1a1a] border border-white/10 text-gray-300 hover:text-white text-[10px] font-bold uppercase tracking-widest transition"
                    >
                      <Save className="w-3 h-3" />
                      Restaurar campos padrão do grupo
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {categorias.length === 0 && (
          <div className="bg-[#111111] rounded-xl border border-white/10 p-10 text-center text-gray-500 text-xs">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
            Nenhuma categoria cadastrada. Importe a planilha do ERP — as categorias são criadas
            automaticamente a partir de TipoProduto_Descricao.
          </div>
        )}
      </div>
    </div>
  );
};
