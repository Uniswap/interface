import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { Flex, Text, UniswapXText } from 'ui/src'
import { UniswapX } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { WalletChainId } from 'uniswap/src/types/chains'
import { NumberType } from 'utilities/src/format/types'
import { useUSDValue } from 'wallet/src/features/gas/hooks'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useGasFeeHighRelativeToValue } from 'wallet/src/features/transactions/swap/hooks/useGasFeeHighRelativeToValue'
import { NetworkFeeWarning } from 'wallet/src/features/transactions/swap/modals/NetworkFeeWarning'

export function NetworkFee({
  chainId,
  gasFee,
  preUniswapXGasFeeUSD,
  transactionUSDValue,
}: {
  chainId: WalletChainId
  gasFee: GasFeeResult
  preUniswapXGasFeeUSD?: number
  transactionUSDValue?: Maybe<CurrencyAmount<Currency>>
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const gasFeeUSD = useUSDValue(chainId, gasFee.value ?? undefined)
  const gasFeeFormatted = convertFiatAmountFormatted(gasFeeUSD, NumberType.FiatGasPrice)
  const preSavingsGasFeeFormatted = convertFiatAmountFormatted(preUniswapXGasFeeUSD, NumberType.FiatGasPrice)

  const gasFeeHighRelativeToValue = useGasFeeHighRelativeToValue(gasFeeUSD, transactionUSDValue)
  const isLoading = gasFee.loading

  return (
    <Flex row alignItems="center" gap="$spacing12" justifyContent="space-between">
      <NetworkFeeWarning gasFeeHighRelativeToValue={gasFeeHighRelativeToValue}>
        <Text color="$neutral2" flexShrink={1} numberOfLines={3} variant="body3">
          {t('transaction.networkCost.label')}
        </Text>
      </NetworkFeeWarning>
      <Flex row alignItems="center" gap={preUniswapXGasFeeUSD ? '$spacing4' : '$spacing8'}>
        {(!preUniswapXGasFeeUSD || gasFee.error) && (
          <NetworkLogo chainId={chainId} shape="square" size={iconSizes.icon16} />
        )}
        {gasFee.error ? (
          <Text color="$neutral2" variant="body3">
            {t('common.text.notAvailable')}
          </Text>
        ) : preUniswapXGasFeeUSD ? (
          <UniswapXFee gasFee={gasFeeFormatted} preSavingsGasFee={preSavingsGasFeeFormatted} />
        ) : (
          <Text
            color={isLoading ? '$neutral3' : gasFeeHighRelativeToValue ? '$statusCritical' : '$neutral1'}
            variant="body3"
          >
            {gasFeeFormatted}
          </Text>
        )}
      </Flex>
    </Flex>
  )
}

export function UniswapXFee({ gasFee, preSavingsGasFee }: { gasFee: string; preSavingsGasFee?: string }): JSX.Element {
  return (
    <Flex centered row gap="$spacing4">
      <UniswapX marginEnd="$spacing2" size="$icon.16" />
      <UniswapXText variant="body3">{gasFee}</UniswapXText>
      {preSavingsGasFee && (
        <Text color="$neutral2" textDecorationLine="line-through" variant="body3">
          {preSavingsGasFee}
        </Text>
      )}
    </Flex>
  )
}
