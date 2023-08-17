import { getTokenValue, Icons, XStack, YStack } from 'ui/src'
import { Flex } from 'ui/src/components/layout/Flex'
import { Text } from 'ui/src/components/text/Text'
import { theme } from 'ui/src/theme/restyle/theme'
import { usePortfolioUSDBalance } from 'wallet/src/features/portfolio/hooks'

type WalletBalanceProps = {
  address: Address
}

export function PortfolioBalance({ address }: WalletBalanceProps): JSX.Element {
  const { portfolioBalanceUSD, portfolioChange, loading, error } = usePortfolioUSDBalance(address)

  // TODO (EXT-297): encapsulate to share better
  const change = portfolioChange ?? 0

  const isPositiveChange = change !== undefined ? change >= 0 : undefined
  const arrowColor = isPositiveChange ? theme.colors.statusSuccess : theme.colors.statusCritical

  const formattedChange = change !== undefined ? `${Math.abs(change).toFixed(2)}%` : '-'
  return (
    <Flex>
      {loading ? (
        <YStack>
          <Text color="$neutral3" fontWeight="600" variant="headlineLarge">
            $-,---.--
          </Text>
          <Text color="$neutral3" variant="bodyLarge">
            --%
          </Text>
        </YStack>
      ) : error ? (
        <Text color="$statusCritical" variant="bodyLarge">
          Error: {JSON.stringify(error)}
        </Text>
      ) : (
        <YStack gap="$spacing12">
          <YStack>
            <Text variant="headlineLarge">${portfolioBalanceUSD?.toFixed(2)}</Text>
            <XStack alignItems="center">
              <Icons.ArrowChange
                color={arrowColor}
                rotation={isPositiveChange ? 180 : 0}
                size={getTokenValue('$icon.20')}
              />
              <Text color="$neutral2" variant="bodyLarge">
                {/* TODO(EXT-298): add absolute change here too, share from mobile */}
                {formattedChange}
              </Text>
            </XStack>
          </YStack>
        </YStack>
      )}
    </Flex>
  )
}
