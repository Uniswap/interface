import { useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, styled, Text } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { useAuctionValueFormatters } from '~/features/Toucan/Auction/hooks/useAuctionValueFormatters'
import { useBidTokenInfo } from '~/features/Toucan/Auction/hooks/useBidTokenInfo'
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

const Container = styled(Flex, {
  alignItems: 'flex-start',
  gap: '$spacing2',
  paddingVertical: '$spacing12',
  paddingHorizontal: '$spacing16',
  borderWidth: 1,
  borderColor: '$surface3',
  width: '100%',
  variants: {
    isEmpty: {
      true: {
        borderColor: '$surface3',
      },
    },
  },
})

function formatAmount(amount: number): string {
  if (amount === 0) {
    return '0'
  }

  if (amount < 0.01) {
    // Show up to 6 decimals for small amounts
    return amount.toLocaleString('en-US', {
      maximumFractionDigits: 6,
      minimumFractionDigits: 2,
    })
  }

  return amount.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })
}

const Divider = styled(Flex, {
  height: 1,
  width: '100%',
  backgroundColor: '$surface3',
})

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
  const [isExpanded, setIsExpanded] = useState(false)

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
    const cappedMinRaw = minExpectedAmount
    const cappedMin =
      cappedMaxAvailable !== undefined && cappedMinRaw !== undefined
        ? Math.min(cappedMinRaw, cappedMaxAvailable)
        : cappedMinRaw
    const safeMin = cappedMin !== undefined ? Math.min(cappedMin, cappedMax) : undefined

    const maxFormatted = formatAmount(cappedMax)

    // Show range if minExpectedAmount is different from expectedAmount
    if (safeMin !== undefined && safeMin !== cappedMax) {
      const minFormatted = formatAmount(safeMin)
      return `${minFormatted} - ${maxFormatted}`
    }

    return maxFormatted
  }, [expectedAmount, maxAvailableAmount, minExpectedAmount])

  const isEmpty = expectedAmount === undefined

  const pricePerToken = useMemo(() => {
    if (budgetAmount === undefined || expectedAmount === undefined || expectedAmount === 0) {
      return undefined
    }
    return formatAmount(budgetAmount / expectedAmount)
  }, [budgetAmount, expectedAmount])

  const showExpandable = !isEmpty && maxFdvFormatted && pricePerToken

  return (
    <Container isEmpty={isEmpty} justifyContent="space-between" flexDirection="column" borderRadius="$rounded12">
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
                {t('toucan.bidForm.enterBudgetMaxFdv')}
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
