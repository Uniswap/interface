import { type Currency, type CurrencyAmount } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { ExpandableHelpLink } from '~/pages/Liquidity/CreateAuction/components/ExpandableHelpLink'
import { getLaunchThreshold } from '~/pages/Liquidity/CreateAuction/launchThreshold'
import { type RaiseCurrency } from '~/pages/Liquidity/CreateAuction/types'
import { getRaiseCurrencyAsCurrency } from '~/pages/Liquidity/CreateAuction/utils'

const LOGO_SIZE = iconSizes.icon24

/**
 * Read-only "Launch threshold" summary at the end of the configure-auction step: the minimum raise
 * volume required for the auction to launch (floor price × tokens sold). Depends on the floor price
 * and the post-auction-liquidity split, so it lives after both.
 */
export function LaunchThresholdSection({
  floorPrice,
  raiseCurrency,
  chainId,
  auctionSupplyAmount,
  postAuctionLiquidityAmount,
}: {
  floorPrice: string
  raiseCurrency: RaiseCurrency
  chainId: UniverseChainId
  auctionSupplyAmount: CurrencyAmount<Currency>
  postAuctionLiquidityAmount: CurrencyAmount<Currency>
}) {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()

  const raiseCurrencySdk = useMemo(() => getRaiseCurrencyAsCurrency(raiseCurrency, chainId), [raiseCurrency, chainId])
  const raiseCurrencyInfo = useCurrencyInfo(raiseCurrencySdk ? currencyId(raiseCurrencySdk) : undefined)

  const threshold = useMemo(
    () => getLaunchThreshold({ floorPrice, raiseCurrency, chainId, auctionSupplyAmount, postAuctionLiquidityAmount }),
    [floorPrice, raiseCurrency, chainId, auctionSupplyAmount, postAuctionLiquidityAmount],
  )
  const formattedThreshold = formatNumberOrString({
    value: threshold?.toExact() ?? '0',
    type: NumberType.TokenQuantityStats,
    placeholder: '0',
  })

  return (
    <Flex gap="$spacing12">
      <Flex gap="$spacing8">
        <Text variant="subheading1" color="$neutral1">
          {t('toucan.createAuction.step.configureAuction.launchThreshold')}
        </Text>
        <Flex row alignItems="center" gap="$spacing8">
          {raiseCurrencyInfo ? (
            <CurrencyLogo hideNetworkLogo currencyInfo={raiseCurrencyInfo} size={LOGO_SIZE} />
          ) : null}
          <Text variant="heading3" color="$neutral1">
            {formattedThreshold} {raiseCurrencySdk?.symbol}
          </Text>
        </Flex>
        <Text variant="body3" color="$neutral2">
          {t('toucan.createAuction.step.configureAuction.launchThreshold.description')}
        </Text>
      </Flex>

      <ExpandableHelpLink
        label={t('toucan.createAuction.step.configureAuction.launchThreshold.helpLink')}
        description={t('toucan.createAuction.step.configureAuction.launchThreshold.helpDescription')}
      />
    </Flex>
  )
}
