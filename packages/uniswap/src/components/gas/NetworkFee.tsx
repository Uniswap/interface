import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { Flex, Text, UniswapXText } from 'ui/src'
import { UniswapX } from 'ui/src/components/icons/UniswapX'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { NetworkFeeWarning } from 'uniswap/src/components/gas/NetworkFeeWarning'
import { IndicativeLoadingWrapper } from 'uniswap/src/components/misc/IndicativeLoadingWrapper'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  useFormattedUniswapXGasFeeInfo,
  useGasFeeFormattedDisplayAmounts,
  useGasFeeHighRelativeToValue,
} from 'uniswap/src/features/gas/hooks'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'
import { UniswapXGasBreakdown } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { isWebApp } from 'utilities/src/platform'

export function NetworkFee({
  chainId,
  gasFee,
  uniswapXGasBreakdown,
  transactionUSDValue,
  indicative,
  includesDelegation,
  showNetworkLogo = true,
}: {
  chainId: UniverseChainId
  gasFee: GasFeeResult
  uniswapXGasBreakdown?: UniswapXGasBreakdown
  transactionUSDValue?: Maybe<CurrencyAmount<Currency>>
  indicative?: boolean
  includesDelegation?: boolean
  showNetworkLogo?: boolean
}): JSX.Element {
  const { t } = useTranslation()

  const { gasFeeFormatted, gasFeeUSD } = useGasFeeFormattedDisplayAmounts({
    gasFee,
    chainId,
    placeholder: '-',
    includesDelegation,
  })

  const uniswapXGasFeeInfo = useFormattedUniswapXGasFeeInfo(uniswapXGasBreakdown, chainId)

  const gasFeeHighRelativeToValue = useGasFeeHighRelativeToValue(gasFeeUSD, transactionUSDValue)
  const showHighGasFeeUI = gasFeeHighRelativeToValue && !isWebApp // Avoid high gas UI on interface

  return (
    <Flex gap="$spacing4">
      <Flex row alignItems="center" gap="$spacing12" justifyContent="space-between">
        <NetworkFeeWarning
          includesDelegation={includesDelegation}
          gasFeeHighRelativeToValue={gasFeeHighRelativeToValue}
          uniswapXGasFeeInfo={uniswapXGasFeeInfo}
          chainId={chainId}
        >
          <Text color="$neutral2" flexShrink={1} numberOfLines={3} variant="body3">
            {t('transaction.networkCost.label')}
          </Text>
        </NetworkFeeWarning>
        <IndicativeLoadingWrapper loading={indicative || (!gasFee.value && gasFee.isLoading)}>
          <Flex row alignItems="center" gap={uniswapXGasBreakdown ? '$spacing4' : '$spacing8'}>
            {(!uniswapXGasBreakdown || gasFee.error) && showNetworkLogo && (
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
                color={gasFee.isLoading ? '$neutral3' : showHighGasFeeUI ? '$statusCritical' : '$neutral1'}
                variant="body3"
              >
                {gasFeeFormatted}
              </Text>
            )}
          </Flex>
        </IndicativeLoadingWrapper>
      </Flex>
      {includesDelegation && (
        <Text color="$neutral3" variant="body4">
          {t('swap.warning.networkFee.includesDelegation')}
        </Text>
      )}
    </Flex>
  )
}

type UniswapXFeeProps = { gasFee: string; preSavingsGasFee?: string; smaller?: boolean; loading?: boolean }
export function UniswapXFee({
  gasFee,
  preSavingsGasFee,
  smaller = false,
  loading = false,
}: UniswapXFeeProps): JSX.Element {
  const priceUxEnabled = usePriceUXEnabled()

  if (priceUxEnabled) {
    return (
      <Flex centered row gap="$spacing4">
        <UniswapX marginEnd="$spacing2" size={smaller ? '$icon.12' : '$icon.16'} />
        <UniswapXText mr="$spacing6" variant={smaller ? 'body4' : 'body3'}>
          {gasFee}
        </UniswapXText>
        {preSavingsGasFee && (
          <Text
            color={loading ? '$neutral3' : '$neutral2'}
            textDecorationLine="line-through"
            variant={smaller ? 'body4' : 'body3'}
          >
            {preSavingsGasFee}
          </Text>
        )}
      </Flex>
    )
  }

  return (
    <Flex centered row>
      <UniswapX marginEnd="$spacing2" size={smaller ? '$icon.12' : '$icon.16'} />
      <UniswapXText mr="$spacing6" variant={smaller ? 'body4' : 'body3'}>
        {gasFee}
      </UniswapXText>
      {preSavingsGasFee && (
        <Text color="$neutral2" textDecorationLine="line-through" variant={smaller ? 'body4' : 'body3'}>
          {preSavingsGasFee}
        </Text>
      )}
    </Flex>
  )
}
