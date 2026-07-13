import { type Currency, type CurrencyAmount } from '@uniswap/sdk-core'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { ExpandableHelpLink } from '~/pages/Liquidity/CreateAuction/components/ExpandableHelpLink'
import { PostAuctionLiquiditySelector } from '~/pages/Liquidity/CreateAuction/components/PostAuctionLiquiditySelector'
import { quoteRaiseAtFloor } from '~/pages/Liquidity/CreateAuction/launchThreshold'
import { type InputCurrency } from '~/pages/Liquidity/CreateAuction/types'
import {
  type PostAuctionLiquidityAllocation,
  PostAuctionLiquidityAllocationType,
  type PostAuctionLiquidityTier,
  type RaiseCurrency,
} from '~/pages/Liquidity/CreateAuction/types'

interface PostAuctionLiquiditySectionProps {
  allocation: PostAuctionLiquidityAllocation
  postAuctionLiquidityPercent: number
  auctionSupplyAmount: CurrencyAmount<Currency>
  postAuctionLiquidityAmount: CurrencyAmount<Currency>
  floorPrice: string
  raiseCurrency: RaiseCurrency
  chainId: UniverseChainId
  tokenSymbol: string
  inputCurrency: InputCurrency
  usdPriceNum: number | null
  onAllocationTypeSelect: (type: PostAuctionLiquidityAllocationType) => void
  onSelectPercent: (percent: number) => void
  onAddTier: (options?: { usdPriceNum: number | null }) => void
  onUpdateTier: (tierId: string, config: Partial<Pick<PostAuctionLiquidityTier, 'raiseMilestone' | 'percent'>>) => void
  onRemoveTier: (tierId: string) => void
}

export function PostAuctionLiquiditySection({
  allocation,
  postAuctionLiquidityPercent,
  auctionSupplyAmount,
  postAuctionLiquidityAmount,
  floorPrice,
  raiseCurrency,
  chainId,
  tokenSymbol,
  inputCurrency,
  usdPriceNum,
  onAllocationTypeSelect,
  onSelectPercent,
  onAddTier,
  onUpdateTier,
  onRemoveTier,
}: PostAuctionLiquiditySectionProps) {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const { code: fiatCurrencyCode } = useAppFiatCurrencyInfo()

  // When the editor is in USD mode, pass the (snapshotted) USD price down so the first tier
  // defaults to 100k USD (converted to raise) instead of 100k raise tokens. Subsequent tiers
  // (10× previous) preserve USD round-ness automatically since 10× commutes with the conversion.
  const handleAddTier = useCallback(() => {
    onAddTier({ usdPriceNum: inputCurrency === 'usd' ? usdPriceNum : null })
  }, [onAddTier, inputCurrency, usdPriceNum])

  const { subtitle, showSubtitleTooltip } = useMemo(() => {
    const zeroSubtitle = t('toucan.createAuction.step.configureAuction.postAuctionLiquidity.subtitle', {
      amount: '0',
      raiseCurrency,
    })
    const zero = {
      subtitle: zeroSubtitle,
      showSubtitleTooltip: false as const,
    }

    if (auctionSupplyAmount.equalTo(0)) {
      return zero
    }

    const notional = quoteRaiseAtFloor({
      floorPrice,
      raiseCurrency,
      chainId,
      tokensAmount: postAuctionLiquidityAmount,
    })
    if (!notional) {
      return zero
    }

    const formatted = formatNumberOrString({
      value: notional.toExact(),
      type: NumberType.TokenQuantityStats,
      placeholder: '0',
    })
    return {
      subtitle: t('toucan.createAuction.step.configureAuction.postAuctionLiquidity.subtitle', {
        amount: formatted,
        raiseCurrency,
      }),
      showSubtitleTooltip: true as const,
    }
  }, [floorPrice, auctionSupplyAmount, postAuctionLiquidityAmount, raiseCurrency, chainId, formatNumberOrString, t])

  return (
    <Flex gap="$spacing8">
      <Flex gap="$spacing4" py="$spacing2">
        <Text variant="subheading1" color="$neutral1">
          {t('toucan.details.postAuctionLiquidity')}
        </Text>
        <Text variant="body3" color="$neutral2">
          {t('toucan.createAuction.step.configureAuction.postAuctionLiquidity.description', {
            raiseCurrency,
            tokenSymbol,
          })}
        </Text>
      </Flex>

      <PostAuctionLiquiditySelector
        allocation={allocation}
        postAuctionLiquidityPercent={postAuctionLiquidityPercent}
        raiseCurrencySymbol={raiseCurrency}
        subtitle={subtitle}
        showSubtitleTooltip={showSubtitleTooltip}
        inputCurrency={inputCurrency}
        usdPriceNum={usdPriceNum}
        fiatCurrencyCode={fiatCurrencyCode}
        onAllocationTypeSelect={onAllocationTypeSelect}
        onSelectPercent={onSelectPercent}
        onAddTier={handleAddTier}
        onUpdateTier={onUpdateTier}
        onRemoveTier={onRemoveTier}
      />

      <ExpandableHelpLink
        label={t('toucan.createAuction.step.configureAuction.postAuctionLiquidity.helpLink')}
        description={t('toucan.createAuction.step.configureAuction.postAuctionLiquidity.helpDescription', {
          raiseCurrency,
          tokenSymbol,
        })}
      />
    </Flex>
  )
}
