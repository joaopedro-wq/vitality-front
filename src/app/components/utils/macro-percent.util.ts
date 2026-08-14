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
