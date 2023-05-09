import { Circle, Image, Stack, Text, XStack, YStack } from 'ui/src'
import { LinkButton } from 'ui/src/components/button/Button'
import { opacify } from 'ui/src/theme/color/utils'
import { iconSize } from 'ui/src/theme/tokens'
import {
  BOLT_ICON,
  BOOK_ICON,
  MULTICHAIN_ICON,
  UNISWAP_LOGO,
} from 'wallet/src/assets'

function InfoRow({
  primaryText,
  secondaryText,
  backgroundColor,
  icon,
}: {
  primaryText: string
  secondaryText: string
  backgroundColor: string
  icon: string
}): JSX.Element {
  return (
    <XStack alignItems="center" gap="$spacing12">
      <Stack alignItems="center" justifyContent="center">
        <Circle backgroundColor={backgroundColor} opacity={0.2} size={40} />
        <Image
          height={iconSize.icon20}
          position="absolute"
          source={{ uri: icon }}
          width={iconSize.icon20}
        />
      </Stack>
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
        <Stack
          alignItems="center"
          justifyContent="center"
          paddingBottom="$spacing8">
          <Stack
            alignItems="center"
            backgroundColor="$white"
            borderRadius="$rounded24"
            flexGrow={0}
            justifyContent="center"
            padding="$spacing12">
            <Image
              height={iconSize.icon64}
              source={UNISWAP_LOGO}
              theme="primary"
              width={iconSize.icon64}
            />
          </Stack>
        </Stack>
        <Text
          marginBottom="$spacing48"
          textAlign="center"
          variant="headlineMedium">
          Get started with Uniswap Wallet
        </Text>
        <LinkButton flexGrow={1} theme="secondary" to="import">
          I already have a wallet
        </LinkButton>
        <LinkButton flexGrow={1} theme="primary" to="create">
          Create a new wallet
        </LinkButton>
      </YStack>
      <YStack gap="$spacing24" justifyContent="center">
        <InfoRow
          backgroundColor={opacify(10, '$green200')}
          icon={BOLT_ICON}
          primaryText="Supercharge your swaps"
          secondaryText="1-click checkout"
        />
        <InfoRow
          backgroundColor="$pink200"
          icon={MULTICHAIN_ICON}
          primaryText="Multichain experience"
          secondaryText="Say goodbye to switching chains"
        />
        <InfoRow
          backgroundColor="$blue200"
          icon={BOOK_ICON}
          primaryText="Human readable transactions"
          secondaryText="Blockchain activity you can understand"
        />
      </YStack>
    </XStack>
  )
}
