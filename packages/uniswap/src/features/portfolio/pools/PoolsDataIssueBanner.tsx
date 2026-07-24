import { Flex, Text, TouchableArea } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { Clear } from 'ui/src/components/icons/Clear'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

interface PoolsDataIssueBannerProps {
  message: string
  /** When provided, renders a close button. Omit for a non-dismissible (full-outage) banner. */
  onDismiss?: () => void
  /** Edge-to-edge variant (squared corners, wider padding) for screens where the banner spans the full width. */
  fullWidth?: boolean
}

export function PoolsDataIssueBanner({ message, onDismiss, fullWidth }: PoolsDataIssueBannerProps): JSX.Element {
  return (
    <Flex
      row
      alignItems="flex-start"
      gap="$spacing12"
      backgroundColor="$surface2"
      borderRadius={fullWidth ? '$none' : '$rounded16'}
      px={fullWidth ? '$spacing24' : '$spacing16'}
      py="$spacing12"
      testID={TestID.PoolsDataIssueBanner}
    >
      <AlertTriangleFilled flexShrink={0} color="$neutral2" size="$icon.20" />
      <Text variant="body3" color="$neutral2" flex={1}>
        {message}
      </Text>
      {onDismiss && (
        <TouchableArea flexShrink={0} testID={TestID.PoolsDataIssueBannerDismiss} onPress={onDismiss}>
          <Clear size="$icon.20" color="$neutral3" hoverColor="$neutral3Hovered" />
        </TouchableArea>
      )}
    </Flex>
  )
}
