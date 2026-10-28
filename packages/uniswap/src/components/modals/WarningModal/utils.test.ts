import { getWarningTextColor } from '@universe/swap-ui'
import { getAlertColor } from 'uniswap/src/components/modals/WarningModal/getAlertColor'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { toSwapWarningSeverity } from 'uniswap/src/components/modals/WarningModal/utils'

// Numeric enum: Object.values also holds the reverse-mapped member names.
const ALL_SEVERITIES = Object.values(WarningSeverity).filter(
  (value): value is WarningSeverity => typeof value === 'number',
)

describe('toSwapWarningSeverity', () => {
  it('maps every enum member', () => {
    const mapped = Object.fromEntries(
      ALL_SEVERITIES.map((severity) => [WarningSeverity[severity], toSwapWarningSeverity(severity)]),
    )
    expect(mapped).toStrictEqual({ None: 'none', Low: 'low', Medium: 'medium', High: 'high', Blocked: 'blocked' })
  })

  // Drift pin: the swap-ui color table must keep matching getAlertColor's text column.
  it.each(ALL_SEVERITIES.map((severity) => [WarningSeverity[severity], severity] as const))(
    'keeps the swap-ui text color in step with getAlertColor for %s',
    (_name, severity) => {
      expect(getWarningTextColor(toSwapWarningSeverity(severity))).toBe(getAlertColor(severity).text)
    },
  )
})
