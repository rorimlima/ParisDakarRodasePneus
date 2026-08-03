import React, { useState } from 'react';
import { Vendedor } from '../../types';
import { storageService } from '../../services/storageService';
import { PhoneCall, UserPlus, Trash2, CheckCircle2, XCircle, Upload, Image, User, Phone, Mail, Award, Shield } from 'lucide-react';

interface GestaoVendedoresProps {
  onAviso: (msg: string) => void;
}

export const GestaoVendedores: React.FC<GestaoVendedoresProps> = ({ onAviso }) => {
  const [vendedores, setVendedores] = useState<Vendedor[]>(() => storageService.getVendedores());
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    email: '',
    cargo: '',
    fotoUrl: '',
    ativo: true
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem é muito grande. Escolha uma imagem de até 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setForm((prev) => ({ ...prev, fotoUrl: event.target!.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.telefone) {
      alert('Por favor, preencha o Nome e o WhatsApp do vendedor.');
      return;
    }

    const updatedList = storageService.saveVendedor({
      id: editingId || undefined,
      nome: form.nome,
      telefone: form.telefone,
      email: form.email,
      cargo: form.cargo || 'Consultor Técnico 4x4',
      fotoUrl: form.fotoUrl,
      ativo: form.ativo
    });

    setVendedores(updatedList);
    setForm({ nome: '', telefone: '', email: '', cargo: '', fotoUrl: '', ativo: true });
    setEditingId(null);
    onAviso(editingId ? 'Vendedor atualizado com sucesso!' : 'Novo vendedor cadastrado com sucesso!');
  };

  const handleEdit = (v: Vendedor) => {
    setEditingId(v.id);
    setForm({
      nome: v.nome,
      telefone: v.telefone,
      email: v.email || '',
      cargo: v.cargo || '',
      fotoUrl: v.fotoUrl || '',
      ativo: v.ativo
    });
  };

  const handleDelete = (id: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja remover o vendedor ${nome}?`)) {
      const updated = storageService.deleteVendedor(id);
      setVendedores(updated);
      onAviso('Vendedor removido.');
    }
  };

  const handleToggleStatus = (id: string) => {
    const updated = storageService.toggleVendedorStatus(id);
    setVendedores(updated);
    onAviso('Status do vendedor alterado!');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ nome: '', telefone: '', email: '', cargo: '', fotoUrl: '', ativo: true });
  };

  return (
    <div className="space-y-6">
      
      {/* Form Container */}
      <div className="bg-[#111114] p-6 rounded-xl border border-white/10 space-y-4 max-w-4xl mx-auto">
        <div className="border-b border-white/10 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black uppercase italic tracking-wider text-white flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-[#8B0000]" />
              <span>{editingId ? 'Editar Cadastro de Vendedor' : 'Cadastrar Novo Vendedor / Logo'}</span>
            </h2>
            <p className="text-xs text-gray-400">
              Cadastre os vendedores da equipe de atendimento WhatsApp com a foto do vendedor ou a logo da loja.
            </p>
          </div>

          {editingId && (
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-bold uppercase"
            >
              Cancelar Edição
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                Nome do Vendedor / Atendente *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo (Especialista Hilux)"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded bg-[#1a1a1e] border border-white/10 text-white focus:outline-none focus:border-[#8B0000]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                WhatsApp com DDD * (Apenas números)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-emerald-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ex: 5511999998888"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded bg-[#1a1a1e] border border-white/10 text-white focus:outline-none focus:border-[#8B0000]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                Cargo / Especialidade
              </label>
              <div className="relative">
                <Award className="w-4 h-4 text-amber-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Ex: Especialista em Pneus Off-Road & Rodas Forjadas"
                  value={form.cargo}
                  onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded bg-[#1a1a1e] border border-white/10 text-white focus:outline-none focus:border-[#8B0000]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                E-mail Comercial (Opcional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-sky-400 absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="vendas@parisdakarrodas.com.br"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded bg-[#1a1a1e] border border-white/10 text-white focus:outline-none focus:border-[#8B0000]"
                />
              </div>
            </div>
          </div>

          {/* Upload Foto do Vendedor ou Logo */}
          <div className="p-4 rounded-xl bg-[#18181c] border border-white/10 space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block flex items-center gap-1.5">
              <Image className="w-4 h-4 text-amber-500" />
              <span>Foto do Vendedor ou Logo do Atendimento</span>
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              
              {/* Thumbnail Preview */}
              <div className="w-16 h-16 rounded-full bg-zinc-900 border-2 border-dashed border-white/20 overflow-hidden flex items-center justify-center shrink-0 relative">
                {form.fotoUrl ? (
                  <img src={form.fotoUrl} alt="Vendedor" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-zinc-600" />
                )}
              </div>

              {/* Upload Action */}
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <p className="text-[11px] text-zinc-400">
                  Selecione uma foto de perfil do vendedor ou a logo da loja a partir do seu <strong>computador ou celular</strong>.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#8B0000] hover:bg-red-800 text-white rounded text-xs font-bold uppercase tracking-wider transition">
                    <Upload className="w-4 h-4" />
                    <span>Escolher Imagem do Dispositivo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {form.fotoUrl && (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, fotoUrl: '' }))}
                      className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-red-400 rounded text-xs font-bold uppercase"
                    >
                      Remover Imagem
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 font-medium">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                className="w-4 h-4 accent-[#8B0000] rounded"
              />
              <span>Vendedor Ativo para Atendimento ao Cliente</span>
            </label>

            <button
              type="submit"
              className="bg-gradient-to-r from-[#8B0000] to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-2.5 rounded font-black text-xs uppercase tracking-widest transition flex items-center gap-2 shadow-lg"
            >
              <UserPlus className="w-4 h-4" />
              <span>{editingId ? 'Salvar Alterações' : 'Cadastrar Vendedor'}</span>
            </button>
          </div>

        </form>
      </div>

      {/* List of Registered Vendors */}
      <div className="bg-[#111114] p-6 rounded-xl border border-white/10 space-y-4 max-w-4xl mx-auto">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
          <span>Vendedores Cadastrados ({vendedores.length})</span>
          <span className="text-[10px] text-zinc-500 font-normal">Equipe comercial ativa no site</span>
        </h3>

        {vendedores.length === 0 ? (
          <div className="text-center py-8 text-xs text-zinc-500">
            Nenhum vendedor cadastrado. Utilize o formulário acima para cadastrar a equipe.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendedores.map((v) => (
              <div
                key={v.id}
                className={`p-4 rounded-xl border flex items-start gap-3 transition ${
                  v.ativo
                    ? 'bg-[#18181c] border-white/10 hover:border-red-900/50'
                    : 'bg-[#121215] border-white/5 opacity-60'
                }`}
              >
                {/* Photo / Avatar */}
                <div className="w-14 h-14 rounded-full bg-zinc-900 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                  {v.fotoUrl ? (
                    <img src={v.fotoUrl} alt={v.nome} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-zinc-600" />
                  )}
                </div>

                {/* Vendor Specs */}
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white truncate">{v.nome}</h4>
                    <button
                      onClick={() => handleToggleStatus(v.id)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        v.ativo ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' : 'bg-red-950 text-red-400 border border-red-800/40'
                      }`}
                    >
                      {v.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>

                  <p className="text-[11px] text-amber-400 font-medium truncate">{v.cargo || 'Consultor Técnico'}</p>
                  
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 pt-0.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="font-mono">{v.telefone}</span>
                  </div>

                  {v.email && (
                    <div className="text-[10px] text-zinc-500 truncate">{v.email}</div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleEdit(v)}
                      className="text-[11px] text-sky-400 hover:underline font-bold"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(v.id, v.nome)}
                      className="text-[11px] text-red-400 hover:underline font-bold"
                    >
                      Excluir
                    </button>
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
