import { Currency, CurrencyAmount, Fraction } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { NumberType } from 'utilities/src/format/types'
import { ErrorCallout } from '~/components/ErrorCallout'
import { CurrencyAmountMap } from '~/types/liquidity'
import { PositionField } from '~/types/position'

// Warn when less than half of the position's value will actually migrate
export const PARTIAL_MIGRATION_WARNING_THRESHOLD = new Fraction(50, 100)

const ONE = new Fraction(1)
const ZERO = new Fraction(0)

function clampShare(share: Fraction): Fraction {
  if (share.lessThan(ZERO)) {
    return ZERO
  }
  return share.greaterThan(ONE) ? ONE : share
}

// Sum two optional amounts; mismatched currencies can't be added, so prefer the principal
function combineAmounts(
  a: Maybe<CurrencyAmount<Currency>>,
  b: Maybe<CurrencyAmount<Currency>>,
): Maybe<CurrencyAmount<Currency>> {
  if (a && b && a.currency.equals(b.currency)) {
    return a.add(b)
  }
  return a ?? b
}

// USD math only holds if every non-zero amount has a USD value to contribute
function hasUSDValueForNonZeroAmounts(amounts?: CurrencyAmountMap, usdValues?: CurrencyAmountMap): boolean {
  return [PositionField.TOKEN0, PositionField.TOKEN1].every(
    (field) => !amounts?.[field]?.greaterThan(0) || Boolean(usdValues?.[field]),
  )
}

function sumUSD(...usdValues: Maybe<CurrencyAmount<Currency>>[]): Maybe<CurrencyAmount<Currency>> {
  return usdValues.reduce<Maybe<CurrencyAmount<Currency>>>((total, value) => combineAmounts(total, value), undefined)
}

/**
 * Share (0-1) of the position's value that will actually migrate. The backend's estimated refund
 * is everything sent to the migrator that doesn't fit in the new position — principal AND
 * uncollected fees — so the denominator must include the fees on top of the migrating amounts.
 * USD values combine the two tokens; when they are unavailable, falls back to the worst
 * per-token share.
 */
export function getMigratedPositionShare({
  currencyAmounts,
  feeAmounts,
  refundedAmounts,
  currencyAmountsUSDValue,
  feeAmountsUSDValue,
  refundedAmountsUSDValue,
}: {
  currencyAmounts?: CurrencyAmountMap
  feeAmounts?: CurrencyAmountMap
  refundedAmounts?: CurrencyAmountMap
  currencyAmountsUSDValue?: CurrencyAmountMap
  feeAmountsUSDValue?: CurrencyAmountMap
  refundedAmountsUSDValue?: CurrencyAmountMap
}): Fraction | undefined {
  // Everything the migration contract receives per token: principal + uncollected fees
  const totalAmounts: CurrencyAmountMap = {
    [PositionField.TOKEN0]: combineAmounts(currencyAmounts?.TOKEN0, feeAmounts?.TOKEN0),
    [PositionField.TOKEN1]: combineAmounts(currencyAmounts?.TOKEN1, feeAmounts?.TOKEN1),
  }

  const hasTotal = Boolean(totalAmounts.TOKEN0?.greaterThan(0) || totalAmounts.TOKEN1?.greaterThan(0))
  if (!hasTotal) {
    return undefined
  }

  const hasRefund = Boolean(refundedAmounts?.TOKEN0?.greaterThan(0) || refundedAmounts?.TOKEN1?.greaterThan(0))
  if (!hasRefund) {
    return ONE
  }

  if (
    hasUSDValueForNonZeroAmounts(currencyAmounts, currencyAmountsUSDValue) &&
    hasUSDValueForNonZeroAmounts(feeAmounts, feeAmountsUSDValue) &&
    hasUSDValueForNonZeroAmounts(refundedAmounts, refundedAmountsUSDValue)
  ) {
    const totalUSD = sumUSD(
      currencyAmountsUSDValue?.TOKEN0,
      currencyAmountsUSDValue?.TOKEN1,
      feeAmountsUSDValue?.TOKEN0,
      feeAmountsUSDValue?.TOKEN1,
    )
    const refundedUSD = sumUSD(refundedAmountsUSDValue?.TOKEN0, refundedAmountsUSDValue?.TOKEN1)
    if (totalUSD?.greaterThan(0) && refundedUSD) {
      return clampShare(ONE.subtract(refundedUSD.asFraction.divide(totalUSD.asFraction)))
    }
  }

  // Fallback without USD values: the smallest per-token migrated share
  const shares = [PositionField.TOKEN0, PositionField.TOKEN1]
    .map((field) => {
      const total = totalAmounts[field]
      if (!total?.greaterThan(0)) {
        return undefined
      }
      const refunded = refundedAmounts?.[field]
      if (!refunded?.greaterThan(0)) {
        return ONE
      }
      return clampShare(ONE.subtract(refunded.asFraction.divide(total.asFraction)))
    })
    .filter((share): share is Fraction => share !== undefined)

  if (shares.length === 0) {
    return undefined
  }

  return shares.reduce((min, share) => (share.lessThan(min) ? share : min))
}

export function PartialMigrationWarning({
  currencyAmounts,
  currencyAmountsUSDValue,
  feeAmounts,
  refundedAmounts,
  refundedAmountsUSDValue,
}: {
  currencyAmounts?: CurrencyAmountMap
  currencyAmountsUSDValue?: CurrencyAmountMap
  feeAmounts?: CurrencyAmountMap
  refundedAmounts?: CurrencyAmountMap
  refundedAmountsUSDValue?: CurrencyAmountMap
}) {
  const { t } = useTranslation()
  const { formatPercent, formatCurrencyAmount } = useLocalizationContext()

  const feeAmount0USD = useUSDCValue(feeAmounts?.TOKEN0)
  const feeAmount1USD = useUSDCValue(feeAmounts?.TOKEN1)

  const migratedShare = useMemo(
    () =>
      getMigratedPositionShare({
        currencyAmounts,
        feeAmounts,
        refundedAmounts,
        currencyAmountsUSDValue,
        feeAmountsUSDValue: { TOKEN0: feeAmount0USD, TOKEN1: feeAmount1USD },
        refundedAmountsUSDValue,
      }),
    [
      currencyAmounts,
      feeAmounts,
      refundedAmounts,
      currencyAmountsUSDValue,
      feeAmount0USD,
      feeAmount1USD,
      refundedAmountsUSDValue,
    ],
  )

  if (!migratedShare?.lessThan(PARTIAL_MIGRATION_WARNING_THRESHOLD)) {
    return null
  }

  const formattedRefunds = [refundedAmounts?.TOKEN0, refundedAmounts?.TOKEN1]
    .filter((amount): amount is CurrencyAmount<Currency> => Boolean(amount?.greaterThan(0)))
    .map((amount) => `${formatCurrencyAmount({ value: amount, type: NumberType.TokenTx })} ${amount.currency.symbol}`)

  return (
    <ErrorCallout
      isWarning
      errorMessage={true}
      title={t('migrate.partial.title', {
        percent: formatPercent(Number(migratedShare.multiply(100).toFixed(2))),
      })}
      description={
        formattedRefunds.length === 2
          ? t('migrate.partial.description.twoTokens', { amountA: formattedRefunds[0], amountB: formattedRefunds[1] })
          : t('migrate.partial.description.oneToken', { amount: formattedRefunds[0] })
      }
    />
  )
}
