import React, { useMemo, useState } from 'react';
import {
  Search,
  Power,
  PowerOff,
  Edit,
  Lock,
  Package,
  PackageX,
  AlertTriangle,
  X,
  Save,
  Percent,
  TrendingDown,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Trash2,
  Star
} from 'lucide-react';

import {
  CategoriaCatalogo,
  DESCONTO_MAXIMO_AVISTA,
  PapelUsuario,
  ProdutoCatalogo,
  ProdutoCusto
} from '../../types/catalog';
import { catalogService } from '../../services/catalogService';
import { FichaTecnicaEditor } from './FichaTecnicaEditor';
import {
  calcularMargem,
  calcularMarkup,
  descontoMaximoSeguro,
  formatarBRL,
  simularDescontoAvista
} from '../../utils/pricing';
import { ROTULO_GRUPO } from '../../config/fichaTecnica';
import { urlDeImagemSegura } from '../../utils/produtoAdapter';

interface GestaoCatalogoProps {
  produtos: ProdutoCatalogo[];
  categorias: CategoriaCatalogo[];
  custos: Record<string, ProdutoCusto>;
  papel: PapelUsuario;
  podeVerCusto: boolean;
  onAviso: (mensagem: string) => void;
}

type FiltroStatus = 'todos' | 'publicados' | 'inativos' | 'sem-estoque' | 'ficha-incompleta';

const PAGINA = 40;

