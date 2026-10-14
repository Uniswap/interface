import { Flex, type FlexCompatProps, Text } from '@universe/mycelium'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { formatNumberWithSubscript } from 'utilities/src/format/subscriptNotation'
import { useAuctionValueFormatters } from '~/features/Toucan/Auction/hooks/useAuctionValueFormatters'
import { useBidTokenInfo } from '~/features/Toucan/Auction/hooks/useBidTokenInfo'
import { useIsQuickLaunchAuction } from '~/features/Toucan/Auction/hooks/useIsQuickLaunchAuction'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { getAuctionTokenDecimals } from '~/features/Toucan/Auction/utils/tokenMetadata'

interface BidReceiveOutputProps {
  expectedAmount?: number
  minExpectedAmount?: number
  maxAvailableAmount?: number
  tokenSymbol?: string
  maxPriceQ96?: bigint
  bidTokenDecimals?: number
  budgetAmount?: number
  bidTokenSymbol?: string
}

const Container = (props: FlexCompatProps): JSX.Element => (
  <Flex
    alignItems="flex-start"
    gap="$spacing2"
    paddingVertical="$spacing12"
    paddingHorizontal="$spacing16"
    borderWidth={1}
    borderColor="$surface3"
    width="100%"
    {...props}
  />
)

/**
 * Below this, fixed-decimal formatting collapses small values to "0.00" — a per-token price of
 * 6.3e-9 ETH is not zero, and rendering it as one misstates the bid. Values under the threshold
 * go through the shared Unicode-subscript formatter instead (e.g. "0.0₈63").
 */
const SUBSCRIPT_AMOUNT_THRESHOLD = 0.01

function formatAmount({ amount, locale }: { amount: number; locale: string }): string {
  if (amount === 0) {
    return '0'
  }

  // Every amount reaching here is non-negative (budgets, clamped fill amounts, and the price per
  // token derived from them), so the subscript formatter's magnitude-only output is faithful.
  if (amount < SUBSCRIPT_AMOUNT_THRESHOLD) {
    return formatNumberWithSubscript({ value: amount, locale })
  }

  return amount.toLocaleString(locale, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })
}

const Divider = (props: FlexCompatProps): JSX.Element => (
  <Flex height={1} width="100%" backgroundColor="$surface3" {...props} />
)

