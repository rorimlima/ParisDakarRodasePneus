import React, { useState } from 'react';
import { SlidersHorizontal, RefreshCw, Layers, Filter, Truck } from 'lucide-react';
import { ARO_OPTIONS, FURACAO_OPTIONS, VEHICLE_BRANDS } from '../data/mockProducts';
import { ProductCategory, SizeSearchFilter } from '../types';

export interface CategoriaDisponivel {
  grupo: string;
  label: string;
  total: number;
}

interface SearchDashboardProps {
  onApplySizeFilter: (filter: SizeSearchFilter | null) => void;
  activeCategory: ProductCategory | 'todos';
  onSelectCategory: (cat: ProductCategory | 'todos') => void;
  categorias?: CategoriaDisponivel[];
  activeBrand?: string | null;
  onSelectBrand?: (brand: string | null) => void;
}

export const SearchDashboard: React.FC<SearchDashboardProps> = ({
  onApplySizeFilter,
  activeCategory,
  onSelectCategory,
  categorias = [],
  activeBrand = null,
  onSelectBrand
}) => {
  // Size Search State
  const [selectedAro, setSelectedAro] = useState<string>('');
  const [selectedFuracao, setSelectedFuracao] = useState<string>('');
  const [selectedMedidaPneu, setSelectedMedidaPneu] = useState<string>('');
  const [selectedTireType, setSelectedTireType] = useState<string>('');

  const handleApplySizeSearch = () => {
    onApplySizeFilter({
      category: activeCategory,
      aro: selectedAro,
      furacao: selectedFuracao,
      medidaPneu: selectedMedidaPneu,
      tipoPneu: selectedTireType
    });
  };

  const handleResetFilters = () => {
    setSelectedAro('');
    setSelectedFuracao('');
    setSelectedMedidaPneu('');
    setSelectedTireType('');
    onApplySizeFilter(null);
    onSelectCategory('todos');
    if (onSelectBrand) {
      onSelectBrand(null);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-lg dark:shadow-2xl transition-colors duration-250">
      
      {/* Dashboard Top Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-205 dark:border-white/10">
        <div>
          <h2 className="text-sm font-semibold text-red-700 dark:text-red-400 tracking-tight font-heading flex items-center gap-2 mb-1">
            <SlidersHorizontal className="w-4 h-4 text-red-650 dark:text-red-500" />
            <span>Busca Técnica &amp; Filtros de Compatibilidade</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-normal">
            Selecione por especificações de Aro, Furação e Pneu.
          </p>
        </div>
      </div>

      {/* Mode B: Search by Size / Measurements */}
      <div className="pt-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Aro Selector */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block mb-1.5">
              1. Aro
            </label>
            <select
              value={selectedAro}
              onChange={(e) => setSelectedAro(e.target.value)}
              className="w-full px-3 py-2.5 rounded bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-white border border-slate-250 dark:border-white/10 text-xs font-medium focus:border-red-600 dark:focus:border-red-500 focus:ring-1 focus:ring-red-600/40 outline-none transition"
            >
              <option value="">Qualquer Aro</option>
              {ARO_OPTIONS.map((aro) => (
                <option key={aro} value={aro}>
                  Aro {aro}
                </option>
              ))}
            </select>
          </div>

          {/* Furação Selector */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block mb-1.5">
              2. Furação (PCD)
            </label>
            <select
              value={selectedFuracao}
              onChange={(e) => setSelectedFuracao(e.target.value)}
              className="w-full px-3 py-2.5 rounded bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-white border border-slate-250 dark:border-white/10 text-xs font-medium focus:border-red-600 dark:focus:border-red-500 focus:ring-1 focus:ring-red-600/40 outline-none transition"
            >
              <option value="">Todas as Furações</option>
              {FURACAO_OPTIONS.map((fur) => (
                <option key={fur} value={fur}>
                  {fur} (ex: Hilux, Ranger, RAM)
                </option>
              ))}
            </select>
          </div>

          {/* Pneu & Referência Input */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block mb-1.5">
              3. Pneu / Referência
            </label>
            <input
              type="text"
              value={selectedMedidaPneu}
              onChange={(e) => setSelectedMedidaPneu(e.target.value)}
              placeholder="Ex: 265/70R17, 35x12.5"
              className="w-full px-3 py-2.5 rounded bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-white border border-slate-250 dark:border-white/10 text-xs font-medium focus:border-red-600 dark:focus:border-red-500 focus:ring-1 focus:ring-red-600/40 outline-none placeholder-slate-400 dark:placeholder-zinc-500 transition"
            />
          </div>

          {/* Tire Type Selector */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block mb-1.5">
              4. Banda do Pneu
            </label>
            <select
              value={selectedTireType}
              onChange={(e) => setSelectedTireType(e.target.value)}
              className="w-full px-3 py-2.5 rounded bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-white border border-slate-250 dark:border-white/10 text-xs font-medium focus:border-red-600 dark:focus:border-red-500 focus:ring-1 focus:ring-red-600/40 outline-none transition"
            >
              <option value="">Qualquer Banda</option>
              <option value="MT">Mud Terrain (MT)</option>
              <option value="AT">All Terrain (AT)</option>
              <option value="LT">Light Truck (LT)</option>
              <option value="HT">Highway Terrain (HT)</option>
            </select>
          </div>

        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={handleResetFilters}
            className="px-4 py-2.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition border border-slate-200 dark:border-white/5"
          >
            Limpar Filtros
          </button>

          <button
            onClick={handleApplySizeSearch}
            className="bg-[#8B0000] hover:bg-red-800 text-white px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition flex items-center gap-2 shadow-md"
          >
            <Filter className="w-4 h-4" />
            Aplicar Filtros Técnicos
          </button>
        </div>
      </div>

      {/* Vehicle Brands Visual Quick Filter */}
      <div className="pt-5 mt-4 border-t border-slate-150 dark:border-white/10">
        <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mr-2 flex items-center gap-1.5 mb-2.5">
          <Truck className="w-4 h-4 text-red-650 dark:text-red-500" />
          Filtrar por Veículo 4x4 / Pickups:
        </span>
        <div className="flex flex-wrap gap-2">
          {VEHICLE_BRANDS.map((brand) => {
            const isSelected = activeBrand === brand.name;
            return (
              <button
                key={brand.id}
                onClick={() => onSelectBrand?.(isSelected ? null : brand.name)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                  isSelected
                    ? 'bg-[#8B0000] border-red-500 text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-[#1a1a1a] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-white/5'
                }`}
              >
                {brand.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-5 mt-4 border-t border-slate-150 dark:border-white/10">
        <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mr-2 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          Categorias:
        </span>

        {[
          { id: 'todos', label: 'Todos os Itens', total: categorias.reduce((s, c) => s + c.total, 0) },
          ...categorias.map((c) => ({ id: c.grupo, label: c.label, total: c.total }))
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id as ProductCategory | 'todos')}
            className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition ${
              activeCategory === cat.id
                ? 'bg-[#8B0000] text-white shadow-sm'
                : 'bg-slate-50 dark:bg-[#1a1a1a] text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/5'
            }`}
          >
            {cat.label}
            {cat.total > 0 && <span className="ml-1.5 opacity-60">{cat.total}</span>}
          </button>
        ))}

        {categorias.length === 0 && (
          <span className="text-[10px] text-gray-600 italic">
            As categorias aparecem aqui conforme os produtos são publicados no painel.
          </span>
        )}
      </div>
    </div>
  );
};
