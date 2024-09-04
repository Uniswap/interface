import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { Flex, Text, UniswapXText } from 'ui/src'
import { UniswapX } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { WalletChainId } from 'uniswap/src/types/chains'
import { NumberType } from 'utilities/src/format/types'
import { useFormattedUniswapXGasFeeInfo } from 'wallet/src/components/network/hooks'
import { useUSDValue } from 'wallet/src/features/gas/hooks'
import { useGasFeeHighRelativeToValue } from 'wallet/src/features/transactions/swap/hooks/useGasFeeHighRelativeToValue'
import { NetworkFeeWarning } from 'wallet/src/features/transactions/swap/modals/NetworkFeeWarning'
import { UniswapXGasBreakdown } from 'wallet/src/features/transactions/swap/trade/api/hooks/useSwapTxAndGasInfo'

export function NetworkFee({
  chainId,
  gasFee,
  uniswapXGasBreakdown,
  transactionUSDValue,
}: {
  chainId: WalletChainId
  gasFee: GasFeeResult
  uniswapXGasBreakdown?: UniswapXGasBreakdown
  transactionUSDValue?: Maybe<CurrencyAmount<Currency>>
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const gasFeeUSD = useUSDValue(chainId, gasFee.value ?? undefined)
  const gasFeeFormatted = convertFiatAmountFormatted(gasFeeUSD, NumberType.FiatGasPrice)

  const uniswapXGasFeeInfo = useFormattedUniswapXGasFeeInfo(uniswapXGasBreakdown, chainId)

  const gasFeeHighRelativeToValue = useGasFeeHighRelativeToValue(gasFeeUSD, transactionUSDValue)
  const isLoading = gasFee.isLoading

  return (
    <Flex row alignItems="center" gap="$spacing12" justifyContent="space-between">
      <NetworkFeeWarning gasFeeHighRelativeToValue={gasFeeHighRelativeToValue} uniswapXGasFeeInfo={uniswapXGasFeeInfo}>
        <Text color="$neutral2" flexShrink={1} numberOfLines={3} variant="body3">
          {t('transaction.networkCost.label')}
        </Text>
      </NetworkFeeWarning>
      <Flex row alignItems="center" gap={uniswapXGasBreakdown ? '$spacing4' : '$spacing8'}>
        {(!uniswapXGasBreakdown || gasFee.error) && (
          <NetworkLogo chainId={chainId} shape="square" size={iconSizes.icon16} />
        )}
        {gasFee.error ? (
          <Text color="$neutral2" variant="body3">
            {t('common.text.notAvailable')}
          </Text>
        ) : uniswapXGasBreakdown ? (
          <UniswapXFee gasFee={gasFeeFormatted} preSavingsGasFee={uniswapXGasFeeInfo?.preSavingsGasFeeFormatted} />
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
