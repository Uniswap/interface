/**
 * Type guard to check if an object has a valid row with original data
 * Used in table cell renderers to safely access row.original during loading states
 */
export function hasRow<T>(obj: unknown): obj is { row: { original: T } } {
  const maybeRow = (obj as { row?: unknown }).row
  return typeof maybeRow === 'object' && maybeRow !== null && 'original' in maybeRow && maybeRow.original !== undefined
}
