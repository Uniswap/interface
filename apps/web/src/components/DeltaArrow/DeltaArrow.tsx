import { ArrowChange } from 'ui/src/components/icons/ArrowChange'

export { DEFAULT_DELTA_COLOR, getDeltaTextColor } from 'uniswap/src/utils/getDeltaTextColor'

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
    <ArrowChange aria-label="down" color={noColor ? '$neutral3' : '$statusCritical'} key="arrow-down" size={size} />
  ) : (
    <ArrowChange
      aria-label="up"
      color={isZero || noColor ? '$neutral3' : '$statusSuccess'}
      key="arrow-up"
      rotate="180deg"
      size={size}
    />
  )
}
