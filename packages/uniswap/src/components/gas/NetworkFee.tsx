import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { GasFeeResult, TradingApi } from '@universe/api'
import { isWebApp } from '@universe/environment'
import { useTranslation } from 'react-i18next'
import { Flex, Text, UniswapXText, UniversalImage, UniversalImageResizeMode } from 'ui/src'
import { UniswapX } from 'ui/src/components/icons/UniswapX'
import { borderRadii, iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { NetworkFeeWarning } from 'uniswap/src/components/gas/NetworkFeeWarning'
import { IndicativeLoadingWrapper } from 'uniswap/src/components/misc/IndicativeLoadingWrapper'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  useFormattedUniswapXGasFeeInfo,
  useGasFeeFormattedDisplayAmounts,
  useGasFeeHighRelativeToValue,
} from 'uniswap/src/features/gas/hooks'
import { UniswapXGasBreakdown } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { isZero } from 'uniswap/src/utils/number'

export function NetworkFee({
  chainId,
  gasFee,
  uniswapXGasBreakdown,
  transactionUSDValue,
  indicative,
  includesDelegation,
  showNetworkLogo = true,
  sponsorMetadata,
}: {
  chainId: UniverseChainId
  gasFee: GasFeeResult
  uniswapXGasBreakdown?: UniswapXGasBreakdown
  transactionUSDValue?: Maybe<CurrencyAmount<Currency>>
  indicative?: boolean
  includesDelegation?: boolean
  showNetworkLogo?: boolean
  /** When present, the gas amount is replaced with the sponsor icon + "Free". */
  sponsorMetadata?: TradingApi.SponsorMetadata
}): JSX.Element {
  const { t } = useTranslation()

  const { gasFeeFormatted, gasFeeUSD } = useGasFeeFormattedDisplayAmounts({
    gasFee,
    chainId,
    placeholder: '-',
    includesDelegation,
  })

  const uniswapXGasFeeInfo = useFormattedUniswapXGasFeeInfo(uniswapXGasBreakdown, chainId)
  const isGasFeeFree = gasFee.value !== undefined && isZero(gasFee.value)

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
            {sponsorMetadata ? (
              <SponsoredFee sponsorMetadata={sponsorMetadata} preSavingsGasFee={gasFeeFormatted} />
            ) : (
              <>
                {(!uniswapXGasBreakdown || gasFee.error) && showNetworkLogo && (
                  <NetworkLogo chainId={chainId} shape="square" size={iconSizes.icon16} />
                )}
                {gasFee.error ? (
                  <Text color="$neutral2" variant="body3">
                    {t('common.text.notAvailable')}
                  </Text>
                ) : uniswapXGasBreakdown ? (
                  <UniswapXFee
                    gasFee={gasFeeFormatted}
                    isFree={isGasFeeFree}
                    preSavingsGasFee={uniswapXGasFeeInfo?.preSavingsGasFeeFormatted}
                  />
                ) : (
                  <Text
                    color={gasFee.isLoading ? '$neutral3' : showHighGasFeeUI ? '$statusCritical' : '$neutral1'}
                    variant="body3"
                  >
                    {gasFeeFormatted}
                  </Text>
                )}
              </>
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

/**
 * Strikethrough "estimated" gas amount rendered to the left of a discounted /
 * sponsored / UniswapX fee, signalling the savings.
 */
function StrikethroughGasFee({ value, smaller }: { value: string; smaller?: boolean }): JSX.Element {
  return (
    <Text color="$neutral2" textDecorationLine="line-through" variant={smaller ? 'body4' : 'body3'}>
      {value}
    </Text>
  )
}

export function SponsoredFee({
  sponsorMetadata,
  preSavingsGasFee,
  smaller,
}: {
  sponsorMetadata: TradingApi.SponsorMetadata
  preSavingsGasFee?: string
  smaller?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex centered row gap="$spacing6">
      {preSavingsGasFee && <StrikethroughGasFee value={preSavingsGasFee} smaller={smaller} />}
      {sponsorMetadata.icon && (
        <UniversalImage
          size={{
            width: smaller ? iconSizes.icon12 : iconSizes.icon16,
            height: smaller ? iconSizes.icon12 : iconSizes.icon16,
            resizeMode: UniversalImageResizeMode.Contain,
          }}
          style={{ image: { borderRadius: borderRadii.roundedFull } }}
          uri={sponsorMetadata.icon}
        />
      )}
      <Text color="$accent1" variant={smaller ? 'body4' : 'body3'}>
        {t('common.free')}
      </Text>
    </Flex>
  )
}

type UniswapXFeeProps = {
  gasFee: string
  isFree?: boolean
  preSavingsGasFee?: string
  smaller?: boolean
  loading?: boolean
}
export function UniswapXFee({ gasFee, isFree, preSavingsGasFee, smaller = false }: UniswapXFeeProps): JSX.Element {
  const { t } = useTranslation()
  const gasFeeDisplayed = isFree ? t('common.free') : gasFee

  return (
    <Flex centered row>
      {preSavingsGasFee && (
        <Flex mr="$spacing6">
          <StrikethroughGasFee value={preSavingsGasFee} smaller={smaller} />
        </Flex>
      )}
      <UniswapX marginEnd="$spacing2" size={smaller ? '$icon.12' : '$icon.16'} />
      <UniswapXText variant={smaller ? 'body4' : 'body3'}>{gasFeeDisplayed}</UniswapXText>
    </Flex>
  )
}