export const GestaoCatalogo: React.FC<GestaoCatalogoProps> = ({
  produtos,
  categorias,
  custos,
  papel,
  podeVerCusto,
  onAviso
}) => {
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos');
  const [visiveis, setVisiveis] = useState(PAGINA);
  const [emEdicao, setEmEdicao] = useState<ProdutoCatalogo | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [percentualSimulado, setPercentualSimulado] = useState(DESCONTO_MAXIMO_AVISTA);

  const podeExcluir = papel === 'senior' || papel === 'gerencia';

  const categoriaDe = (slug: string) => categorias.find((c) => c.slug === slug) || null;

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return produtos.filter((p) => {
      if (termo) {
        const alvo = `${p.codigo} ${p.descricao} ${p.referencia || ''} ${p.tipoProduto}`.toLowerCase();
        if (!alvo.includes(termo)) return false;
      }
      if (filtroCategoria !== 'todos' && p.categoriaSlug !== filtroCategoria) return false;

      switch (filtroStatus) {
        case 'publicados':
          return p.ativo;
        case 'inativos':
          return !p.ativo;
        case 'sem-estoque':
          return p.quantidade <= 0;
        case 'ficha-incompleta':
          return (p.fichaCompleta ?? 0) < 100;
        default:
          return true;
      }
    });
  }, [produtos, busca, filtroCategoria, filtroStatus]);

  const pagina = filtrados.slice(0, visiveis);

  // -------------------------------------------------------------------------
  // Ações
  // -------------------------------------------------------------------------

  const alternarPublicacao = async (produto: ProdutoCatalogo) => {
    // Guarda de UI. A guarda real está no serviço, nas rules e na Cloud Function.
    if (!produto.ativo && produto.quantidade <= 0) {
      onAviso(`"${produto.descricao}" está com estoque zerado e não pode ir ao site.`);
      return;
    }
    try {
      await catalogService.definirAtivacao(produto.codigo, !produto.ativoManual);
      onAviso(
        !produto.ativoManual
          ? `${produto.codigo} publicado no site.`
          : `${produto.codigo} removido do site.`
      );
    } catch (erro) {
      onAviso((erro as Error).message);
    }
  };

  const salvarEdicao = async () => {
    if (!emEdicao || salvando) return;
    setSalvando(true);
    try {
      await catalogService.salvarProduto(emEdicao, categoriaDe(emEdicao.categoriaSlug));
      onAviso(`Produto ${emEdicao.codigo} salvo.`);
      setEmEdicao(null);
    } catch (erro) {
      onAviso(`Não foi possível salvar: ${(erro as Error).message}`);
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (produto: ProdutoCatalogo) => {
    if (!podeExcluir) return;
    if (!confirm(`Excluir definitivamente ${produto.codigo} — ${produto.descricao}?`)) return;
    try {
      await catalogService.excluirProduto(produto.codigo);
      onAviso(`Produto ${produto.codigo} excluído.`);
    } catch (erro) {
      onAviso((erro as Error).message);
    }
  };

  // -------------------------------------------------------------------------
  // Simulação de desconto no modal
  // -------------------------------------------------------------------------

  const custoEmEdicao = emEdicao ? custos[emEdicao.codigo]?.valorReposicao : undefined;
  const simulacao = emEdicao
    ? simularDescontoAvista(
        emEdicao.valorVenda,
        percentualSimulado,
        podeVerCusto ? custoEmEdicao : undefined
      )
    : null;

  return (
    <div className="space-y-5">
      {/* Barra de filtros */}
      <div className="bg-[#111111] p-4 rounded-xl border border-white/10 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
          <input
            type="text"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setVisiveis(PAGINA);
            }}
            placeholder="Buscar por código, descrição ou referência..."
            className="w-full pl-9 pr-4 py-2.5 rounded bg-[#1a1a1a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#8B0000]"
          />
        </div>

        <select
          value={filtroCategoria}
          onChange={(e) => {
            setFiltroCategoria(e.target.value);
            setVisiveis(PAGINA);
          }}
          className="px-3 py-2.5 rounded bg-[#1a1a1a] border border-white/10 text-xs text-white focus:outline-none"
        >
          <option value="todos">Todas as categorias ({produtos.length})</option>
          {categorias.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.nomeExibicao}
            </option>
          ))}
        </select>

        <select
          value={filtroStatus}
          onChange={(e) => {
            setFiltroStatus(e.target.value as FiltroStatus);
            setVisiveis(PAGINA);
          }}
          className="px-3 py-2.5 rounded bg-[#1a1a1a] border border-white/10 text-xs text-white focus:outline-none"
        >
          <option value="todos">Todos os status</option>
          <option value="publicados">Publicados no site</option>
          <option value="inativos">Fora do site</option>
          <option value="sem-estoque">Estoque zerado</option>
          <option value="ficha-incompleta">Ficha técnica incompleta</option>
        </select>
      </div>

      {/* Aviso de custo oculto */}
      {!podeVerCusto && (
        <div className="p-3 rounded bg-zinc-900 border border-white/10 text-[11px] text-gray-400 flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-amber-500" />
          <span>
            Valor de reposição e margem são exclusivos de gerência e sênior — não são carregados
            para o seu perfil.
          </span>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-[#111111] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-black border-b border-white/10 text-gray-400 uppercase text-[10px] tracking-wider font-bold">
                <th className="p-3">Código</th>
                <th className="p-3">Descrição</th>
                <th className="p-3">Categoria</th>
                <th className="p-3 text-center">Unid.</th>
                <th className="p-3 text-right">Estoque</th>
                <th className="p-3 text-right">Valor venda</th>
                {podeVerCusto && <th className="p-3 text-right">Reposição</th>}
                {podeVerCusto && <th className="p-3 text-right">Margem</th>}
                <th className="p-3 text-center">Ficha</th>
                <th className="p-3 text-center">No site</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {pagina.map((produto) => {
                const custo = custos[produto.codigo]?.valorReposicao;
                const margem =
                  podeVerCusto && custo ? calcularMargem(produto.valorVenda, custo) : null;
                const semEstoque = produto.quantidade <= 0;
                const ficha = produto.fichaCompleta ?? 0;

                return (
                  <tr
                    key={produto.codigo}
                    className={`hover:bg-[#1a1a1a] transition ${semEstoque ? 'opacity-60' : ''}`}
                  >
                    <td className="p-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                      {produto.codigo}
                    </td>

                    <td className="p-3 max-w-[260px]">
                      <span className="font-bold text-white uppercase block truncate">
                        {produto.descricao}
                      </span>
                      {produto.referencia && produto.referencia !== produto.codigo && (
                        <span className="text-[10px] text-gray-500 block">
                          Ref.: {produto.referencia}
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      <span className="text-gray-300 block text-[11px]">
                        {categoriaDe(produto.categoriaSlug)?.nomeExibicao || produto.tipoProduto}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-gray-600">
                        {ROTULO_GRUPO[produto.grupo] || produto.grupo}
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <span
                        className="px-1.5 py-0.5 rounded bg-[#1a1a1a] border border-white/10 text-[10px] font-mono font-bold text-gray-300"
                        title={produto.unidadeLabel}
                      >
                        {produto.unidade}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <span
                        className={`font-mono font-bold ${
                          semEstoque ? 'text-red-400' : 'text-white'
                        }`}
                      >
                        {produto.quantidade}
                      </span>
                      <span className="text-[9px] text-gray-500 block">{produto.unidadeLabel}</span>
                    </td>

                    <td className="p-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                      {formatarBRL(produto.valorVenda)}
                    </td>

                    {podeVerCusto && (
                      <td className="p-3 text-right font-mono text-amber-300 whitespace-nowrap">
                        {custo ? formatarBRL(custo) : '—'}
                      </td>
                    )}

                    {podeVerCusto && (
                      <td className="p-3 text-right font-mono whitespace-nowrap">
                        {margem === null ? (
                          <span className="text-gray-600">—</span>
                        ) : (
                          <span
                            className={
                              margem < 0
                                ? 'text-red-400 font-bold'
                                : margem < 15
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }
                          >
                            {margem.toFixed(1)}%
                          </span>
                        )}
                      </td>
                    )}

                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-10 h-1 rounded-full bg-[#1a1a1a] overflow-hidden">
                          <div
                            className={`h-full ${
                              ficha === 100 ? 'bg-emerald-500' : ficha >= 50 ? 'bg-amber-500' : 'bg-[#8B0000]'
                            }`}
                            style={{ width: `${ficha}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-mono text-gray-400">{ficha}%</span>
                      </div>
                    </td>

                    {/* Botão de ativação no site */}
                    <td className="p-3 text-center">
                      <button
                        onClick={() => alternarPublicacao(produto)}
                        disabled={semEstoque && !produto.ativo}
                        title={
                          semEstoque
                            ? 'Estoque zerado — desativado automaticamente'
                            : produto.ativo
                            ? 'Clique para tirar do site'
                            : 'Clique para publicar no site'
                        }
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[9px] font-black uppercase tracking-wider border transition ${
                          produto.ativo
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                            : semEstoque
                            ? 'bg-red-950/60 text-red-400 border-red-900 cursor-not-allowed'
                            : 'bg-zinc-900 text-gray-400 border-white/10 hover:border-emerald-700 hover:text-emerald-300'
                        }`}
                      >
                        {produto.ativo ? (
                          <>
                            <Power className="w-3 h-3" />
                            Ativo
                          </>
                        ) : semEstoque ? (
                          <>
                            <PackageX className="w-3 h-3" />
                            Sem estoque
                          </>
                        ) : (
                          <>
                            <PowerOff className="w-3 h-3" />
                            Inativo
                          </>
                        )}
                      </button>
                    </td>

                    <td className="p-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEmEdicao(produto);
                          setPercentualSimulado(DESCONTO_MAXIMO_AVISTA);
                        }}
                        className="p-2 rounded bg-[#1a1a1a] hover:bg-zinc-800 transition"
                        title="Editar ficha técnica"
                      >
                        <Edit className="w-4 h-4 text-amber-400" />
                      </button>

                      {podeExcluir && (
                        <button
                          onClick={() => excluir(produto)}
                          className="p-2 rounded bg-red-950/60 hover:bg-red-900 transition ml-1"
                          title="Excluir produto"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {pagina.length === 0 && (
                <tr>
                  <td colSpan={podeVerCusto ? 11 : 9} className="p-10 text-center text-gray-500">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Nenhum produto para este filtro.
                    {produtos.length === 0 && (
                      <span className="block mt-1 text-[11px]">
                        Importe a planilha do ERP para popular o catálogo.
                      </span>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {visiveis < filtrados.length && (
          <div className="p-4 border-t border-white/10 text-center">
            <button
              onClick={() => setVisiveis((v) => v + PAGINA)}
              className="px-5 py-2 rounded bg-[#1a1a1a] border border-white/10 text-gray-300 hover:text-white text-[10px] font-bold uppercase tracking-widest transition"
            >
              Carregar mais ({filtrados.length - visiveis} restantes)
            </button>
          </div>
        )}
      </div>

      {/* Modal de edição */}
      {emEdicao && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-[#111111] rounded-2xl border border-white/10 shadow-2xl my-8 text-white">
            {/* Cabeçalho */}
            <div className="sticky top-0 z-10 bg-[#111111] flex items-start justify-between gap-4 p-6 border-b border-white/10 rounded-t-2xl">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-black text-amber-400 text-sm">
                    {emEdicao.codigo}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      emEdicao.ativo
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        : 'bg-zinc-900 text-gray-400 border border-white/10'
                    }`}
                  >
                    {emEdicao.ativo ? 'no site' : 'fora do site'}
                  </span>
                </div>
                <h3 className="text-base font-black uppercase italic tracking-wide truncate">
                  {emEdicao.descricao}
                </h3>
                <p className="text-[11px] text-gray-400">
                  {emEdicao.quantidade} {emEdicao.unidadeLabel} em estoque •{' '}
                  {formatarBRL(emEdicao.valorVenda)}
                </p>
              </div>

              <button
                onClick={() => setEmEdicao(null)}
                className="p-2 rounded-full bg-[#1a1a1a] text-gray-400 hover:text-white shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Estado no site */}
              <div
                className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
                  emEdicao.quantidade <= 0
                    ? 'bg-red-950/30 border-red-800/60'
                    : 'bg-[#0A0A0A] border-white/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  {emEdicao.ativo ? (
                    <Eye className="w-5 h-5 text-emerald-400 mt-0.5" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-gray-500 mt-0.5" />
                  )}
                  <div>
                    <strong className="block text-xs uppercase tracking-wider">
                      Exibição no site
                    </strong>
                    <span className="text-[11px] text-gray-400">
                      {emEdicao.quantidade <= 0
                        ? 'Estoque zerado: o produto fica fora do site automaticamente e só volta quando houver reposição.'
                        : emEdicao.ativoManual
                        ? 'Produto publicado — aparece no catálogo público.'
                        : 'Produto oculto por decisão do painel.'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    await alternarPublicacao(emEdicao);
                    const atualizado = await catalogService.obterProduto(emEdicao.codigo);
                    if (atualizado) setEmEdicao(atualizado);
                  }}
                  disabled={emEdicao.quantidade <= 0}
                  className={`px-5 py-2.5 rounded text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 ${
                    emEdicao.quantidade <= 0
                      ? 'bg-red-950/60 text-red-400 border border-red-900 cursor-not-allowed'
                      : emEdicao.ativoManual
                      ? 'bg-zinc-800 text-gray-200 border border-white/10 hover:bg-zinc-700'
                      : 'bg-emerald-700 text-white hover:bg-emerald-600'
                  }`}
                >
                  {emEdicao.quantidade <= 0 ? (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Bloqueado por estoque
                    </>
                  ) : emEdicao.ativoManual ? (
                    <>
                      <PowerOff className="w-3.5 h-3.5" />
                      Desativar do site
                    </>
                  ) : (
                    <>
                      <Power className="w-3.5 h-3.5" />
                      Ativar produto no site
                    </>
                  )}
                </button>
              </div>

              {/* Simulador de desconto */}
              <div className="p-4 rounded-xl bg-[#0A0A0A] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <strong className="text-xs uppercase tracking-wider flex items-center gap-2">
                    <Percent className="w-4 h-4 text-[#8B0000]" />
                    Simulador de desconto à vista
                  </strong>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                    teto de {DESCONTO_MAXIMO_AVISTA}%
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={0}
                    max={DESCONTO_MAXIMO_AVISTA}
                    step={0.5}
                    value={Math.min(percentualSimulado, DESCONTO_MAXIMO_AVISTA)}
                    onChange={(e) => setPercentualSimulado(Number(e.target.value))}
                    className="flex-1 accent-[#8B0000]"
                  />
                  <span className="font-mono font-black text-lg text-white w-16 text-right">
                    {simulacao?.percentualAplicado.toFixed(1)}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase tracking-widest">
                      Preço de tabela
                    </span>
                    <span className="font-mono font-bold text-white">
                      {formatarBRL(emEdicao.valorVenda)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase tracking-widest">
                      Desconto
                    </span>
                    <span className="font-mono font-bold text-amber-400">
                      − {formatarBRL(simulacao?.valorDesconto || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase tracking-widest">
                      À vista
                    </span>
                    <span className="font-mono font-black text-emerald-400">
                      {formatarBRL(simulacao?.valorFinal || 0)}
                    </span>
                  </div>

                  {podeVerCusto && custoEmEdicao ? (
                    <div>
                      <span className="text-gray-500 block text-[9px] uppercase tracking-widest">
                        Margem resultante
                      </span>
                      <span
                        className={`font-mono font-black ${
                          simulacao?.abaixoDoCusto ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {(simulacao?.margemPercentual ?? 0).toFixed(1)}%
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-gray-500 block text-[9px] uppercase tracking-widest">
                        Margem
                      </span>
                      <span className="text-gray-600 flex items-center gap-1 text-[10px]">
                        <Lock className="w-3 h-3" /> restrito
                      </span>
                    </div>
                  )}
                </div>

                {podeVerCusto && custoEmEdicao ? (
                  <div className="pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                    <div>
                      <span className="text-gray-500 block text-[9px] uppercase tracking-widest">
                        Valor de reposição
                      </span>
                      <span className="font-mono font-bold text-amber-300">
                        {formatarBRL(custoEmEdicao)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[9px] uppercase tracking-widest">
                        Markup sobre custo
                      </span>
                      <span className="font-mono text-gray-300">
                        {calcularMarkup(emEdicao.valorVenda, custoEmEdicao).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[9px] uppercase tracking-widest">
                        Desconto máximo seguro
                      </span>
                      <span className="font-mono font-bold text-sky-300">
                        {descontoMaximoSeguro(emEdicao.valorVenda, custoEmEdicao).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ) : null}

                {simulacao?.abaixoDoCusto && (
                  <div className="p-2.5 rounded bg-red-950/50 border border-red-800 text-[11px] text-red-200 flex items-center gap-2">
                    <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                    Com este desconto a venda fica <strong>abaixo do valor de reposição</strong>.
                  </div>
                )}

                <p className="text-[10px] text-gray-500">
                  Valores de simulação interna. A proposta oficial é recalculada no servidor,
                  que aplica o mesmo teto de {DESCONTO_MAXIMO_AVISTA}%.
                </p>
              </div>

              {/* Conteúdo comercial */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Descrição detalhada exibida no site
                  </label>
                  <textarea
                    value={emEdicao.descricaoDetalhada || ''}
                    onChange={(e) =>
                      setEmEdicao({ ...emEdicao, descricaoDetalhada: e.target.value.slice(0, 1500) })
                    }
                    rows={3}
                    className="w-full px-3 py-2 rounded bg-[#0A0A0A] border border-white/10 text-white text-[11px] focus:outline-none focus:border-[#8B0000]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                    <Star className="w-3 h-3 text-amber-400" />
                    Selo / badge
                  </label>
                  <input
                    type="text"
                    value={emEdicao.badge || ''}
                    onChange={(e) => setEmEdicao({ ...emEdicao, badge: e.target.value.slice(0, 30) })}
                    placeholder="Ex.: PRONTA ENTREGA"
                    className="w-full px-3 py-2 rounded bg-[#0A0A0A] border border-white/10 text-white text-[11px] focus:outline-none focus:border-[#8B0000]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Destaque na home
                  </label>
                  <label className="flex items-center gap-2 px-3 py-2 rounded bg-[#0A0A0A] border border-white/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emEdicao.destaque === true}
                      onChange={(e) => setEmEdicao({ ...emEdicao, destaque: e.target.checked })}
                      className="accent-[#8B0000]"
                    />
                    <span className="text-[11px] text-gray-300">
                      {emEdicao.destaque ? 'Em destaque' : 'Sem destaque'}
                    </span>
                  </label>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                    <ImageIcon className="w-3 h-3" />
                    Imagens (uma URL https por linha)
                  </label>
                  <textarea
                    value={(emEdicao.imagens || []).join('\n')}
                    onChange={(e) =>
                      setEmEdicao({
                        ...emEdicao,
                        imagens: e.target.value
                          .split('\n')
                          .map((l) => l.trim())
                          .filter(Boolean)
                          .slice(0, 12)
                      })
                    }
                    rows={3}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded bg-[#0A0A0A] border border-white/10 text-white text-[11px] font-mono focus:outline-none focus:border-[#8B0000]"
                  />
                  {(emEdicao.imagens || []).length > 0 && (
                    <div className="flex gap-2 pt-1 flex-wrap">
                      {emEdicao.imagens.slice(0, 6).map((url, i) => (
                        <img
                          key={i}
                          src={urlDeImagemSegura(url, emEdicao.grupo)}
                          alt=""
                          className="w-14 h-14 object-cover rounded border border-white/10"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Ficha técnica dinâmica */}
              <div className="pt-4 border-t border-white/10">
                <FichaTecnicaEditor
                  produto={emEdicao}
                  categoria={categoriaDe(emEdicao.categoriaSlug)}
                  onChange={setEmEdicao}
                />
              </div>
            </div>

            {/* Rodapé */}
            <div className="sticky bottom-0 bg-[#111111] flex justify-end gap-3 p-6 border-t border-white/10 rounded-b-2xl">
              <button
                onClick={() => setEmEdicao(null)}
                className="px-5 py-2.5 rounded bg-[#1a1a1a] text-gray-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={salvarEdicao}
                disabled={salvando}
                className="bg-[#8B0000] hover:bg-red-800 disabled:opacity-50 text-white px-6 py-2.5 rounded font-black uppercase text-xs tracking-widest flex items-center gap-2 transition"
              >
                <Save className="w-4 h-4" />
                {salvando ? 'Salvando...' : 'Salvar ficha técnica'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
