import { namedIconSizes, Text, validToken } from 'ui/src'
import { Flex } from 'ui/src/components/layout/Flex'

interface TransactionLoaderProps {
  opacity: number
}

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
            bg="$background3"
            borderRadius="$roundedFull"
            height={validToken(namedIconSizes.transactionHistory)}
            width={validToken(namedIconSizes.transactionHistory)}
          />
          <Flex shrink gap="$none">
            <Flex row alignItems="center" gap="$spacing4">
              <Text
                loading
                loadingPlaceholderText="Contract Interaction"
                numberOfLines={1}
                variant="bodyLarge"
              />
            </Flex>
            <Text
              loading
              color="$textSecondary"
              loadingPlaceholderText="Caption Text"
              numberOfLines={1}
              variant="subheadSmall"
            />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
