import React, { useCallback, useRef, useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Download,
  PlayCircle,
  Eye,
  RefreshCw,
  Info,
  PackageX,
  PackagePlus
} from 'lucide-react';

import {
  ErroImportacao,
  ProgressoImportacao,
  importarPlanilha,
  relatorioParaCsv,
  TAMANHO_MAXIMO_ARQUIVO
} from '../../services/planilhaImportService';
import {
  COLUNAS_PLANILHA,
  OpcoesImportacao,
  OPCOES_IMPORTACAO_PADRAO,
  ResultadoImportacao
} from '../../types/catalog';

interface ImportacaoPlanilhaProps {
  executadoPor: string;
  onConcluido: (resultado: ResultadoImportacao) => void;
}

const COLUNAS_EXIBIDAS: Array<{ coluna: string; uso: string }> = [
  { coluna: COLUNAS_PLANILHA.codigo, uso: 'Código exibido no painel e no site (identificador do produto)' },
  { coluna: COLUNAS_PLANILHA.descricao, uso: 'Descrição do produto' },
  { coluna: COLUNAS_PLANILHA.tipoProduto, uso: 'Gera as categorias do site' },
  { coluna: COLUNAS_PLANILHA.unidade, uso: 'Unidade de venda (UN, PR, JG, KT...)' },
  { coluna: COLUNAS_PLANILHA.quantidade, uso: 'Quantidade disponível — zerou, sai do site' },
  { coluna: COLUNAS_PLANILHA.valorReposicao, uso: 'Custo — visível só para a gerência' },
  { coluna: COLUNAS_PLANILHA.valorVenda, uso: 'Preço de venda exibido no site' }
];

