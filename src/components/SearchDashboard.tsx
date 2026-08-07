import React, { useState } from 'react';
import { Ruler, SlidersHorizontal, RefreshCw, Filter, Layers } from 'lucide-react';
import { ARO_OPTIONS, FURACAO_OPTIONS } from '../data/mockProducts';
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
  { id: 'acessorios', label: 'Acessórios' },
  { id: 'promocao', label: '🔥 Promoção' }
] as const;

export const SearchDashboard: React.FC<SearchDashboardProps> = ({
  onApplyVehicleFilter,
  onApplySizeFilter,
  activeCategory,
  onSelectCategory
}) => {
  const [selectedAro, setSelectedAro] = useState<string>('');
  const [selectedFuracao, setSelectedFuracao] = useState<string>('');
  const [selectedTireType, setSelectedTireType] = useState<string>('');
  const [medidaPneu, setMedidaPneu] = useState<string>('');

  const handleApplySizeSearch = () => {
    onApplySizeFilter({
      category: activeCategory,
      aro: selectedAro,
      furacao: selectedFuracao,
      medidaPneu: medidaPneu.trim(),
      tipoPneu: selectedTireType,
      referencia: ''
    });
  };

  const handleResetFilters = () => {
    setSelectedAro('');
    setSelectedFuracao('');
    setSelectedTireType('');
    setMedidaPneu('');
    onApplyVehicleFilter(null);
    onApplySizeFilter(null);
    onSelectCategory('todos');
  };

  return (
    <div className="pd-card p-5 sm:p-7">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-5 border-b pd-border">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] pd-brand-text flex items-center gap-2 mb-1.5">
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
            <span>Busca por medida</span>
          </h2>
          <p className="text-xs pd-text-3 leading-relaxed">
            Filtre por aro, furação, tipo de pneu ou digite a medida exata — ex:{' '}
            <code className="pd-brand-text font-semibold">175/70R14</code>
          </p>
        </div>
        <div className="flex items-center gap-1.5 pd-surface-2 border pd-border rounded-xl px-3 py-2">
          <Ruler className="w-4 h-4 pd-brand-text shrink-0" />
          <span className="text-xs font-bold uppercase tracking-widest pd-brand-text">Por Medida</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="pt-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Medida do pneu */}
          <div>
            <label className="pd-label" htmlFor="filtro-medida-pneu">
              Medida do pneu
            </label>
            <input
              id="filtro-medida-pneu"
              type="text"
              className="pd-input"
              value={medidaPneu}
              onChange={(e) => setMedidaPneu(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleApplySizeSearch(); }}
              placeholder="Ex: 175/70R14, 265/70R17..."
            />
          </div>

          {/* Aro */}
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

          {/* Furação */}
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

          {/* Tipo de pneu */}
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
