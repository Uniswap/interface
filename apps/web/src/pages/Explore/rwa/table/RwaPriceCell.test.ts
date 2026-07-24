import { formatRwaPriceDeviationLabel } from '~/pages/Explore/rwa/table/RwaPriceCell'

describe('formatRwaPriceDeviationLabel', () => {
  const formatPercent = (value: number | undefined): string => {
    if (value === undefined) {
      return '-'
    }
    return `${value.toFixed(1)}%`
  }

  it('formats deviation with a plus-minus prefix', () => {
    expect(formatRwaPriceDeviationLabel(0.1, formatPercent)).toBe('± 0.1%')
  })
})
