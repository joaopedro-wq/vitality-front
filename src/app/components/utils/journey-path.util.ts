export interface PontoTrilha {
  x: number;
  y: number;
}

export interface TrilhaSerpentina {
  viewBox: string;
  proporcao: string;
  nodes: PontoTrilha[];
  segmentos: string[];
}

const LARGURA = 320;
const TOPO = 55;
const PASSO = 100;
const RABO = 115;

const CINCO_FASES: TrilhaSerpentina = {
  viewBox: '0 0 320 580',
  proporcao: '320 / 580',
  nodes: [
    { x: 25, y: 9.5 },
    { x: 71.9, y: 25 },
    { x: 21.9, y: 42.2 },
    { x: 75, y: 59.5 },
    { x: 37.5, y: 80.2 },
  ],
  segmentos: [
    'M80 55C140 90 200 100 230 145',
    'M230 145C265 200 110 190 70 245',
    'M70 245C30 305 230 285 240 345',
    'M240 345C250 410 140 400 120 465',
    'M120 465C112 500 140 515 160 528',
  ],
};

export function curva(origem: PontoTrilha, destino: PontoTrilha): string {
  const alcance = (destino.y - origem.y) * 0.55;
  return (
    `M${origem.x} ${origem.y}` +
    `C${origem.x} ${origem.y + alcance},` +
    `${destino.x} ${destino.y - alcance},` +
    `${destino.x} ${destino.y}`
  );
}

export function trilhaSerpentina(n: number): TrilhaSerpentina {
  if (n <= 0) {
    return {
      viewBox: `0 0 ${LARGURA} 200`,
      proporcao: `${LARGURA} / 200`,
      nodes: [],
      segmentos: [],
    };
  }
  if (n === 5) return CINCO_FASES;

  const altura = TOPO + (n - 1) * PASSO + RABO;
  const pontos: PontoTrilha[] = Array.from({ length: n }, (_, i) => ({
    x: i % 2 === 0 ? 78 : 236,
    y: TOPO + i * PASSO,
  }));
  const bandeira: PontoTrilha = { x: LARGURA / 2, y: altura - 52 };

  const segmentos = pontos.map((ponto, i) => curva(ponto, i === n - 1 ? bandeira : pontos[i + 1]));

  return {
    viewBox: `0 0 ${LARGURA} ${altura}`,
    proporcao: `${LARGURA} / ${altura}`,
    nodes: pontos.map((ponto) => ({
      x: (ponto.x / LARGURA) * 100,
      y: (ponto.y / altura) * 100,
    })),
    segmentos,
  };
}
