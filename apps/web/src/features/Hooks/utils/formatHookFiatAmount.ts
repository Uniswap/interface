import { type FiatNumberType, NumberType } from 'utilities/src/format/types'

export function formatHookFiatAmount(
  value: number | null | undefined,
  formatter: (value: number, type: FiatNumberType) => string,
): string | undefined {
  if (value == null) {
    return undefined
  }

  // FiatTokenStats renders zero as a dash; preserve a served zero as fiat.
  return formatter(value, value === 0 ? NumberType.FiatStandard : NumberType.FiatTokenStats)
}
