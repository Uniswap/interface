import { CSSProperties } from 'react'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'

export function useScrollbarStyles(): CSSProperties {
  const colors = useSporeColors()
  return {
    '&::WebkitScrollbar': {
      backgroundColor: 'transparent',
    },
    '&::WebkitScrollbarThumb': {
      backgroundColor: colors.surface3.val,
      borderRadius: '8px',
    },
    scrollbarWidth: 'thin',
    scrollbarColor: `${colors.surface3.val} transparent`,
  } as CSSProperties
}
