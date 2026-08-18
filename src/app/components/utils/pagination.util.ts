export function criarItensPaginacao(
  paginaAtual: number,
  totalPaginas: number,
): Array<number | 'ellipsis'> {
  if (totalPaginas <= 7) return Array.from({ length: totalPaginas }, (_, index) => index + 1);

  const paginas = new Set([1, totalPaginas]);
  for (
    let pagina = Math.max(2, paginaAtual - 1);
    pagina <= Math.min(totalPaginas - 1, paginaAtual + 1);
    pagina++
  ) {
    paginas.add(pagina);
  }

  const itens: Array<number | 'ellipsis'> = [];
  for (const pagina of [...paginas].sort((a, b) => a - b)) {
    const anterior = itens.at(-1);
    if (typeof anterior === 'number' && pagina - anterior > 1) itens.push('ellipsis');
    itens.push(pagina);
  }
  return itens;
}
