import type { Declarations } from './css-parse'

/** Per-property difference between the two systems' normalized declarations. */
export type DeclarationDiff = Record<string, { tamagui?: string; tailwind?: string }>

/** Structured diff between two normalized declaration maps. */
export function diffDeclarations(tamagui: Declarations, tailwind: Declarations): DeclarationDiff {
  const diff: DeclarationDiff = {}
  for (const prop of new Set([...Object.keys(tamagui), ...Object.keys(tailwind)])) {
    if (tamagui[prop] !== tailwind[prop]) {
      diff[prop] = { tamagui: tamagui[prop], tailwind: tailwind[prop] }
    }
  }
  return diff
}
