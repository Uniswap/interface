import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, styled, Text } from 'ui/src'

interface BidReceiveOutputProps {
  expectedAmount?: number
  minExpectedAmount?: number
  maxAvailableAmount?: number
  tokenSymbol?: string
}

const Container = styled(Flex, {
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'flex-start',
  gap: '$spacing2',
  paddingVertical: '$spacing12',
  paddingHorizontal: '$spacing16',
  borderRadius: '$rounded20',
  borderWidth: 1,
  borderColor: '$surface2',
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

export function BidReceiveOutput({
  expectedAmount,
  minExpectedAmount,
  maxAvailableAmount,
  tokenSymbol,
}: BidReceiveOutputProps): JSX.Element {
  const { t } = useTranslation()
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

  return (
    <Container isEmpty={isEmpty}>
      <Flex justifyContent="center" alignItems="flex-start">
        <Text variant="body4" color="$neutral2">
          {t('toucan.bidForm.receive')}
        </Text>
      </Flex>
      <Flex
        flexDirection="row"
        alignItems="center"
        justifyContent="flex-start"
        width="100%"
        height={isEmpty ? 36 : undefined}
        overflow="hidden"
      >
        {isEmpty ? (
          <Text variant="body1" color="$neutral3" width="100%">
            {t('toucan.bidForm.enterBudgetTokenPrice')}
          </Text>
        ) : (
          <Flex flexDirection="row" gap="$spacing4" width="100%">
            <Text variant="body1" color="$neutral1">
              {formattedAmount}
            </Text>
            {tokenSymbol && (
              <Text variant="body1" color="$neutral2">
                {tokenSymbol}
              </Text>
            )}
          </Flex>
        )}
      </Flex>
    </Container>
  )
}
