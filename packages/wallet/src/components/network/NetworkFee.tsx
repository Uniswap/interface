import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { Flex, Text, UniswapXText } from 'ui/src'
import { UniswapX } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { useUSDValue } from 'uniswap/src/features/gas/hooks'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { WalletChainId } from 'uniswap/src/types/chains'
import { NumberType } from 'utilities/src/format/types'
import { useFormattedUniswapXGasFeeInfo } from 'wallet/src/components/network/hooks'
import { IndicativeLoadingWrapper } from 'wallet/src/features/transactions/TransactionDetails/TransactionDetails'
import { useGasFeeHighRelativeToValue } from 'wallet/src/features/transactions/swap/hooks/useGasFeeHighRelativeToValue'
import { NetworkFeeWarning } from 'wallet/src/features/transactions/swap/modals/NetworkFeeWarning'
import { UniswapXGasBreakdown } from 'wallet/src/features/transactions/swap/trade/api/hooks/useSwapTxAndGasInfo'

export function NetworkFee({
  chainId,
  gasFee,
  uniswapXGasBreakdown,
  transactionUSDValue,
  indicative,
}: {
  chainId: WalletChainId
  gasFee: GasFeeResult
  uniswapXGasBreakdown?: UniswapXGasBreakdown
  transactionUSDValue?: Maybe<CurrencyAmount<Currency>>
  indicative?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const gasFeeUSD = useUSDValue(chainId, gasFee.value ?? undefined)
  const gasFeeFormatted = convertFiatAmountFormatted(gasFeeUSD, NumberType.FiatGasPrice)

  const uniswapXGasFeeInfo = useFormattedUniswapXGasFeeInfo(uniswapXGasBreakdown, chainId)

  const gasFeeHighRelativeToValue = useGasFeeHighRelativeToValue(gasFeeUSD, transactionUSDValue)

  return (
    <Flex row alignItems="center" gap="$spacing12" justifyContent="space-between">
      <NetworkFeeWarning gasFeeHighRelativeToValue={gasFeeHighRelativeToValue} uniswapXGasFeeInfo={uniswapXGasFeeInfo}>
        <Text color="$neutral2" flexShrink={1} numberOfLines={3} variant="body3">
          {t('transaction.networkCost.label')}
        </Text>
      </NetworkFeeWarning>
      <IndicativeLoadingWrapper loading={indicative || (!gasFee.value && gasFee.isLoading)}>
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
              color={gasFee.isLoading ? '$neutral3' : gasFeeHighRelativeToValue ? '$statusCritical' : '$neutral1'}
              variant="body3"
            >
              {gasFeeFormatted}
            </Text>
          )}
        </Flex>
      </IndicativeLoadingWrapper>
    </Flex>
  )
}

type UniswapXFeeProps = { gasFee: string; preSavingsGasFee?: string; smaller?: boolean }
export function UniswapXFee({ gasFee, preSavingsGasFee, smaller = false }: UniswapXFeeProps): JSX.Element {
  return (
    <Flex centered row gap="$spacing4">
      <UniswapX marginEnd="$spacing2" size={smaller ? '$icon.12' : '$icon.16'} />
      <UniswapXText variant={smaller ? 'body4' : 'body3'}>{gasFee}</UniswapXText>
      {preSavingsGasFee && (
        <Text color="$neutral2" textDecorationLine="line-through" variant={smaller ? 'body4' : 'body3'}>
          {preSavingsGasFee}
        </Text>
      )}
    </Flex>
  )
}
