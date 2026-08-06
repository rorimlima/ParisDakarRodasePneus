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

const CATEGORIES = [
  { id: 'todos', label: 'Todos os itens' },
  { id: 'rodas', label: 'Rodas off-road' },
  { id: 'pneus', label: 'Pneus MT / AT / LT' },
  { id: 'kits-lift', label: 'Kits de lift' },
  { id: 'combos', label: 'Combos prontos' },
  { id: 'acessorios', label: 'Acessórios' }
] as const;

const YEARS = Array.from({ length: 15 }, (_, i) => 2026 - i);

export const SearchDashboard: React.FC<SearchDashboardProps> = ({
  onApplyVehicleFilter,
  onApplySizeFilter,
  activeCategory,
  onSelectCategory
}) => {
  const [searchMode, setSearchMode] = useState<'vehicle' | 'size'>('vehicle');

  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  const [selectedAro, setSelectedAro] = useState<string>('');
  const [selectedFuracao, setSelectedFuracao] = useState<string>('');
  const [selectedTireType, setSelectedTireType] = useState<string>('');
  const [selectedRef, setSelectedRef] = useState<string>('');

  const availableModels = selectedBrand
    ? VEHICLE_BRANDS.find((b) => b.id === selectedBrand)?.models || []
    : [];

  const handleApplyVehicleSearch = () => {
    if (!selectedBrand) {
      onApplyVehicleFilter(null);
      return;
    }
    onApplyVehicleFilter({
      marca: VEHICLE_BRANDS.find((b) => b.id === selectedBrand)?.name || '',
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
      tipoPneu: selectedTireType,
      referencia: selectedRef
    });
  };

  const handleResetFilters = () => {
    setSelectedBrand('');
    setSelectedModel('');
    setSelectedYear('');
    setSelectedAro('');
    setSelectedFuracao('');
    setSelectedTireType('');
    setSelectedRef('');
    onApplyVehicleFilter(null);
    onApplySizeFilter(null);
    onSelectCategory('todos');
  };

  return (
    <div className="pd-card p-5 sm:p-7">
      {/* Cabeçalho e alternador de modo */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b pd-border">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] pd-brand-text flex items-center gap-2 mb-1.5">
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
            <span>Busca inteligente</span>
          </h2>
          <p className="text-xs pd-text-3 leading-relaxed">
            Filtre pelo modelo do seu veículo ou pelas especificações de aro, furação e pneu.
          </p>
        </div>

        <div
          className="pd-surface-2 border pd-border rounded-xl p-1 flex gap-1 w-full lg:w-auto"
          role="tablist"
          aria-label="Modo de busca"
        >
          <button
            type="button"
            role="tab"
            aria-selected={searchMode === 'vehicle'}
            onClick={() => setSearchMode('vehicle')}
            className={`btn btn-sm flex-1 lg:flex-none ${
              searchMode === 'vehicle' ? 'btn-primary' : 'btn-ghost'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Por veículo</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={searchMode === 'size'}
            onClick={() => setSearchMode('size')}
            className={`btn btn-sm flex-1 lg:flex-none ${
              searchMode === 'size' ? 'btn-primary' : 'btn-ghost'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Por medida</span>
          </button>
        </div>
      </div>

      {/* Modo A: por veículo */}
      {searchMode === 'vehicle' && (
        <div className="pt-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="pd-label" htmlFor="filtro-marca">
                1. Marca do veículo
              </label>
              <select
                id="filtro-marca"
                className="pd-select"
                value={selectedBrand}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setSelectedModel('');
                }}
              >
                <option value="">Selecione a montadora</option>
                {VEHICLE_BRANDS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="pd-label" htmlFor="filtro-modelo">
                2. Modelo
              </label>
              <select
                id="filtro-modelo"
                className="pd-select"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={!selectedBrand}
              >
                <option value="">Selecione o modelo</option>
                {availableModels.map((mod) => (
                  <option key={mod} value={mod}>
                    {mod}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="pd-label" htmlFor="filtro-ano">
                3. Ano de fabricação
              </label>
              <select
                id="filtro-ano"
                className="pd-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="">Selecione o ano</option>
                {YEARS.map((year) => (
                  <option key={year} value={String(year)}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-xs pd-success-text font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Furação exata e compatibilidade com os freios originais conferidas.</span>
            </p>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button type="button" onClick={handleResetFilters} className="btn btn-subtle">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>

              <button
                type="button"
                onClick={handleApplyVehicleSearch}
                className="btn btn-primary flex-1 sm:flex-none"
              >
                <Check className="w-4 h-4" />
                <span>Filtrar compatíveis</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modo B: por medida */}
      {searchMode === 'size' && (
        <div className="pt-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="pd-label" htmlFor="filtro-aro">
                Aro
              </label>
              <select
                id="filtro-aro"
                className="pd-select"
                value={selectedAro}
                onChange={(e) => setSelectedAro(e.target.value)}
              >
                <option value="">Qualquer aro</option>
                {ARO_OPTIONS.map((aro) => (
                  <option key={aro} value={aro}>
                    Aro {aro}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="pd-label" htmlFor="filtro-furacao">
                Furação (PCD)
              </label>
              <select
                id="filtro-furacao"
                className="pd-select"
                value={selectedFuracao}
                onChange={(e) => setSelectedFuracao(e.target.value)}
              >
                <option value="">Todas as furações</option>
                {FURACAO_OPTIONS.map((fur) => (
                  <option key={fur} value={fur}>
                    {fur}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="pd-label" htmlFor="filtro-pneu">
                Tipo de pneu
              </label>
              <select
                id="filtro-pneu"
                className="pd-select"
                value={selectedTireType}
                onChange={(e) => setSelectedTireType(e.target.value)}
              >
                <option value="">Qualquer banda</option>
                <option value="MT">Mud Terrain (MT)</option>
                <option value="AT">All Terrain (AT)</option>
                <option value="LT">Light Truck (LT)</option>
                <option value="HT">Highway Terrain (HT)</option>
              </select>
            </div>

            <div>
              <label className="pd-label" htmlFor="filtro-ref">
                Referência / SKU
              </label>
              <input
                id="filtro-ref"
                type="text"
                className="pd-input"
                value={selectedRef}
                onChange={(e) => setSelectedRef(e.target.value)}
                placeholder="Ex: PD-35127, B9940C..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={handleResetFilters} className="btn btn-subtle">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>

            <button type="button" onClick={handleApplySizeSearch} className="btn btn-primary">
              <Filter className="w-4 h-4" />
              <span>Aplicar filtros</span>
            </button>
          </div>
        </div>
      )}

      {/* Categorias */}
      <div className="flex flex-wrap items-center gap-2 pt-5 mt-5 border-t pd-border">
        <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] pd-text-3 mr-1 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" aria-hidden="true" />
          Categorias
        </span>

        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id as ProductCategory | 'todos')}
            aria-pressed={activeCategory === cat.id}
            className={`pd-chip ${activeCategory === cat.id ? 'pd-chip-active' : ''}`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
};
