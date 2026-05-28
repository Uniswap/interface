import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'
import { typographyClasses } from './types'

/** Custom color classes for tailwind-merge conflict resolution */
const colorClasses = [
  'foreground',
  'background',
  'neutral1',
  'neutral1-light',
  'neutral1-dark',
  'neutral2',
  'neutral2-light',
  'neutral2-dark',
  'neutral3',
  'neutral3-light',
  'neutral3-dark',
  'surface1',
  'surface1-light',
  'surface1-dark',
  'surface2',
  'surface2-light',
  'surface2-dark',
  'surface3',
  'surface3-light',
  'surface3-dark',
  'surface4',
  'surface4-light',
  'surface4-dark',
  'surface5',
  'surface5-light',
  'surface5-dark',
  'accent1',
  'accent1-light',
  'accent1-dark',
  'accent2',
  'accent2-light',
  'accent2-dark',
  'success',
  'warning',
  'critical',
  'destructive',
  'muted-foreground',
  'card-foreground',
  'popover-foreground',
  'primary-foreground',
  'secondary-foreground',
  'destructive-foreground',
] as const

/**
 * Extended tailwind-merge configuration for Mycelium classes.
 * - Typography: ensures cn('text-sm', 'text-body-1') correctly resolves to 'text-body-1'
 * - Colors: ensures cn('text-foreground', 'text-critical') correctly resolves to 'text-critical'
 */
const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [...typographyClasses],
      'text-color': colorClasses.map((c) => `text-${c}`),
    },
  },
})

/**
 * Merge class names with Tailwind CSS conflict resolution.
 *
 * @example
 * cn('text-sm', 'text-body-1') // => 'text-body-1'
 * cn('bg-red-500', isActive && 'bg-blue-500') // => 'bg-blue-500' if isActive
 * cn('p-4', className) // Merge with external className prop
 */
export function cn(...inputs: ClassValue[]): string {
  return customTwMerge(clsx(inputs))
}
