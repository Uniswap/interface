import { useMemo } from 'react'
import { OffHoursWarningCard } from 'uniswap/src/features/rwa/OffHoursWarningCard'
import { getRWACandidatesFromCurrency } from 'uniswap/src/features/rwa/rwaCandidates'
import { useIsEquityOffHours } from 'uniswap/src/features/rwa/useIsEquityOffHours'
import { useRWAMatch } from 'uniswap/src/features/rwa/useRWAMatch'
import { useGeoRestrictionMode } from 'uniswap/src/features/transactions/swap/hooks/useGeoRestrictionMode'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { CurrencyField } from 'uniswap/src/types/currency'

// Same off-hours card as the TDP, keyed off the tokens currently selected in the swap form.
export function SwapOffHoursBanner(): JSX.Element | null {
  const inputCurrency = useSwapFormStoreDerivedSwapInfo((s) => s.currencies[CurrencyField.INPUT]?.currency)
  const outputCurrency = useSwapFormStoreDerivedSwapInfo((s) => s.currencies[CurrencyField.OUTPUT]?.currency)

  // Output is checked before input so the typical buy-a-stock case names the token being acquired.
  const candidates = useMemo(
    () => [
      ...(outputCurrency ? getRWACandidatesFromCurrency(outputCurrency) : []),
      ...(inputCurrency ? getRWACandidatesFromCurrency(inputCurrency) : []),
    ],
    [inputCurrency, outputCurrency],
  )

  const rwaMatch = useRWAMatch({ candidates })
  const isOffHours = useIsEquityOffHours()

  // Don't show the banner if the user is already geo-restricted.
  const isGeoRestricted = useGeoRestrictionMode() !== 'default'

  if (!rwaMatch || !isOffHours || isGeoRestricted) {
    return null
  }

  return <OffHoursWarningCard assetName={rwaMatch.asset.name} descriptionTestId={TestID.SwapRWAOffHoursBanner} />
}
