/**
 * Regras de precificação e desconto.
 *
 * Política da diretoria: desconto à vista é limitado a 8%. O teto é aplicado por
 * `clamp` — nunca por validação de formulário, que qualquer um contorna pelo DevTools.
 * A mesma função é usada no frontend (simulação) e na Cloud Function que emite a
 * proposta oficial, então cliente e servidor chegam sempre ao mesmo número.
 */

import { DESCONTO_MAXIMO_AVISTA, SimulacaoDesconto } from '../types/catalog';

export { DESCONTO_MAXIMO_AVISTA };

/** Arredonda para 2 casas sem o erro de ponto flutuante do toFixed encadeado. */
export function arredondar(valor: number, casas = 2): number {
  if (!Number.isFinite(valor)) return 0;
  const fator = 10 ** casas;
  return Math.round((valor + Number.EPSILON) * fator) / fator;
}

/** Converte "1.234,56", "1234.56", 1234.56 ou null em número seguro (>= 0 opcional). */
export function paraNumero(valor: unknown, minimo = -Infinity): number {
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? Math.max(valor, minimo) : 0;
  }
  if (typeof valor !== 'string') return 0;

  const limpo = valor.trim().replace(/[R$\s]/g, '');
  if (!limpo) return 0;

  // "1.234,56" (pt-BR) vs "1234.56" (en-US)
  const normalizado =
    limpo.includes(',') && limpo.lastIndexOf(',') > limpo.lastIndexOf('.')
      ? limpo.replace(/\./g, '').replace(',', '.')
      : limpo.replace(/,/g, '');

  const numero = Number.parseFloat(normalizado);
  return Number.isFinite(numero) ? Math.max(numero, minimo) : 0;
}

export const formatarBRL = (valor: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number.isFinite(valor) ? valor : 0
  );

/**
 * Simula desconto à vista com teto rígido de 8%.
 *
 * @param valorVenda        ValorVenda da planilha (preço público)
 * @param percentualPedido  percentual solicitado pelo vendedor
 * @param valorReposicao    ValorReposicao — só informe para gerência; controla o
 *                          cálculo de margem e o alerta de venda abaixo do custo
 */
export function simularDescontoAvista(
  valorVenda: number,
  percentualPedido: number,
  valorReposicao?: number
): SimulacaoDesconto {
  const preco = Math.max(paraNumero(valorVenda), 0);
  const pedido = Math.max(paraNumero(percentualPedido), 0);

  // Teto inegociável. Vale para qualquer entrada, inclusive NaN/Infinity/negativo.
  const aplicado = arredondar(Math.min(pedido, DESCONTO_MAXIMO_AVISTA), 2);

  const valorDesconto = arredondar((preco * aplicado) / 100);
  const valorFinal = arredondar(Math.max(preco - valorDesconto, 0));

  const simulacao: SimulacaoDesconto = {
    valorVenda: preco,
    percentualSolicitado: arredondar(pedido, 2),
    percentualAplicado: aplicado,
    limitadoPeloTeto: pedido > DESCONTO_MAXIMO_AVISTA,
    valorDesconto,
    valorFinal
  };

  if (typeof valorReposicao === 'number' && Number.isFinite(valorReposicao) && valorReposicao > 0) {
    const custo = arredondar(valorReposicao);
    const margem = arredondar(valorFinal - custo);
    simulacao.valorReposicao = custo;
    simulacao.margemBruta = margem;
    simulacao.margemPercentual = valorFinal > 0 ? arredondar((margem / valorFinal) * 100) : 0;
    simulacao.abaixoDoCusto = margem < 0;
  }

  return simulacao;
}

/** Maior desconto permitido sem que o valor final fique abaixo do custo (teto de 8% incluso). */
export function descontoMaximoSeguro(valorVenda: number, valorReposicao: number): number {
  const preco = paraNumero(valorVenda);
  const custo = paraNumero(valorReposicao);
  if (preco <= 0 || custo <= 0) return DESCONTO_MAXIMO_AVISTA;
  const percentualNoCusto = ((preco - custo) / preco) * 100;
  return arredondar(Math.max(0, Math.min(DESCONTO_MAXIMO_AVISTA, percentualNoCusto)), 2);
}

/** Markup sobre o custo — indicador de gerência. */
export function calcularMarkup(valorVenda: number, valorReposicao: number): number {
  const preco = paraNumero(valorVenda);
  const custo = paraNumero(valorReposicao);
  if (custo <= 0) return 0;
  return arredondar(((preco - custo) / custo) * 100);
}

/** Margem bruta percentual sobre o preço de venda. */
export function calcularMargem(valorVenda: number, valorReposicao: number): number {
  const preco = paraNumero(valorVenda);
  const custo = paraNumero(valorReposicao);
  if (preco <= 0) return 0;
  return arredondar(((preco - custo) / preco) * 100);
}

/** Valor à vista com o desconto máximo permitido — usado no selo "à vista" do site. */
export function precoAvista(valorVenda: number): number {
  return simularDescontoAvista(valorVenda, DESCONTO_MAXIMO_AVISTA).valorFinal;
}

/** Parcelamento sem juros exibido no card. */
export function parcelamento(valorVenda: number, parcelas = 10, parcelaMinima = 100) {
  const preco = paraNumero(valorVenda);
  const maximo = Math.max(1, Math.floor(preco / parcelaMinima));
  const vezes = Math.max(1, Math.min(parcelas, maximo));
  return { vezes, valorParcela: arredondar(preco / vezes) };
}
