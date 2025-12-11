import { ArrowChangeDown } from 'components/Icons/ArrowChangeDown'
import { ArrowChangeUp } from 'components/Icons/ArrowChangeUp'
import { deprecatedStyled } from 'lib/styled-components'
import { colorsDark, colorsLight } from 'ui/src/theme'

const StyledUpArrow = deprecatedStyled(ArrowChangeUp)<{ $noColor?: boolean }>`
  color: ${({ theme, $noColor }) =>
    $noColor ? theme.neutral3 : theme.darkMode ? colorsDark.statusSuccess : colorsLight.statusSuccess};
`
const StyledDownArrow = deprecatedStyled(ArrowChangeDown)<{ $noColor?: boolean }>`
  color: ${({ theme, $noColor }) =>
    $noColor ? theme.neutral3 : theme.darkMode ? colorsDark.statusCritical : colorsLight.statusCritical};
`

export function calculateDelta(start: number, current: number): number | undefined {
  const delta = (current / start - 1) * 100
  return isValidDelta(delta) ? delta : undefined
}

function isValidDelta(delta: number | null | undefined): delta is number {
  // Null-check not including zero
  return delta !== null && delta !== undefined && delta !== Infinity && !isNaN(delta)
}

function isDeltaZero(delta: string): boolean {
  return parseFloat(delta) === 0
}

interface DeltaArrowProps {
  delta?: number | null
  formattedDelta: string
  noColor?: boolean
  size?: number
}

export function DeltaArrow({ delta, formattedDelta, noColor = false, size = 16 }: DeltaArrowProps) {
  if (!isValidDelta(delta)) {
    return null
  }

  const isZero = isDeltaZero(formattedDelta)

  return Math.sign(delta) < 0 && !isZero ? (
    <StyledDownArrow width={size} height={size} key="arrow-down" aria-label="down" $noColor={noColor} />
  ) : (
    <StyledUpArrow width={size} height={size} key="arrow-up" aria-label="up" $noColor={isZero || noColor} />
  )
}

export const DeltaText = deprecatedStyled.span<{ delta?: number }>`
  color: ${({ theme, delta }) => {
    if (delta === undefined || delta === 0) {
      return theme.neutral3
    }

    const isNegative = Math.sign(delta) < 0
    const colors = theme.darkMode ? colorsDark : colorsLight

    return isNegative ? colors.statusCritical : colors.statusSuccess
  }};
`
