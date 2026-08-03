import React, { useState } from 'react';
import { Car, Ruler, SlidersHorizontal, RefreshCw, Check, Layers, Filter, ShieldCheck } from 'lucide-react';
import { VEHICLE_BRANDS, ARO_OPTIONS, FURACAO_OPTIONS } from '../data/mockProducts';
import { ProductCategory, VehicleSearchFilter, SizeSearchFilter } from '../types';

/** Categoria com produtos publicados, vinda do Firestore. */
export interface CategoriaDisponivel {
  grupo: string;
  label: string;
  total: number;
}

interface SearchDashboardProps {
  onApplyVehicleFilter: (filter: VehicleSearchFilter | null) => void;
  onApplySizeFilter: (filter: SizeSearchFilter | null) => void;
  activeCategory: ProductCategory | 'todos';
  onSelectCategory: (cat: ProductCategory | 'todos') => void;
  /** Preenchida pelo catálogo real; só entram categorias com produto no ar. */
  categorias?: CategoriaDisponivel[];
}

export const SearchDashboard: React.FC<SearchDashboardProps> = ({
  onApplyVehicleFilter,
  onApplySizeFilter,
  activeCategory,
  onSelectCategory,
  categorias = []
}) => {
  const [searchMode, setSearchMode] = useState<'vehicle' | 'size'>('vehicle');

  // Vehicle Search State
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  // Size Search State
  const [selectedAro, setSelectedAro] = useState<string>('');
  const [selectedFuracao, setSelectedFuracao] = useState<string>('');
  const [selectedMedidaPneu, setSelectedMedidaPneu] = useState<string>('');
  const [selectedTireType, setSelectedTireType] = useState<string>('');

  const availableModels = selectedBrand
    ? VEHICLE_BRANDS.find((b) => b.id === selectedBrand)?.models || []
    : [];

  const handleApplyVehicleSearch = () => {
    if (!selectedBrand) {
      onApplyVehicleFilter(null);
      return;
    }
    const brandName = VEHICLE_BRANDS.find((b) => b.id === selectedBrand)?.name || '';
    onApplyVehicleFilter({
      marca: brandName,
      modelo: selectedModel,
      ano: selectedYear,
      versao: ''
    });
  };

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
    setSelectedBrand('');
    setSelectedModel('');
    setSelectedYear('');
    setSelectedAro('');
    setSelectedFuracao('');
    setSelectedMedidaPneu('');
    setSelectedTireType('');
    onApplyVehicleFilter(null);
    onApplySizeFilter(null);
    onSelectCategory('todos');
  };

  return (
    <div className="w-full bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-lg dark:shadow-2xl transition-colors">
      
      {/* Dashboard Top Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div>
          <h2 className="text-sm font-semibold text-red-700 dark:text-red-400 tracking-tight font-heading flex items-center gap-2 mb-1">
            <SlidersHorizontal className="w-4 h-4 text-red-600 dark:text-red-500" />
            <span>Busca Técnica &amp; Filtros de Compatibilidade</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-zinc-400 font-normal">
            Selecione por modelo do seu veículo ou por especificações de Aro, Furação e Pneu.
          </p>
        </div>

        {/* Tab Switch: Vehicle vs Size */}
        <div className="flex bg-slate-100 dark:bg-zinc-950 p-1 rounded-lg border border-slate-200 dark:border-white/10 w-full sm:w-auto">
          <button
            onClick={() => setSearchMode('vehicle')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition ${
              searchMode === 'vehicle'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border border-red-600/40 shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Por Veículo (4x4)</span>
          </button>

          <button
            onClick={() => setSearchMode('size')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition ${
              searchMode === 'size'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border border-red-600/40 shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Por Medida / Aro</span>
          </button>
        </div>
      </div>

      {/* Mode A: Search by Vehicle */}
      {searchMode === 'vehicle' && (
        <div className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Brand Dropdown */}
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                1. Marca do Veículo
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setSelectedModel('');
                }}
                className="w-full px-3 py-2.5 rounded bg-[#1a1a1a] text-white border border-white/10 text-xs font-medium focus:border-[#8B0000] focus:ring-0 outline-none"
              >
                <option value="">-- Selecione a Montadora --</option>
                {VEHICLE_BRANDS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Model Dropdown */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                2. Modelo
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={!selectedBrand}
                className="w-full px-3 py-2.5 rounded bg-[#1a1a1a] text-white border border-white/10 text-xs font-medium focus:border-[#8B0000] focus:ring-0 outline-none disabled:opacity-40"
              >
                <option value="">-- Selecione o Modelo --</option>
                {availableModels.map((mod) => (
                  <option key={mod} value={mod}>
                    {mod}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Dropdown */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                3. Ano de Fabricação
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2.5 rounded bg-[#1a1a1a] text-white border border-white/10 text-xs font-medium focus:border-[#8B0000] focus:ring-0 outline-none"
              >
                <option value="">-- Selecione o Ano --</option>
                {Array.from({ length: 15 }, (_, i) => 2026 - i).map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Vehicle Search Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Garantia de furação exata e compatibilidade com freios originais.</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleResetFilters}
                className="px-3 py-2 rounded bg-[#1a1a1a] border border-white/10 text-gray-300 text-xs font-semibold hover:text-white transition flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Limpar
              </button>

              <button
                onClick={handleApplyVehicleSearch}
                className="bg-[#8B0000] hover:bg-red-800 text-white px-6 py-2.5 rounded text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Filtrar Produtos Compatíveis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode B: Search by Size / Measurements */}
      {searchMode === 'size' && (
        <div className="pt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Aro Selector */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                1. Aro
              </label>
              <select
                value={selectedAro}
                onChange={(e) => setSelectedAro(e.target.value)}
                className="w-full px-3 py-2.5 rounded bg-[#1a1a1a] text-white border border-white/10 text-xs font-medium focus:border-[#8B0000] outline-none"
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
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                2. Furação (PCD)
              </label>
              <select
                value={selectedFuracao}
                onChange={(e) => setSelectedFuracao(e.target.value)}
                className="w-full px-3 py-2.5 rounded bg-[#1a1a1a] text-white border border-white/10 text-xs font-medium focus:border-[#8B0000] outline-none"
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
              <label className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-1.5">
                3. Pneu / Referência do Pneu
              </label>
              <input
                type="text"
                value={selectedMedidaPneu}
                onChange={(e) => setSelectedMedidaPneu(e.target.value)}
                placeholder="Ex: 265/70R17, 285/75R16, 35x12.5"
                className="w-full px-3 py-2.5 rounded bg-[#1a1a1a] text-white border border-white/10 text-xs font-medium focus:border-[#8B0000] outline-none placeholder-zinc-500"
              />
            </div>

            {/* Tire Type Selector */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                4. Banda do Pneu
              </label>
              <select
                value={selectedTireType}
                onChange={(e) => setSelectedTireType(e.target.value)}
                className="w-full px-3 py-2.5 rounded bg-[#1a1a1a] text-white border border-white/10 text-xs font-medium focus:border-[#8B0000] outline-none"
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
              className="px-3 py-2 rounded bg-[#1a1a1a] text-gray-300 text-xs font-semibold hover:text-white"
            >
              Limpar
            </button>

            <button
              onClick={handleApplySizeSearch}
              className="bg-[#8B0000] hover:bg-red-800 text-white px-6 py-2.5 rounded text-xs font-black uppercase tracking-widest transition flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Aplicar Filtros Técnicos
            </button>
          </div>
        </div>
      )}

      {/* Category Pills Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-5 mt-4 border-t border-white/10">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mr-2 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" />
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
                : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-white/5'
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
