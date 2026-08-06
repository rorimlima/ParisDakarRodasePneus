import React, { useState } from 'react';
import { Car, Ruler, SlidersHorizontal, RefreshCw, Check, Layers, Filter, ShieldCheck } from 'lucide-react';
import { VEHICLE_BRANDS, ARO_OPTIONS, FURACAO_OPTIONS } from '../data/mockProducts';
import { ProductCategory, VehicleSearchFilter, SizeSearchFilter } from '../types';

interface SearchDashboardProps {
  onApplyVehicleFilter: (filter: VehicleSearchFilter | null) => void;
  onApplySizeFilter: (filter: SizeSearchFilter | null) => void;
  activeCategory: ProductCategory | 'todos';
  onSelectCategory: (cat: ProductCategory | 'todos') => void;
}

export const SearchDashboard: React.FC<SearchDashboardProps> = ({
  onApplyVehicleFilter,
  onApplySizeFilter,
  activeCategory,
  onSelectCategory
}) => {
  const [searchMode, setSearchMode] = useState<'vehicle' | 'size'>('vehicle');

  // Vehicle Search State
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  // Size Search State
  const [selectedAro, setSelectedAro] = useState<string>('');
  const [selectedFuracao, setSelectedFuracao] = useState<string>('');
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
      medidaPneu: '',
      tipoPneu: selectedTireType
    });
  };

  const handleResetFilters = () => {
    setSelectedBrand('');
    setSelectedModel('');
    setSelectedYear('');
    setSelectedAro('');
    setSelectedFuracao('');
    setSelectedTireType('');
    onApplyVehicleFilter(null);
    onApplySizeFilter(null);
    onSelectCategory('todos');
  };

  return (
    <div className="w-full bg-[#111111] border border-white/10 rounded-2xl p-4 sm:p-6 shadow-2xl transition-colors">
      
      {/* Dashboard Top Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div className="min-w-0">
          <h2 className="text-xs font-bold text-[#8B0000] uppercase tracking-widest flex items-center gap-2 mb-1">
            <SlidersHorizontal className="w-4 h-4 text-[#8B0000]" />
            <span>Busca Inteligente & Filtros Técnicos</span>
          </h2>
          <p className="text-xs text-gray-400">
            Selecione por modelo do seu veículo ou por especificações de Aro, Furação e Pneu.
          </p>
        </div>

        {/* Tab Switch: Vehicle vs Size */}
        <div className="flex shrink-0 bg-[#0A0A0A] p-1 rounded border border-white/10 w-full lg:w-auto">
          <button
            onClick={() => setSearchMode('vehicle')}
            className={`flex-1 lg:flex-none min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 rounded text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition ${
              searchMode === 'vehicle'
                ? 'bg-[#1a1a1a] text-white border border-[#8B0000]/60 shadow-sm'
                : 'text-gray-500 hover:text-white'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Por Veículo (4x4)</span>
          </button>

          <button
            onClick={() => setSearchMode('size')}
            className={`flex-1 lg:flex-none min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 rounded text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition ${
              searchMode === 'size'
                ? 'bg-[#1a1a1a] text-white border border-[#8B0000]/60 shadow-sm'
                : 'text-gray-500 hover:text-white'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Por Medida / Aro</span>
          </button>
        </div>
      </div>

      {/* Mode A: Search by Vehicle */}
      {searchMode === 'vehicle' && (
        <div className="pt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Brand Dropdown */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                1. Marca do Veículo
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setSelectedModel('');
                }}
                className="w-full min-w-0 px-3 py-2.5 rounded bg-[#1a1a1a] text-white border border-white/10 text-xs font-medium focus:border-[#8B0000] focus:ring-0 outline-none"
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
                className="w-full min-w-0 px-3 py-2.5 rounded bg-[#1a1a1a] text-white border border-white/10 text-xs font-medium focus:border-[#8B0000] focus:ring-0 outline-none disabled:opacity-40"
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
                className="w-full min-w-0 px-3 py-2.5 rounded bg-[#1a1a1a] text-white border border-white/10 text-xs font-medium focus:border-[#8B0000] focus:ring-0 outline-none"
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
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Garantia de furação exata e compatibilidade com freios originais.</span>
            </div>

            <div className="flex shrink-0 items-stretch gap-2 w-full lg:w-auto">
              <button
                onClick={handleResetFilters}
                className="shrink-0 px-3 py-2 rounded bg-[#1a1a1a] border border-white/10 text-gray-300 text-xs font-semibold hover:text-white transition flex items-center justify-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Limpar
              </button>

              <button
                onClick={handleApplyVehicleSearch}
                className="flex-1 lg:flex-none min-w-0 bg-[#8B0000] hover:bg-red-800 text-white px-4 sm:px-6 py-2.5 rounded text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2"
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Aro Selector */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                Aro
              </label>
              <select
                value={selectedAro}
                onChange={(e) => setSelectedAro(e.target.value)}
                className="w-full min-w-0 px-3 py-2.5 rounded bg-[#1a1a1a] text-white border border-white/10 text-xs font-medium focus:border-[#8B0000] outline-none"
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
                Furação (PCD)
              </label>
              <select
                value={selectedFuracao}
                onChange={(e) => setSelectedFuracao(e.target.value)}
                className="w-full min-w-0 px-3 py-2.5 rounded bg-[#1a1a1a] text-white border border-white/10 text-xs font-medium focus:border-[#8B0000] outline-none"
              >
                <option value="">Todas as Furações</option>
                {FURACAO_OPTIONS.map((fur) => (
                  <option key={fur} value={fur}>
                    {fur} (ex: Hilux, Ranger, RAM)
                  </option>
                ))}
              </select>
            </div>

            {/* Tire Type Selector */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                Tipo de Pneu
              </label>
              <select
                value={selectedTireType}
                onChange={(e) => setSelectedTireType(e.target.value)}
                className="w-full min-w-0 px-3 py-2.5 rounded bg-[#1a1a1a] text-white border border-white/10 text-xs font-medium focus:border-[#8B0000] outline-none"
              >
                <option value="">Qualquer Banda</option>
                <option value="MT">Mud Terrain (MT)</option>
                <option value="AT">All Terrain (AT)</option>
                <option value="LT">Light Truck (LT)</option>
                <option value="HT">Highway Terrain (HT)</option>
              </select>
            </div>

          </div>

          <div className="flex items-stretch justify-end gap-2 pt-2">
            <button
              onClick={handleResetFilters}
              className="shrink-0 px-3 py-2 rounded bg-[#1a1a1a] text-gray-300 text-xs font-semibold hover:text-white"
            >
              Limpar
            </button>

            <button
              onClick={handleApplySizeSearch}
              className="flex-1 lg:flex-none min-w-0 bg-[#8B0000] hover:bg-red-800 text-white px-4 sm:px-6 py-2.5 rounded text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2"
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
          { id: 'todos', label: 'Todos os Itens' },
          { id: 'rodas', label: 'Rodas Off-Road' },
          { id: 'pneus', label: 'Pneus (MT / AT / LT)' },
          { id: 'kits-lift', label: 'Kits de Lift' },
          { id: 'combos', label: 'Combos Prontos' },
          { id: 'acessorios', label: 'Acessórios & Espaçadores' }
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id as any)}
            className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition ${
              activeCategory === cat.id
                ? 'bg-[#8B0000] text-white shadow-sm'
                : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-white/5'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

    </div>
  );
};
