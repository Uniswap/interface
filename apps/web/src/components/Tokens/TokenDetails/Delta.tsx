import { ArrowChangeDown } from 'components/Icons/ArrowChangeDown'
import { ArrowChangeUp } from 'components/Icons/ArrowChangeUp'
import styled from 'lib/styled-components'
import { colorsDark, colorsLight } from 'ui/src/theme'

const StyledUpArrow = styled(ArrowChangeUp)<{ $noColor?: boolean }>`
  color: ${({ theme, $noColor }) =>
    $noColor ? theme.neutral2 : theme.darkMode ? colorsDark.statusSuccess : colorsLight.statusSuccess};
`
const StyledDownArrow = styled(ArrowChangeDown)<{ $noColor?: boolean }>`
  color: ${({ theme, $noColor }) =>
    $noColor ? theme.neutral2 : theme.darkMode ? colorsDark.statusCritical : colorsLight.statusCritical};
`

export function calculateDelta(start: number, current: number) {
  return (current / start - 1) * 100
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
    <StyledUpArrow width={size} height={size} key="arrow-up" aria-label="up" $noColor={noColor} />
  )
}

export const DeltaText = styled.span<{ delta?: number }>`
  color: ${({ theme, delta }) =>
    delta !== undefined
      ? Math.sign(delta) < 0
        ? theme.darkMode
          ? colorsDark.statusCritical
          : colorsLight.statusCritical
        : theme.darkMode
          ? colorsDark.statusSuccess
          : colorsLight.statusSuccess
      : theme.neutral1};
`
