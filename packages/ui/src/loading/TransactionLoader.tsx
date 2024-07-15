import { Flex } from 'ui/src/components/layout/Flex'
import { Text } from 'ui/src/components/text/Text'
import { iconSizes } from 'ui/src/theme/iconSizes'

interface TransactionLoaderProps {
  opacity: number
}

export const TXN_HISTORY_LOADER_ICON_SIZE = iconSizes.icon40

export function TransactionLoader({ opacity }: TransactionLoaderProps): JSX.Element {
  return (
    <Flex opacity={opacity} overflow="hidden" sentry-label="TransactionLoader">
      <Flex
        grow
        row
        alignItems="flex-start"
        gap="$spacing16"
        justifyContent="space-between"
        py="$spacing12">
        <Flex
          row
          shrink
          alignItems="center"
          gap="$spacing12"
          height="100%"
          justifyContent="flex-start">
          <Flex
            centered
            backgroundColor="$surface2"
            borderRadius="$roundedFull"
            height={TXN_HISTORY_LOADER_ICON_SIZE}
            width={TXN_HISTORY_LOADER_ICON_SIZE}
          />
          <Flex shrink>
            <Flex row alignItems="center" gap="$spacing4">
              <Text
                loading
                loadingPlaceholderText="Contract Interaction"
                numberOfLines={1}
                variant="body1"
              />
            </Flex>
            <Text
              loading
              color="$neutral2"
              loadingPlaceholderText="Caption Text"
              numberOfLines={1}
              variant="subheading2"
            />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
