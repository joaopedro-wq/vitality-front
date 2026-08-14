export interface MacroGramas {
  caloria: number;
  proteina: number;
  carbo: number;
  gordura: number;
}

export interface MacroPercentuais {
  proteina: number;
  carbo: number;
  gordura: number;
}

export function calcularPercentuaisMacro(valores: MacroGramas): MacroPercentuais {
  const totalCal = valores.caloria || 1;
  return {
    proteina: Math.min(100, Math.round(((valores.proteina * 4) / totalCal) * 100)),
    carbo: Math.min(100, Math.round(((valores.carbo * 4) / totalCal) * 100)),
    gordura: Math.min(100, Math.round(((valores.gordura * 9) / totalCal) * 100)),
  };
}

export function calcularProporcaoMacro(valores: Omit<MacroGramas, 'caloria'>): MacroPercentuais {
  const kcalProteina = valores.proteina * 4;
  const kcalCarbo = valores.carbo * 4;
  const kcalGordura = valores.gordura * 9;
  const total = kcalProteina + kcalCarbo + kcalGordura;

  if (total <= 0) return { proteina: 0, carbo: 0, gordura: 0 };

  return {
    proteina: (kcalProteina / total) * 100,
    carbo: (kcalCarbo / total) * 100,
    gordura: (kcalGordura / total) * 100,
  };
}
