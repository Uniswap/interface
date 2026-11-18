import { getWarningLevelTextColor } from '@universe/transactions-ui'
import { getAlertColor } from 'uniswap/src/components/modals/WarningModal/getAlertColor'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { toWarningLevel } from 'uniswap/src/components/modals/WarningModal/utils'

// Numeric enum: Object.values also holds the reverse-mapped member names.
const ALL_SEVERITIES = Object.values(WarningSeverity).filter(
  (value): value is WarningSeverity => typeof value === 'number',
)

describe('toWarningLevel', () => {
  it('maps every enum member', () => {
    const mapped = Object.fromEntries(
      ALL_SEVERITIES.map((severity) => [WarningSeverity[severity], toWarningLevel(severity)]),
    )
    expect(mapped).toStrictEqual({
      None: undefined,
      Low: 'info',
      Medium: 'warning',
      High: 'critical',
      Blocked: 'blocked',
    })
  })

  // Drift pin: the transactions-ui color table must keep matching getAlertColor's text column.
  it.each(
    ALL_SEVERITIES.flatMap((severity) => {
      const level = toWarningLevel(severity)
      return level ? [[WarningSeverity[severity], severity, level] as const] : []
    }),
  )('keeps the transactions-ui text color in step with getAlertColor for %s', (_name, severity, level) => {
    expect(getWarningLevelTextColor(level)).toBe(getAlertColor(severity).text)
  })

  // Views render the info color when they get no level, so None stays pixel-identical.
  it('renders None in the info color', () => {
    expect(getAlertColor(WarningSeverity.None).text).toBe(getWarningLevelTextColor('info'))
  })
})
