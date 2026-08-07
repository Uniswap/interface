import type { FlexProps } from 'ui/src'

export function useRowProps(): FlexProps {
  return { row: true, gap: '$spacing8' }
}
