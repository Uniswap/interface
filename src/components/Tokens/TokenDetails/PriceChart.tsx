import { PricePoint } from 'graphql/data/util'
import { ArrowDownRight, ArrowUpRight } from 'react-feather'
import styled from 'styled-components/macro'

export function getPriceBounds(pricePoints: PricePoint[]): [number, number] {
  const prices = pricePoints.map((x) => x.value)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return [min, max]
}

const StyledUpArrow = styled(ArrowUpRight)`
  color: ${({ theme }) => theme.accentSuccess};
`
const StyledDownArrow = styled(ArrowDownRight)`
  color: ${({ theme }) => theme.accentFailure};
`

export function getDeltaArrow(delta: number | null | undefined, iconSize = 20) {
  // Null-check not including zero
  if (delta === null || delta === undefined) {
    return null
  } else if (Math.sign(delta) < 0) {
    return <StyledDownArrow size={iconSize} key="arrow-down" aria-label="down" />
  }
  return <StyledUpArrow size={iconSize} key="arrow-up" aria-label="up" />
}

export function formatDelta(delta: number | null | undefined) {
  // Null-check not including zero
  if (delta === null || delta === undefined || delta === Infinity || isNaN(delta)) {
    return '-'
  }
  const formattedDelta = Math.abs(delta).toFixed(2) + '%'
  return formattedDelta
}

export const DeltaText = styled.span<{ delta: number | undefined }>`
  color: ${({ theme, delta }) =>
    delta !== undefined ? (Math.sign(delta) < 0 ? theme.accentFailure : theme.accentSuccess) : theme.textPrimary};
`

export const ArrowCell = styled.div`
  padding-right: 3px;
  display: flex;
`