export const ImportacaoPlanilha: React.FC<ImportacaoPlanilhaProps> = ({
  executadoPor,
  onConcluido
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [opcoes, setOpcoes] = useState<OpcoesImportacao>(OPCOES_IMPORTACAO_PADRAO);
  const [progresso, setProgresso] = useState<ProgressoImportacao | null>(null);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [executando, setExecutando] = useState(false);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);

  const selecionarArquivo = (arquivos: FileList | null) => {
    const escolhido = arquivos?.[0] || null;
    setErro(null);
    setResultado(null);

    if (escolhido && escolhido.size > TAMANHO_MAXIMO_ARQUIVO) {
      setErro(
        `Arquivo de ${(escolhido.size / 1024 / 1024).toFixed(1)} MB excede o limite de ${
          TAMANHO_MAXIMO_ARQUIVO / 1024 / 1024
        } MB.`
      );
      setArquivo(null);
      return;
    }
    setArquivo(escolhido);
  };

  const executar = useCallback(
    async (simulacao: boolean) => {
      if (!arquivo || executando) return;

      setExecutando(true);
      setErro(null);
      setResultado(null);
      setProgresso({ etapa: 'lendo', mensagem: 'Iniciando...', atual: 0, total: 1 });

      try {
        const saida = await importarPlanilha(arquivo, {
          executadoPor,
          opcoes: { ...opcoes, simulacao },
          aoProgredir: setProgresso
        });
        setResultado(saida);
        if (!simulacao) onConcluido(saida);
      } catch (falha) {
        const mensagem =
          falha instanceof ErroImportacao
            ? falha.message
            : `Falha inesperada na importação: ${(falha as Error).message}`;
        setErro(mensagem);
      } finally {
        setExecutando(false);
        setProgresso(null);
      }
    },
    [arquivo, executando, executadoPor, opcoes, onConcluido]
  );

  const baixarRelatorio = () => {
    if (!resultado) return;
    // BOM para o Excel abrir o CSV em UTF-8 sem quebrar os acentos.
    const blob = new Blob(['﻿' + relatorioParaCsv(resultado)], {
      type: 'text/csv;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `importacao-${resultado.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const percentual =
    progresso && progresso.total > 0 ? Math.round((progresso.atual / progresso.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-[#111111] rounded-xl border border-white/10 p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-sm font-black uppercase italic tracking-wider text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#8B0000]" />
              <span>Importação da Planilha do ERP</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl">
              A cada importação a planilha é lida por inteiro: produtos novos são criados,
              existentes são atualizados e{' '}
              <strong className="text-amber-400">
                todo item com quantidade zerada sai do site automaticamente
              </strong>
              . A ficha técnica preenchida no painel nunca é sobrescrita.
            </p>
          </div>
        </div>

        {/* Mapa de colunas */}
        <details className="group">
          <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-sky-400" />
            Colunas obrigatórias e para que servem
          </summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-black text-gray-400 uppercase text-[9px] tracking-wider">
                  <th className="p-2">Coluna na planilha</th>
                  <th className="p-2">Uso no sistema</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {COLUNAS_EXIBIDAS.map((item) => (
                  <tr key={item.coluna}>
                    <td className="p-2 font-mono text-amber-400 whitespace-nowrap">{item.coluna}</td>
                    <td className="p-2 text-gray-300">{item.uso}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        {/* Seletor de arquivo */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            selecionarArquivo(e.dataTransfer.files);
          }}
          className="border-2 border-dashed border-white/15 hover:border-[#8B0000]/60 rounded-xl p-6 text-center transition cursor-pointer bg-[#0A0A0A]"
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xlsm,.xls,.csv"
            className="hidden"
            onChange={(e) => selecionarArquivo(e.target.files)}
          />

          <Upload className="w-8 h-8 mx-auto text-[#8B0000] mb-2" />
          {arquivo ? (
            <div className="space-y-1">
              <p className="text-sm font-bold text-white break-all">{arquivo.name}</p>
              <p className="text-[11px] text-gray-400">
                {(arquivo.size / 1024).toFixed(0)} KB • clique para trocar o arquivo
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">
                Arraste a planilha aqui ou clique para selecionar
              </p>
              <p className="text-[11px] text-gray-400">
                Relatório RPR053 (Lista de Preço) em .xlsx, .xls ou .csv — até{' '}
                {TAMANHO_MAXIMO_ARQUIVO / 1024 / 1024} MB
              </p>
            </div>
          )}
        </div>

        {/* Opções */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="flex items-start gap-2.5 p-3 rounded bg-[#0A0A0A] border border-white/10 cursor-pointer hover:border-white/20 transition">
            <input
              type="checkbox"
              checked={opcoes.desativarAusentes}
              onChange={(e) => setOpcoes({ ...opcoes, desativarAusentes: e.target.checked })}
              className="mt-0.5 accent-[#8B0000]"
            />
            <span>
              <strong className="text-white block">Desativar produtos ausentes</strong>
              <span className="text-gray-400 text-[11px]">
                Itens que existem no banco mas não vieram nesta planilha saem do site.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-2.5 p-3 rounded bg-[#0A0A0A] border border-white/10 cursor-pointer hover:border-white/20 transition">
            <input
              type="checkbox"
              checked={opcoes.sobrescreverDescricao}
              onChange={(e) => setOpcoes({ ...opcoes, sobrescreverDescricao: e.target.checked })}
              className="mt-0.5 accent-[#8B0000]"
            />
            <span>
              <strong className="text-white block">Atualizar descrição pelo ERP</strong>
              <span className="text-gray-400 text-[11px]">
                Desmarque para preservar descrições reescritas manualmente no painel.
              </span>
            </span>
          </label>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => executar(true)}
            disabled={!arquivo || executando}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded bg-[#1a1a1a] hover:bg-zinc-800 border border-white/10 text-white text-xs font-black uppercase tracking-widest transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Eye className="w-4 h-4 text-sky-400" />
            <span>Simular (não grava nada)</span>
          </button>

          <button
            onClick={() => executar(false)}
            disabled={!arquivo || executando}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded bg-[#8B0000] hover:bg-red-800 text-white text-xs font-black uppercase tracking-widest transition shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {executando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <PlayCircle className="w-4 h-4" />
            )}
            <span>{executando ? 'Importando...' : 'Importar e atualizar catálogo'}</span>
          </button>
        </div>

        {/* Progresso */}
        {progresso && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-gray-300">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#8B0000]" />
                {progresso.mensagem}
              </span>
              <span className="font-mono">{percentual}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
              <div
                className="h-full bg-[#8B0000] transition-all duration-300"
                style={{ width: `${percentual}%` }}
              />
            </div>
          </div>
        )}

        {/* Erro */}
        {erro && (
          <div className="p-4 rounded bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-start gap-2.5">
            <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <div>
              <strong className="block text-red-300 uppercase text-[10px] tracking-widest mb-1">
                Importação não realizada
              </strong>
              <span>{erro}</span>
            </div>
          </div>
        )}
      </div>

      {/* Resultado */}
      {resultado && (
        <div className="bg-[#111111] rounded-xl border border-white/10 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <h4 className="text-sm font-black uppercase italic text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                {resultado.concluidoEm && resultado.linhas.length > 0 && !resultado.erros.length
                  ? 'Importação concluída'
                  : 'Resultado da importação'}
              </span>
              <span className="text-[10px] font-mono text-gray-500 normal-case not-italic">
                {resultado.arquivo}
              </span>
            </h4>

            <button
              onClick={baixarRelatorio}
              className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#1a1a1a] border border-white/10 text-gray-300 hover:text-white text-[10px] font-bold uppercase tracking-widest transition"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar relatório CSV
            </button>
          </div>

          {/* Indicadores */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { rotulo: 'Linhas lidas', valor: resultado.totalLinhas, cor: 'text-white' },
              { rotulo: 'Criados', valor: resultado.criados, cor: 'text-sky-400' },
              { rotulo: 'Atualizados', valor: resultado.atualizados, cor: 'text-amber-400' },
              { rotulo: 'Reativados', valor: resultado.reativados, cor: 'text-emerald-400' },
              { rotulo: 'Desativados', valor: resultado.desativados, cor: 'text-red-400' },
              { rotulo: 'Sem alteração', valor: resultado.inalterados, cor: 'text-gray-400' }
            ].map((item) => (
              <div key={item.rotulo} className="bg-[#0A0A0A] p-3 rounded border border-white/10">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 block">
                  {item.rotulo}
                </span>
                <span className={`text-lg font-black italic ${item.cor}`}>{item.valor}</span>
              </div>
            ))}
          </div>

          {/* Categorias criadas */}
          {resultado.categoriasCriadas.length > 0 && (
            <div className="p-4 rounded bg-sky-950/30 border border-sky-800/50 text-xs space-y-2">
              <strong className="text-sky-300 uppercase text-[10px] tracking-widest flex items-center gap-2">
                <PackagePlus className="w-3.5 h-3.5" />
                {resultado.categoriasCriadas.length} categoria(s) criada(s) no banco
              </strong>
              <div className="flex flex-wrap gap-1.5">
                {resultado.categoriasCriadas.map((c) => (
                  <span
                    key={c}
                    className="px-2 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-200 text-[10px] font-bold"
                  >
                    {c}
                  </span>
                ))}
              </div>
              <p className="text-sky-200/70 text-[11px]">
                Cada categoria já nasce com o formulário de ficha técnica correspondente
                (furação, marcas atendidas, tipo de pneu, garantia...). Revise em
                “Categorias &amp; Ficha Técnica”.
              </p>
            </div>
          )}

          {/* Ausentes */}
          {resultado.ausentesNaPlanilha.length > 0 && (
            <div className="p-4 rounded bg-amber-950/30 border border-amber-800/50 text-xs space-y-1">
              <strong className="text-amber-300 uppercase text-[10px] tracking-widest flex items-center gap-2">
                <PackageX className="w-3.5 h-3.5" />
                {resultado.ausentesNaPlanilha.length} produto(s) não constam nesta planilha
              </strong>
              <p className="text-amber-200/80">
                {opcoes.desativarAusentes
                  ? 'Foram desativados do site para não vender item que saiu da lista.'
                  : 'Permanecem como estão — a opção de desativar ausentes está desligada.'}
              </p>
              <p className="font-mono text-amber-200/60 text-[10px] break-all">
                {resultado.ausentesNaPlanilha.slice(0, 40).join(', ')}
                {resultado.ausentesNaPlanilha.length > 40 && ` … +${resultado.ausentesNaPlanilha.length - 40}`}
              </p>
            </div>
          )}

          {/* Avisos */}
          {resultado.erros.length > 0 && (
            <div className="p-4 rounded bg-amber-950/30 border border-amber-800/50 text-xs space-y-1 max-h-52 overflow-y-auto">
              <strong className="text-amber-300 uppercase text-[10px] tracking-widest flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                {resultado.erros.length} aviso(s) de leitura
              </strong>
              <ul className="space-y-0.5 text-amber-200/80 list-disc pl-4">
                {resultado.erros.slice(0, 60).map((mensagem, i) => (
                  <li key={i}>{mensagem}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Detalhamento */}
          <div>
            <button
              onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
              className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition"
            >
              {mostrarDetalhes ? '▾ Ocultar' : '▸ Ver'} detalhamento linha a linha (
              {resultado.linhas.length})
            </button>

            {mostrarDetalhes && (
              <div className="mt-3 overflow-x-auto max-h-96 overflow-y-auto rounded border border-white/10">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="sticky top-0">
                    <tr className="bg-black text-gray-400 uppercase text-[9px] tracking-wider">
                      <th className="p-2">Código</th>
                      <th className="p-2">Descrição</th>
                      <th className="p-2">Ação</th>
                      <th className="p-2 text-right">Estoque</th>
                      <th className="p-2 text-right">Valor venda</th>
                      <th className="p-2">Observação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {resultado.linhas.slice(0, 400).map((linha, i) => (
                      <tr key={`${linha.codigo}-${i}`} className="hover:bg-[#1a1a1a]">
                        <td className="p-2 font-mono text-gray-300">{linha.codigo}</td>
                        <td className="p-2 text-white max-w-[240px] truncate">{linha.descricao}</td>
                        <td className="p-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              {
                                criado: 'bg-sky-950 text-sky-300 border border-sky-800',
                                atualizado: 'bg-amber-950 text-amber-300 border border-amber-800',
                                reativado: 'bg-emerald-950 text-emerald-300 border border-emerald-800',
                                desativado: 'bg-red-950 text-red-300 border border-red-800',
                                inalterado: 'bg-zinc-900 text-gray-400 border border-white/10',
                                rejeitado: 'bg-red-950 text-red-300 border border-red-800'
                              }[linha.acao]
                            }`}
                          >
                            {linha.acao}
                          </span>
                        </td>
                        <td className="p-2 text-right font-mono text-gray-300">
                          {linha.quantidadeAnterior !== undefined &&
                          linha.quantidadeAnterior !== linha.quantidadeNova ? (
                            <>
                              <span className="text-gray-500 line-through mr-1">
                                {linha.quantidadeAnterior}
                              </span>
                              <span className="text-white font-bold">{linha.quantidadeNova}</span>
                            </>
                          ) : (
                            linha.quantidadeNova ?? '—'
                          )}
                        </td>
                        <td className="p-2 text-right font-mono text-emerald-400">
                          {linha.valorVendaNovo !== undefined
                            ? linha.valorVendaNovo.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              })
                            : '—'}
                        </td>
                        <td className="p-2 text-gray-400 max-w-[280px]">{linha.detalhe || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
