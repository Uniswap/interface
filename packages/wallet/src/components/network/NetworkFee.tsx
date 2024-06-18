import { Currency, CurrencyAmount } from '@taraswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { ChainId } from 'uniswap/src/types/chains'
import { NumberType } from 'utilities/src/format/types'
import { useUSDValue } from 'wallet/src/features/gas/hooks'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useGasFeeHighRelativeToValue } from 'wallet/src/features/transactions/swap/hooks/useGasFeeHighRelativeToValue'
import { NetworkFeeWarning } from 'wallet/src/features/transactions/swap/modals/NetworkFeeWarning'

export function NetworkFee({
  chainId,
  gasFee,
  transactionUSDValue,
}: {
  chainId: ChainId
  gasFee: GasFeeResult
  transactionUSDValue?: Maybe<CurrencyAmount<Currency>>
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const gasFeeUSD = useUSDValue(chainId, gasFee.value ?? undefined)
  const gasFeeFormatted = convertFiatAmountFormatted(gasFeeUSD, NumberType.FiatTokenPrice)

  const gasFeeHighRelativeToValue = useGasFeeHighRelativeToValue(gasFeeUSD, transactionUSDValue)

  const isLoading = gasFee.loading

  return (
    <Flex row alignItems="center" gap="$spacing12" justifyContent="space-between">
      <NetworkFeeWarning gasFeeHighRelativeToValue={gasFeeHighRelativeToValue}>
        <Text color="$neutral2" flexShrink={1} numberOfLines={3} variant="body3">
          {t('transaction.networkCost.label')}
        </Text>
      </NetworkFeeWarning>
      <Flex row alignItems="center" gap="$spacing8">
        <NetworkLogo chainId={chainId} shape="square" size={iconSizes.icon16} />
        {gasFee.error ? (
          <Text color="$neutral2" variant="body3">
            {t('common.text.notAvailable')}
          </Text>
        ) : (
          <Text
            color={
              isLoading ? '$neutral3' : gasFeeHighRelativeToValue ? '$statusCritical' : '$neutral1'
            }
            variant="body3">
            {gasFeeFormatted}
          </Text>
        )}
      </Flex>
    </Flex>
  )
}
