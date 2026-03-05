import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { ArrowUpCircle } from 'ui/src/components/icons/ArrowUpCircle'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { useBidStatusColors } from '~/components/Toucan/Auction/hooks/useBidStatusColors'
import { type BidDisplayState } from '~/components/Toucan/Auction/utils/bidDetails'

interface StatusIndicatorProps {
  displayState: BidDisplayState
}

export function StatusIndicator({ displayState }: StatusIndicatorProps): JSX.Element | null {
  const { t } = useTranslation()
  const { inRangeColor, outOfRangeColor } = useBidStatusColors()

  switch (displayState) {
    case 'pending':
      // Pending bids don't show status indicator in modal
      return null

    case 'fundsAvailable':
      return (
        <Flex row alignItems="center" gap="$spacing6">
          <Flex
            width={12}
            height={12}
            borderRadius="$roundedFull"
            alignItems="center"
            justifyContent="center"
            borderWidth={2}
            borderColor="$surface2"
          >
            <Flex width={6} height={6} borderRadius="$roundedFull" backgroundColor={outOfRangeColor} />
          </Flex>
          <Text variant="body3" color={outOfRangeColor}>
            {t('toucan.bidDetails.status.fundsAvailable')}
          </Text>
        </Flex>
      )

    case 'withdrawn':
      return (
        <Flex row alignItems="center" gap="$spacing6">
          <ArrowUpCircle size="$icon.16" color="$neutral2" />
          <Text variant="body3" color="$neutral2">
            {t('toucan.bidDetails.status.withdrawn')}
          </Text>
        </Flex>
      )

    case 'refundedInRange':
      // Refunded while in range - green dot with "In range" text
      return (
        <Flex row alignItems="center" gap="$spacing6">
          <Flex
            width={12}
            height={12}
            borderRadius="$roundedFull"
            alignItems="center"
            justifyContent="center"
            backgroundColor="$statusSuccess2"
          >
            <Flex width={8} height={8} borderRadius="$roundedFull" backgroundColor={inRangeColor} />
          </Flex>
          <Text variant="body3" color={inRangeColor}>
            {t('toucan.bidDetails.status.inRange')}
          </Text>
        </Flex>
      )

    case 'refundedOutOfRange':
      // Refunded while out of range - red dot with "Out of range" text
      return (
        <Flex row alignItems="center" gap="$spacing6">
          <Flex
            width={12}
            height={12}
            borderRadius="$roundedFull"
            alignItems="center"
            justifyContent="center"
            borderWidth={2}
            borderColor="$surface2"
          >
            <Flex width={6} height={6} borderRadius="$roundedFull" backgroundColor={outOfRangeColor} />
          </Flex>
          <Text variant="body3" color={outOfRangeColor}>
            {t('toucan.bidDetails.status.outOfRange')}
          </Text>
        </Flex>
      )

    case 'complete':
      return (
        <Flex row alignItems="center" gap="$spacing6">
          <CheckCircleFilled size="$icon.16" color={inRangeColor} />
          <Text variant="body3" color={inRangeColor}>
            {t('toucan.bidDetails.status.complete')}
          </Text>
        </Flex>
      )

    case 'inRange':
      return (
        <Flex row alignItems="center" gap="$spacing6">
          <Flex
            width={12}
            height={12}
            borderRadius="$roundedFull"
            alignItems="center"
            justifyContent="center"
            backgroundColor="$statusSuccess2"
          >
            <Flex width={8} height={8} borderRadius="$roundedFull" backgroundColor={inRangeColor} />
          </Flex>
          <Text variant="body3" color={inRangeColor}>
            {t('toucan.bidDetails.status.inRange')}
          </Text>
        </Flex>
      )

    case 'outOfRange':
      return (
        <Flex row alignItems="center" gap="$spacing6">
          <Flex
            width={12}
            height={12}
            borderRadius="$roundedFull"
            alignItems="center"
            justifyContent="center"
            borderWidth={2}
            borderColor="$surface2"
          >
            <Flex width={6} height={6} borderRadius="$roundedFull" backgroundColor={outOfRangeColor} />
          </Flex>
          <Text variant="body3" color={outOfRangeColor}>
            {t('toucan.bidDetails.status.outOfRange')}
          </Text>
        </Flex>
      )
  }
}