export function BidReceiveOutput({
  expectedAmount,
  minExpectedAmount,
  maxAvailableAmount,
  tokenSymbol,
  maxPriceQ96,
  bidTokenDecimals,
  budgetAmount,
  bidTokenSymbol,
}: BidReceiveOutputProps): JSX.Element {
  const { t } = useTranslation()
  const locale = useCurrentLocale()
  const [isExpanded, setIsExpanded] = useState(false)

  // QuickLaunch: no max-FDV input — the bid's ceiling is the synthetic 25,000 ETH FDV cap (no
  // longer a 50x-of-reference cap), not a user choice, so the min-receive range and the
  // partial-fill explainer don't apply, and the placeholder only mentions a budget.
  const isQuickLaunch = useIsQuickLaunchAuction()

  const chainId = useAuctionStore((state) => state.auctionDetails?.chainId)
  const currency = useAuctionStore((state) => state.auctionDetails?.currency)
  const tokenTotalSupply = useAuctionStore((state) => state.auctionDetails?.tokenTotalSupply)
  const auctionTokenDecimals = useAuctionStore((state) => getAuctionTokenDecimals(state.auctionDetails?.token))

  const { bidTokenInfo } = useBidTokenInfo({ bidTokenAddress: currency, chainId })

  const { formatPrice } = useAuctionValueFormatters({
    bidTokenInfo: bidTokenInfo ?? { symbol: '', decimals: 0, priceFiat: 0, isStablecoin: false, logoUrl: null },
    totalSupply: tokenTotalSupply,
    auctionTokenDecimals,
  })

  const maxFdvFormatted = useMemo(() => {
    if (!maxPriceQ96 || bidTokenDecimals === undefined) {
      return undefined
    }
    return formatPrice(maxPriceQ96.toString(), bidTokenDecimals)
  }, [maxPriceQ96, bidTokenDecimals, formatPrice])
  const formattedAmount = useMemo(() => {
    if (expectedAmount === undefined) {
      return undefined
    }

    const cappedMaxAvailable = maxAvailableAmount !== undefined ? Math.max(0, maxAvailableAmount) : undefined
    const cappedMax = cappedMaxAvailable !== undefined ? Math.min(expectedAmount, cappedMaxAvailable) : expectedAmount
    const cappedMinRaw = isQuickLaunch ? undefined : minExpectedAmount
    const cappedMin =
      cappedMaxAvailable !== undefined && cappedMinRaw !== undefined
        ? Math.min(cappedMinRaw, cappedMaxAvailable)
        : cappedMinRaw
    const safeMin = cappedMin !== undefined ? Math.min(cappedMin, cappedMax) : undefined

    const maxFormatted = formatAmount({ amount: cappedMax, locale })

    // Show range if minExpectedAmount is different from expectedAmount
    if (safeMin !== undefined && safeMin !== cappedMax) {
      const minFormatted = formatAmount({ amount: safeMin, locale })
      return `${minFormatted} - ${maxFormatted}`
    }

    return maxFormatted
  }, [expectedAmount, maxAvailableAmount, minExpectedAmount, isQuickLaunch, locale])

  const isEmpty = expectedAmount === undefined

  const pricePerToken = useMemo(() => {
    if (budgetAmount === undefined || expectedAmount === undefined || expectedAmount === 0) {
      return undefined
    }
    return formatAmount({ amount: budgetAmount / expectedAmount, locale })
  }, [budgetAmount, expectedAmount, locale])

  const showExpandable = !isQuickLaunch && !isEmpty && maxFdvFormatted && pricePerToken

  return (
    <Container justifyContent="space-between" flexDirection="column" borderRadius="$rounded12">
      <Flex
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        width="100%"
        cursor={showExpandable ? 'pointer' : undefined}
        onPress={showExpandable ? () => setIsExpanded((prev) => !prev) : undefined}
      >
        <Flex justifyContent="center" alignItems="flex-start">
          <Text variant="body4" color="$neutral2">
            {t('toucan.bidForm.receive')}
          </Text>
        </Flex>
        <Flex flexDirection="row" alignItems="center" gap="$spacing8">
          <Flex flexDirection="row" alignItems="center" justifyContent="flex-start" width="auto" overflow="hidden">
            {isEmpty ? (
              <Text variant="body4" color="$neutral3" width="100%">
                {isQuickLaunch ? t('toucan.bidForm.enterBudget') : t('toucan.bidForm.enterBudgetMaxFdv')}
              </Text>
            ) : (
              <Flex flexDirection="row" gap="$spacing4" width="100%">
                <Text variant="body4" color="$neutral1">
                  {formattedAmount}
                </Text>
                {tokenSymbol && (
                  <Text variant="body4" color="$neutral1">
                    {tokenSymbol}
                  </Text>
                )}
              </Flex>
            )}
          </Flex>
          {showExpandable && (
            <RotatableChevron direction={isExpanded ? 'up' : 'down'} color="$neutral2" size="$icon.16" />
          )}
        </Flex>
      </Flex>
      {showExpandable && isExpanded && (
        <Flex width="100%">
          <Divider my="$spacing4" />
          <Text variant="body4" color="$neutral2">
            <Trans
              i18nKey="toucan.bidReview.partialFillExplanation"
              values={{
                symbol: tokenSymbol,
                maxFdv: maxFdvFormatted,
                maxFdvFiat: `${pricePerToken} ${bidTokenSymbol}/token`,
              }}
              components={{
                highlight: <Text variant="body4" color="$neutral1" tag="span" />,
                fiat: <Text variant="body4" color="$neutral2" tag="span" />,
              }}
            />
          </Text>
        </Flex>
      )}
    </Container>
  )
}
