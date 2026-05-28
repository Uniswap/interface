import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { formatUnits, parseUnits } from '~/chains'
import { SimulationChart } from '~/features/Toucan/Auction/ActivityTimeline/SimulationTab/SimulationChart'
import { computeSimulationResult } from '~/features/Toucan/Auction/ActivityTimeline/SimulationTab/utils/computeSimulationResult'
import { fromQ96ToDecimalWithTokenDecimals } from '~/features/Toucan/Auction/BidDistributionChart/utils/q96'
import { useBidTokenInfo } from '~/features/Toucan/Auction/hooks/useBidTokenInfo'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { formatTokenAmountWithSymbol } from '~/features/Toucan/Auction/utils/fixedPointFdv'
import { ExternalLink } from '~/theme/components/Links'

const DEFAULT_BUDGET_MULTIPLIER = 20

export function HowItWorksTab() {
  const { t } = useTranslation()
  const auctionDetails = useAuctionStore((state) => state.auctionDetails)
  const bidTokenDecimals = auctionDetails?.currencyTokenDecimals ?? 18
  const auctionTokenDecimals = auctionDetails?.tokenDecimals ?? 18
  const currencySymbol = auctionDetails?.currencyTokenSymbol ?? ''
  const tokenSymbol = auctionDetails?.tokenSymbol ?? ''

  const { bidTokenInfo } = useBidTokenInfo({
    bidTokenAddress: auctionDetails?.currency,
    chainId: auctionDetails?.chainId,
  })

  const totalSupplyDecimal = useMemo(() => {
    if (!auctionDetails?.totalSupply || !auctionTokenDecimals) {
      return 0
    }
    return Number(formatUnits(BigInt(auctionDetails.totalSupply), auctionTokenDecimals))
  }, [auctionDetails?.totalSupply, auctionTokenDecimals])

  // Compute anchor and floor prices (per-token, decimal)
  const { anchorPrice, floorPrice } = useMemo(() => {
    if (!auctionDetails?.floorPrice) {
      return { anchorPrice: 0, floorPrice: 0 }
    }
    const opts = { bidTokenDecimals, auctionTokenDecimals }
    const floor = fromQ96ToDecimalWithTokenDecimals({
      q96Value: auctionDetails.floorPrice,
      ...opts,
    })
    const clearingQ96 = auctionDetails.clearingPrice
    const anchor =
      clearingQ96 && BigInt(clearingQ96) > 0n
        ? fromQ96ToDecimalWithTokenDecimals({ q96Value: clearingQ96, ...opts })
        : floor
    return { anchorPrice: anchor, floorPrice: floor }
  }, [auctionDetails?.floorPrice, auctionDetails?.clearingPrice, bidTokenDecimals, auctionTokenDecimals])

  // FDV values
  const floorFDV = floorPrice * totalSupplyDecimal
  const anchorFDV = anchorPrice * totalSupplyDecimal

  // Static defaults: max FDV at anchor (or 2x floor), expected final at 2x max
  const defaultMaxFDV = anchorFDV > floorFDV ? anchorFDV : floorFDV * 2
  const minFDV = floorFDV * 1.01 || 0.000001
  const maxFDV = Math.max(defaultMaxFDV, minFDV)
  const expectedFinalFDV = Math.max(maxFDV * 2, minFDV)

  // Convert FDV back to per-token price for chart/simulation
  const maxTokenPrice = totalSupplyDecimal > 0 ? maxFDV / totalSupplyDecimal : 0
  const expectedFinalPrice = Math.max(
    totalSupplyDecimal > 0 ? expectedFinalFDV / totalSupplyDecimal : 0,
    floorPrice * 1.01 || 0.000001,
  )

  const maxBudgetValue = maxTokenPrice * DEFAULT_BUDGET_MULTIPLIER

  const simulation = useMemo(() => {
    const { tokensReceived, budgetSpent } = computeSimulationResult({
      currentPrice: maxTokenPrice,
      maxTokenPrice,
      floorPrice,
      expectedFinalPrice,
      budget: maxBudgetValue,
    })

    try {
      const tokensReceivedRaw = parseUnits(tokensReceived.toFixed(auctionTokenDecimals), auctionTokenDecimals)
      const budgetSpentRaw = parseUnits(budgetSpent.toFixed(bidTokenDecimals), bidTokenDecimals)
      return { tokensReceived: tokensReceivedRaw, budgetSpent: budgetSpentRaw }
    } catch {
      return { tokensReceived: 0n, budgetSpent: 0n }
    }
  }, [maxBudgetValue, maxTokenPrice, expectedFinalPrice, floorPrice, auctionTokenDecimals, bidTokenDecimals])

  const tokensReceivedFormatted = formatTokenAmountWithSymbol({
    raw: simulation.tokensReceived,
    decimals: auctionTokenDecimals,
    symbol: tokenSymbol,
  })

  const budgetSpentFormatted = formatTokenAmountWithSymbol({
    raw: simulation.budgetSpent,
    decimals: bidTokenDecimals,
    symbol: currencySymbol,
    isStablecoin: bidTokenInfo?.isStablecoin,
  })

  const { budgetFormatted, maxFdvFormatted } = useMemo(() => {
    try {
      const budgetRaw = parseUnits(maxBudgetValue.toFixed(bidTokenDecimals), bidTokenDecimals)
      const maxFdvRaw = parseUnits(maxFDV.toFixed(bidTokenDecimals), bidTokenDecimals)
      return {
        budgetFormatted: formatTokenAmountWithSymbol({
          raw: budgetRaw,
          decimals: bidTokenDecimals,
          symbol: currencySymbol,
          isStablecoin: bidTokenInfo?.isStablecoin,
        }),
        maxFdvFormatted: formatTokenAmountWithSymbol({
          raw: maxFdvRaw,
          decimals: bidTokenDecimals,
          symbol: currencySymbol,
          isStablecoin: bidTokenInfo?.isStablecoin,
        }),
      }
    } catch {
      return { budgetFormatted: '', maxFdvFormatted: '' }
    }
  }, [maxBudgetValue, maxFDV, bidTokenDecimals, currencySymbol, bidTokenInfo?.isStablecoin])

  return (
    <Flex px="$spacing24" pb="$spacing24" gap="$spacing16">
      <Text variant="body2" color="$neutral1">
        {t('toucan.simulation.description')}{' '}
        <ExternalLink href={uniswapUrls.helpArticleUrls.toucanBidHelp} style={{ textDecoration: 'none' }}>
          <Text variant="body2" color="$neutral2">
            {t('common.button.learn')}
          </Text>
        </ExternalLink>
      </Text>

      {/* Steps */}
      <Flex gap="$spacing24">
        <SimulationStep
          number={1}
          title={t('toucan.simulation.step1.title')}
          description={t('toucan.simulation.step1.description')}
        />
        <SimulationStep
          number={2}
          title={t('toucan.simulation.step2.title')}
          description={t('toucan.simulation.step2.description')}
        />
        <SimulationStep
          number={3}
          title={t('toucan.simulation.step3.title')}
          description={t('toucan.simulation.step3.description')}
        />
      </Flex>

      {/* Simulation card */}
      <Flex borderRadius="$rounded16" borderWidth={1} borderColor="$surface3" p="$spacing16" gap="$spacing12">
        <Flex gap="$spacing2">
          <Text variant="body3" color="$neutral1">
            {t('toucan.simulation.title')}
          </Text>
          <Text variant="body4" color="$neutral2">
            {t('toucan.simulation.exampleBid', { budget: budgetFormatted, maxFdv: maxFdvFormatted })}
          </Text>
        </Flex>

        {/* Chart */}
        <SimulationChart
          maxTokenPrice={maxTokenPrice}
          expectedFinalPrice={expectedFinalPrice}
          budget={maxBudgetValue}
          tokenSymbol={tokenSymbol}
        />

        {/* Summary stats */}
        <Flex row gap="$spacing16">
          <Flex flex={1} gap="$spacing4">
            <Text variant="body4" color="$neutral2">
              {t('toucan.simulation.tokensReceived')}
            </Text>
            <Text variant="subheading2" color="$neutral1">
              {tokensReceivedFormatted}
            </Text>
          </Flex>
          <Flex flex={1} gap="$spacing4">
            <Text variant="body4" color="$neutral2">
              {t('toucan.simulation.budgetSpent')}
            </Text>
            <Text variant="subheading2" color="$neutral1">
              {budgetSpentFormatted}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}

function SimulationStep({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <Flex row gap="$spacing12" alignItems="flex-start">
      <Flex
        width="$spacing24"
        height="$spacing24"
        borderRadius="$roundedFull"
        backgroundColor="$surface3"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
      >
        <Text variant="body3" color="$neutral2">
          {number}
        </Text>
      </Flex>
      <Flex flex={1} gap="$spacing4" pt="$spacing2">
        <Text variant="subheading2" color="$neutral1">
          {title}
        </Text>
        <Text variant="body3" color="$neutral2">
          {description}
        </Text>
      </Flex>
    </Flex>
  )
}
