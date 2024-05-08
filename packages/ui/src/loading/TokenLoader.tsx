import { Flex } from 'ui/src/components/layout'
import { Text } from 'ui/src/components/text'
import { iconSizes } from 'ui/src/theme'

interface TokenLoaderProps {
  opacity: number
  withPrice?: boolean
}

const TOKEN_BALANCE_ITEM_HEIGHT = 56

export function TokenLoader({ opacity, withPrice = false }: TokenLoaderProps): JSX.Element {
  return (
    <Flex
      alignItems="flex-start"
      flexDirection="row"
      justifyContent="space-between"
      minHeight={TOKEN_BALANCE_ITEM_HEIGHT}
      opacity={opacity}
      py="$spacing8">
      <Flex grow row alignItems="center" gap="$spacing12" overflow="hidden">
        <Flex
          backgroundColor="$neutral3"
          borderRadius="$roundedFull"
          minHeight={iconSizes.icon40}
          minWidth={iconSizes.icon40}
        />

        <Flex grow alignItems="flex-start">
          <Text
            loading="no-shimmer"
            loadingPlaceholderText="Token Full Name"
            numberOfLines={1}
            variant="body1"
          />
          <Flex row alignItems="center" gap="$spacing8" minHeight={20}>
            <Text
              loading="no-shimmer"
              loadingPlaceholderText="1,000 TFN"
              numberOfLines={1}
              variant="subheading2"
            />
          </Flex>
        </Flex>

        {withPrice && (
          <Flex alignItems="flex-end">
            <Text
              loading="no-shimmer"
              loadingPlaceholderText="$XX.XX"
              numberOfLines={1}
              variant="body1"
            />
            <Flex row alignItems="center" gap="$spacing8" minHeight={20}>
              <Text
                loading="no-shimmer"
                loadingPlaceholderText="X.XX%"
                numberOfLines={1}
                variant="subheading2"
              />
            </Flex>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
