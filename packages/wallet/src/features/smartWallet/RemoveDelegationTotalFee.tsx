import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ContentRow } from 'uniswap/src/components/transactions/requests/ContentRow'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { ChainFiatFeeCalculator } from 'wallet/src/components/smartWallet/ChainFiatFeeCalculator'
import { FiatFeeDisplay } from 'wallet/src/components/smartWallet/FiatFeeDisplay'
import { NativeFeeDisplay } from 'wallet/src/components/smartWallet/NativeFeeDisplay'
import { useFiatGasFees } from 'wallet/src/features/smartWallet/hooks/useFiatGasFees'
import { GasFeeData, groupGasFeesBySymbol } from 'wallet/src/features/smartWallet/utils/gasFeeUtils'

interface RemoveDelegationTotalFeeProps {
  gasFees: GasFeeData[]
  setIsLoading?: (isLoading: boolean) => void
}

export function RemoveDelegationTotalFee({ gasFees, setIsLoading }: RemoveDelegationTotalFeeProps): JSX.Element | null {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  // TODO(WALL-7209): replace/remove this workaround when we use the hook directly
  const [gasFeeUpdateCount, setGasFeeUpdateCount] = useState(0)
  // biome-ignore lint/correctness/useExhaustiveDependencies: -gasFees
  useEffect(() => {
    // Force a re-render when gasFees changes to ensure ChainFiatFeeCalculator updates
    setGasFeeUpdateCount((count) => count + 1)
  }, [gasFees])

  const logoChainId = gasFees.length === 1 ? (gasFees[0]?.chainId ?? null) : null

  const { totalFiatAmount, isLoading, hasError, onFetched, onError } = useFiatGasFees(gasFees)

  const gasFeeFormatted = hasError ? null : convertFiatAmountFormatted(totalFiatAmount, NumberType.FiatGasPrice)

  const groupedFees = useMemo(() => (hasError ? groupGasFeesBySymbol(gasFees) : null), [gasFees, hasError])
  const showFiatDisplay = gasFeeFormatted || isLoading

  useEffect(() => {
    setIsLoading?.(isLoading)
  }, [isLoading, setIsLoading])

  return (
    <>
      {/* Fiat fee calculators */}
      {gasFees.map(({ chainId, gasFeeDisplayValue }) => (
        <ChainFiatFeeCalculator
          // force rerender when gasFees object changes
          key={`${chainId}-${gasFeeUpdateCount}`}
          chainId={chainId}
          gasFeeDisplayValue={gasFeeDisplayValue}
          onFetched={onFetched}
          onError={onError}
        />
      ))}

      <ContentRow
        label={t('transaction.networkCost.label')}
        variant="body3"
        alignItems={showFiatDisplay ? 'center' : 'flex-start'}
      >
        {showFiatDisplay ? (
          <FiatFeeDisplay
            logoChainId={logoChainId}
            isLoading={isLoading}
            hasError={hasError}
            gasFeeFormatted={gasFeeFormatted}
          />
        ) : (
          <NativeFeeDisplay groupedFees={groupedFees} />
        )}
      </ContentRow>
    </>
  )
}
