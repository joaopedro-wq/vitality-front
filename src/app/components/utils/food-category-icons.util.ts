import {
  LucideBean,
  LucideBeef,
  LucideCandy,
  LucideCherry,
  LucideCupSoda,
  LucideDroplet,
  LucideMilk,
  LucideNut,
  LucidePackage,
  LucideSalad,
  LucideWheat,
  type LucideIcon,
} from '@lucide/angular';

/**
 * Ícone por categoria/grupo real do catálogo de alimentos — mesmo mapa usado
 * pelos chips de filtro rápido do Diário (`EntryComposerComponent`) e do
 * modo Manual de Dietas (`MealBuilderComponent`). Extraído daqui em vez de
 * duplicado nos dois lugares (ver CLAUDE.md, roadmap "Filtro de alimentos no
 * modo Manual" — 2ª feature a precisar do mesmo mapa).
 */
export const ICONE_POR_CATEGORIA: Record<string, LucideIcon> = {
  'carnes-e-aves': LucideBeef,
  'peixes-e-frutos-do-mar': LucideBeef,
  ovos: LucideMilk,
  'graos-cereais-e-massas': LucideWheat,
  'paes-e-preparacoes': LucideWheat,
  leguminosas: LucideBean,
  'verduras-e-legumes': LucideSalad,
  frutas: LucideCherry,
  'leites-e-derivados': LucideMilk,
  'oleaginosas-e-sementes': LucideNut,
  'oleos-e-gorduras': LucideDroplet,
  'doces-e-sobremesas': LucideCandy,
  bebidas: LucideCupSoda,
};

export const ICONE_CATEGORIA_PADRAO: LucideIcon = LucidePackage;
