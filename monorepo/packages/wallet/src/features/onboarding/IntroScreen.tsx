import { Link } from 'react-router-dom'
import { Circle, Text, XStack, YStack } from 'ui/src'

function InfoRow({
  primaryText,
  secondaryText,
}: {
  primaryText: string
  secondaryText: string
}): JSX.Element {
  return (
    <XStack alignItems="center" gap="$spacing12">
      <Circle backgroundColor="black" size={40} />
      <YStack>
        <Text variant="subheadLarge">{primaryText}</Text>
        <Text color="$textTertiary" variant="bodySmall">
          {secondaryText}
        </Text>
      </YStack>
    </XStack>
  )
}

export function IntroScreen(): JSX.Element {
  return (
    <XStack gap={100}>
      <YStack gap="$spacing12" maxWidth={320}>
        <Text
          marginBottom="$spacing48"
          textAlign="center"
          variant="headlineMedium">
          Get started with Uniswap Wallet
        </Text>
        {/* TODO: add a styled link that looks like a button. */}
        <Link
          style={{
            display: 'flex',
            textDecoration: 'none',
          }}
          to="import">
          <Text
            backgroundColor="$background3"
            borderRadius="$rounded16"
            color="$textPrimary"
            flexGrow={1}
            padding="$spacing12"
            textAlign="center"
            variant="buttonLabelMedium">
            I already have a wallet
          </Text>
        </Link>
        <Link
          style={{
            display: 'flex',
            textDecoration: 'none',
          }}
          to="create">
          <Text
            backgroundColor="$magentaVibrant"
            borderRadius="$rounded16"
            color="$white"
            flexGrow={1}
            padding="$spacing12"
            textAlign="center"
            variant="buttonLabelMedium">
            Create a new wallet
          </Text>
        </Link>
      </YStack>
      <YStack gap="$spacing24" justifyContent="center">
        <InfoRow
          primaryText="Supercharge your swaps"
          secondaryText="1-click checkout"
        />
        <InfoRow
          primaryText="Multichain experience"
          secondaryText="Say goodbye to switching chains"
        />
        <InfoRow
          primaryText="Human readable transactions"
          secondaryText="No more hex codes"
        />
      </YStack>
    </XStack>
  )
}
