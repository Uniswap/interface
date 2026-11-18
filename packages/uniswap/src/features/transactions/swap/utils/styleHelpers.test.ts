import {
  getSlippageWarningColor,
  getSlippageWarningLevel,
} from 'uniswap/src/features/transactions/swap/utils/styleHelpers'

const CASES: { customSlippageValue: number; autoSlippageTolerance: number; warnLowSlippage?: boolean }[] = [
  { customSlippageValue: 0, autoSlippageTolerance: 0.5 },
  { customSlippageValue: 0.5, autoSlippageTolerance: 0.5 },
  { customSlippageValue: 0.6, autoSlippageTolerance: 0.5 },
  { customSlippageValue: 19.99, autoSlippageTolerance: 0.5 },
  { customSlippageValue: 20, autoSlippageTolerance: 0.5 },
  { customSlippageValue: 50, autoSlippageTolerance: 0.5 },
  { customSlippageValue: 0.01, autoSlippageTolerance: 0.5, warnLowSlippage: true },
  { customSlippageValue: 0.01, autoSlippageTolerance: 0.5 },
  { customSlippageValue: 0, autoSlippageTolerance: 0.5, warnLowSlippage: true },
]

const LEVEL_TO_COLOR = {
  critical: '$statusCritical',
  warning: '$statusWarning',
} as const

describe('getSlippageWarningLevel', () => {
  it.each(CASES)('matches getSlippageWarningColor for %o', (params) => {
    const level = getSlippageWarningLevel(params)
    expect(level ? LEVEL_TO_COLOR[level] : '$neutral2').toBe(getSlippageWarningColor(params))
  })

  it('is critical from 20% and warning above the auto tolerance', () => {
    expect(getSlippageWarningLevel({ customSlippageValue: 20, autoSlippageTolerance: 0.5 })).toBe('critical')
    expect(getSlippageWarningLevel({ customSlippageValue: 19.99, autoSlippageTolerance: 0.5 })).toBe('warning')
    expect(getSlippageWarningLevel({ customSlippageValue: 0.5, autoSlippageTolerance: 0.5 })).toBeUndefined()
  })
})
