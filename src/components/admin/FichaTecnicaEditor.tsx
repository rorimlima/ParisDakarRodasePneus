import React, { useMemo, useState } from 'react';
import { Plus, X, ClipboardList, AlertTriangle, CheckCircle2, Search } from 'lucide-react';

import { CampoFichaTecnica, CategoriaCatalogo, ProdutoCatalogo, ValorFichaTecnica } from '../../types/catalog';
import { CAMPOS_POR_GRUPO, calcularCompletudeFicha } from '../../config/fichaTecnica';
import { MODELOS_POR_MARCA } from '../../config/marcasVeiculos';

/**
 * Editor de ficha técnica gerado a partir do schema da categoria.
 *
 * `marcasAtendidas` e `modelosAtendidos` são campos de primeiro nível do produto
 * (o site filtra por eles e as rules validam o tamanho da lista), mas aparecem no
 * formulário como parte da ficha — daí o tratamento especial abaixo.
 */

const CHAVES_DE_PRIMEIRO_NIVEL = new Set(['marcasAtendidas', 'modelosAtendidos']);

// ---------------------------------------------------------------------------
// Multiselect com busca e valor livre
// ---------------------------------------------------------------------------

interface MultiSelectProps {
  valores: string[];
  opcoes: string[];
  onChange: (valores: string[]) => void;
  permiteValorLivre?: boolean;
  placeholder?: string;
  limite?: number;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  valores,
  opcoes,
  onChange,
  permiteValorLivre = false,
  placeholder = 'Buscar...',
  limite = 40
}) => {
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState(false);

  const disponiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return opcoes
      .filter((o) => !valores.includes(o))
      .filter((o) => (termo ? o.toLowerCase().includes(termo) : true))
      .slice(0, 40);
  }, [opcoes, valores, busca]);

  const adicionar = (valor: string) => {
    const limpo = valor.trim().slice(0, 60);
    if (!limpo || valores.includes(limpo)) return;
    if (valores.length >= limite) return;
    onChange([...valores, limpo]);
    setBusca('');
  };

  return (
    <div className="space-y-2">
      {valores.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {valores.map((valor) => (
            <span
              key={valor}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#8B0000]/20 border border-[#8B0000]/50 text-[10px] font-bold text-red-200"
            >
              {valor}
              <button
                type="button"
                onClick={() => onChange(valores.filter((v) => v !== valor))}
                className="hover:text-white"
                aria-label={`Remover ${valor}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-500" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onFocus={() => setAberto(true)}
          onBlur={() => window.setTimeout(() => setAberto(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (permiteValorLivre && busca.trim()) adicionar(busca);
              else if (disponiveis[0]) adicionar(disponiveis[0]);
            }
          }}
          placeholder={`${placeholder} (${valores.length}/${limite})`}
          className="w-full pl-8 pr-3 py-2 rounded bg-[#0A0A0A] border border-white/10 text-white text-[11px] focus:outline-none focus:border-[#8B0000]"
        />

        {aberto && (disponiveis.length > 0 || (permiteValorLivre && busca.trim())) && (
          <div className="absolute z-20 mt-1 w-full max-h-52 overflow-y-auto rounded border border-white/15 bg-[#111111] shadow-2xl">
            {permiteValorLivre && busca.trim() && !opcoes.includes(busca.trim()) && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => adicionar(busca)}
                className="w-full text-left px-3 py-2 text-[11px] text-amber-300 hover:bg-[#1a1a1a] flex items-center gap-2 border-b border-white/5"
              >
                <Plus className="w-3 h-3" />
                Adicionar “{busca.trim()}”
              </button>
            )}
            {disponiveis.map((opcao) => (
              <button
                key={opcao}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => adicionar(opcao)}
                className="w-full text-left px-3 py-2 text-[11px] text-gray-200 hover:bg-[#1a1a1a] hover:text-white"
              >
                {opcao}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Campo individual
// ---------------------------------------------------------------------------

interface CampoProps {
  campo: CampoFichaTecnica;
  valor: ValorFichaTecnica;
  onChange: (valor: ValorFichaTecnica) => void;
  opcoesExtras?: string[];
}

const CampoFicha: React.FC<CampoProps> = ({ campo, valor, onChange, opcoesExtras }) => {
  const classeBase =
    'w-full px-3 py-2 rounded bg-[#0A0A0A] border border-white/10 text-white text-[11px] focus:outline-none focus:border-[#8B0000]';

  const opcoes = useMemo(() => {
    const base = campo.opcoes || [];
    if (!opcoesExtras?.length) return base;
    return Array.from(new Set([...opcoesExtras, ...base]));
  }, [campo.opcoes, opcoesExtras]);

  const vazio =
    valor === undefined ||
    valor === null ||
    valor === '' ||
    (Array.isArray(valor) && valor.length === 0);

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
        {campo.label}
        {campo.obrigatorio && <span className="text-[#8B0000]">*</span>}
        {campo.obrigatorio && vazio && (
          <AlertTriangle className="w-3 h-3 text-amber-500" aria-label="Campo obrigatório vazio" />
        )}
      </label>

      {campo.tipo === 'textarea' && (
        <textarea
          value={typeof valor === 'string' ? valor : ''}
          onChange={(e) => onChange(e.target.value.slice(0, 1200))}
          placeholder={campo.placeholder}
          rows={3}
          className={classeBase}
        />
      )}

      {campo.tipo === 'text' && (
        <input
          type="text"
          value={typeof valor === 'string' ? valor : ''}
          onChange={(e) => onChange(e.target.value.slice(0, 200))}
          placeholder={campo.placeholder}
          className={classeBase}
        />
      )}

      {campo.tipo === 'number' && (
        <input
          type="number"
          value={typeof valor === 'number' ? valor : ''}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          placeholder={campo.placeholder}
          min={0}
          className={classeBase}
        />
      )}

      {campo.tipo === 'boolean' && (
        <label className="flex items-center gap-2 px-3 py-2 rounded bg-[#0A0A0A] border border-white/10 cursor-pointer">
          <input
            type="checkbox"
            checked={valor === true}
            onChange={(e) => onChange(e.target.checked)}
            className="accent-[#8B0000]"
          />
          <span className="text-[11px] text-gray-300">{valor === true ? 'Sim' : 'Não'}</span>
        </label>
      )}

      {campo.tipo === 'select' && (
        <div className="space-y-1">
          <select
            value={typeof valor === 'string' && opcoes.includes(valor) ? valor : ''}
            onChange={(e) => onChange(e.target.value)}
            className={classeBase}
          >
            <option value="">— selecione —</option>
            {opcoes.map((opcao) => (
              <option key={opcao} value={opcao}>
                {opcao}
              </option>
            ))}
          </select>

          {campo.permiteValorLivre && (
            <input
              type="text"
              value={typeof valor === 'string' && !opcoes.includes(valor) ? valor : ''}
              onChange={(e) => onChange(e.target.value.slice(0, 120))}
              placeholder="ou digite um valor fora da lista"
              className={`${classeBase} text-gray-400`}
            />
          )}
        </div>
      )}

      {campo.tipo === 'multiselect' && (
        <MultiSelect
          valores={Array.isArray(valor) ? valor : []}
          opcoes={opcoes}
          onChange={onChange}
          permiteValorLivre={campo.permiteValorLivre}
          placeholder={campo.placeholder || 'Buscar e adicionar'}
          limite={campo.key === 'modelosAtendidos' ? 80 : 40}
        />
      )}

      {campo.ajuda && <p className="text-[10px] text-gray-500 leading-snug">{campo.ajuda}</p>}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

interface FichaTecnicaEditorProps {
  produto: ProdutoCatalogo;
  categoria?: CategoriaCatalogo | null;
  onChange: (produto: ProdutoCatalogo) => void;
}

export const FichaTecnicaEditor: React.FC<FichaTecnicaEditorProps> = ({
  produto,
  categoria,
  onChange
}) => {
  const campos = useMemo(() => {
    const lista = categoria?.campos?.length ? categoria.campos : CAMPOS_POR_GRUPO[produto.grupo] || [];
    return [...lista].sort((a, b) => a.ordem - b.ordem);
  }, [categoria, produto.grupo]);

  /** Modelos das marcas já selecionadas sobem para o topo da lista. */
  const modelosSugeridos = useMemo(
    () => (produto.marcasAtendidas || []).flatMap((marca) => MODELOS_POR_MARCA[marca] || []),
    [produto.marcasAtendidas]
  );

  const lerValor = (chave: string): ValorFichaTecnica => {
    if (chave === 'marcasAtendidas') return produto.marcasAtendidas || [];
    if (chave === 'modelosAtendidos') return produto.modelosAtendidos || [];
    return produto.fichaTecnica?.[chave] ?? null;
  };

  const gravarValor = (chave: string, valor: ValorFichaTecnica) => {
    if (CHAVES_DE_PRIMEIRO_NIVEL.has(chave)) {
      const lista = Array.isArray(valor) ? valor : [];
      onChange({
        ...produto,
        [chave]: chave === 'marcasAtendidas' ? lista.slice(0, 40) : lista.slice(0, 80)
      });
      return;
    }
    onChange({
      ...produto,
      fichaTecnica: { ...(produto.fichaTecnica || {}), [chave]: valor }
    });
  };

  const completude = useMemo(
    () =>
      calcularCompletudeFicha(campos, {
        ...produto.fichaTecnica,
        marcasAtendidas: produto.marcasAtendidas,
        modelosAtendidos: produto.modelosAtendidos
      }),
    [campos, produto.fichaTecnica, produto.marcasAtendidas, produto.modelosAtendidos]
  );

  const pendentes = campos
    .filter((c) => c.obrigatorio)
    .filter((c) => {
      const valor = lerValor(c.key);
      if (Array.isArray(valor)) return valor.length === 0;
      if (typeof valor === 'boolean') return false;
      if (typeof valor === 'number') return !Number.isFinite(valor);
      return !valor || String(valor).trim() === '';
    });

  return (
    <div className="space-y-4">
      {/* Cabeçalho de completude */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded bg-[#0A0A0A] border border-white/10">
        <div className="flex items-center gap-2 text-[11px]">
          <ClipboardList className="w-4 h-4 text-[#8B0000]" />
          <span className="text-gray-300">
            Ficha técnica de{' '}
            <strong className="text-white">{categoria?.nomeExibicao || produto.tipoProduto}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-28 h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
            <div
              className={`h-full transition-all ${
                completude === 100 ? 'bg-emerald-500' : completude >= 50 ? 'bg-amber-500' : 'bg-[#8B0000]'
              }`}
              style={{ width: `${completude}%` }}
            />
          </div>
          <span
            className={`text-[10px] font-black ${
              completude === 100 ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {completude}%
          </span>
          {completude === 100 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
        </div>
      </div>

      {pendentes.length > 0 && (
        <div className="p-3 rounded bg-amber-950/30 border border-amber-800/50 text-[11px] text-amber-200 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Faltam <strong>{pendentes.length}</strong> campo(s) obrigatório(s):{' '}
            {pendentes.map((c) => c.label).join(', ')}. O produto pode ser publicado assim
            mesmo, mas a ficha fica incompleta para o cliente.
          </span>
        </div>
      )}

      {/* Campos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {campos.map((campo) => (
          <div
            key={campo.key}
            className={campo.tipo === 'textarea' || campo.tipo === 'multiselect' ? 'sm:col-span-2' : ''}
          >
            <CampoFicha
              campo={campo}
              valor={lerValor(campo.key)}
              onChange={(valor) => gravarValor(campo.key, valor)}
              opcoesExtras={campo.key === 'modelosAtendidos' ? modelosSugeridos : undefined}
            />
          </div>
        ))}
      </div>

      {campos.length === 0 && (
        <p className="text-[11px] text-gray-500 italic">
          Esta categoria ainda não tem campos de ficha técnica definidos. Configure em
          “Categorias &amp; Ficha Técnica”.
        </p>
      )}
    </div>
  );
};
