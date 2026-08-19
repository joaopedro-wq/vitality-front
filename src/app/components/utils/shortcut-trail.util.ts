import { curva, type PontoTrilha, type TrilhaSerpentina } from './journey-path.util';

const MARGEM_ANEL = 36;

function paraPercentual(pontos: PontoTrilha[], largura: number, altura: number): PontoTrilha[] {
  return pontos.map((p) => ({ x: (p.x / largura) * 100, y: (p.y / altura) * 100 }));
}

function encurtar(
  origem: PontoTrilha,
  destino: PontoTrilha,
  margem: number,
): [PontoTrilha, PontoTrilha] {
  const dx = destino.x - origem.x;
  const dy = destino.y - origem.y;
  const distancia = Math.hypot(dx, dy) || 1;
  const ux = dx / distancia;
  const uy = dy / distancia;

  return [
    { x: origem.x + ux * margem, y: origem.y + uy * margem },
    { x: destino.x - ux * margem, y: destino.y - uy * margem },
  ];
}

function segmentosEncurtados(pontos: PontoTrilha[], margem: number): string[] {
  return pontos.slice(0, -1).map((ponto, i) => {
    const [a, b] = encurtar(ponto, pontos[i + 1], margem);
    return curva(a, b);
  });
}

export const TRILHA_ATALHOS_GRADE: TrilhaSerpentina = (() => {
  const largura = 300;
  const altura = 300;
  const pontos: PontoTrilha[] = [
    { x: 75, y: 58 },
    { x: 225, y: 58 },
    { x: 75, y: 242 },
    { x: 225, y: 242 },
  ];

  return {
    viewBox: `0 0 ${largura} ${altura}`,
    proporcao: `${largura} / ${altura}`,
    nodes: paraPercentual(pontos, largura, altura),
    segmentos: segmentosEncurtados(pontos, MARGEM_ANEL),
  };
})();

/** ≥ md: fileira única, 4 nós igualmente espaçados. */
export const TRILHA_ATALHOS_LINHA: TrilhaSerpentina = (() => {
  const largura = 1000;
  const altura = 140;
  const pontos: PontoTrilha[] = [
    { x: 125, y: 42 },
    { x: 375, y: 42 },
    { x: 625, y: 42 },
    { x: 875, y: 42 },
  ];

  return {
    viewBox: `0 0 ${largura} ${altura}`,
    proporcao: `${largura} / ${altura}`,
    nodes: paraPercentual(pontos, largura, altura),
    segmentos: segmentosEncurtados(pontos, MARGEM_ANEL),
  };
})();
