import { formatApprovalAmount } from 'uniswap/src/components/activity/utils'

const t = (key: string): string => key
const formatNumberOrString = vi.fn(({ value }: { value: unknown }) => `formatted:${String(value)}`)

function format(approvalAmount: string | undefined): string {
  return formatApprovalAmount({ approvalAmount, formatNumberOrString, t })
}

describe(formatApprovalAmount, () => {
  // Decimal-adjusted amounts as the data API reports them; literals are deliberately not derived.
  it.each([
    ['INF sentinel', 'INF'],
    ['uint256 max, 18 decimals', '1.157920892373162e+59'],
    ['uint256 max, 6 decimals', '1.157920892373162e+71'],
    ['uint256 max, 8 decimals', '1.157920892373162e+69'],
    ['uint160 max (Permit2), 18 decimals', '1.461501637330903e+30'],
    ['uint96 max (UNI), 18 decimals', '79228162514.26434'],
    ['just above 1B', '1000000000.000001'],
  ])('returns Unlimited for %s', (_, approvalAmount) => {
    expect(format(approvalAmount)).toBe('transaction.amount.unlimited')
  })

  it.each([
    ['a regular amount', '1500.5'],
    ['exactly 1B', '1000000000'],
    ['a dust amount', '0.000001'],
  ])('formats %s as a number', (_, approvalAmount) => {
    expect(format(approvalAmount)).toBe(`formatted:${approvalAmount}`)
  })

  it.each([
    ['a revoke', '0.0'],
    ['an empty amount', ''],
    ['a missing amount', undefined],
  ])('returns an empty string for %s', (_, approvalAmount) => {
    expect(format(approvalAmount)).toBe('')
  })
})
