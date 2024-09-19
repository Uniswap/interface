import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { Flex, Text, UniswapXText } from 'ui/src'
import { UniswapX } from 'ui/src/components/icons/UniswapX'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { IndicativeLoadingWrapper } from 'uniswap/src/components/misc/IndicativeLoadingWrapper'
import {
  useFormattedUniswapXGasFeeInfo,
  useGasFeeHighRelativeToValue,
  useUSDValue,
} from 'uniswap/src/features/gas/hooks'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { UniswapXGasBreakdown } from 'uniswap/src/features/transactions/swap/hooks/useSwapTxAndGasInfo'
import { NetworkFeeWarning } from 'uniswap/src/features/transactions/swap/modals/NetworkFeeWarning'
import { WalletChainId } from 'uniswap/src/types/chains'
import { NumberType } from 'utilities/src/format/types'

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
