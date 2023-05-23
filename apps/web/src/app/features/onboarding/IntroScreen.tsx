import { Circle, Image, Stack, Text, XStack, YStack } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import BoltIcon from 'ui/src/assets/icons/bolt.svg'
import BookIcon from 'ui/src/assets/icons/book.svg'
import MultichainIcon from 'ui/src/assets/icons/multichain.svg'
import { LinkButton } from 'ui/src/components/button/Button'
import { Flex } from 'ui/src/components/layout/Flex'
import { opacify } from 'ui/src/theme/color/utils'
import { iconSize } from 'ui/src/theme/tokens'

function InfoRow({
  primaryText,
  secondaryText,
  backgroundColor,
  icon,
}: {
  primaryText: string
  secondaryText: string
  backgroundColor: string
  icon: JSX.Element
}): JSX.Element {
  return (
    <XStack alignItems="center" gap="$spacing12">
      <Stack alignItems="center" justifyContent="center">
        <Circle backgroundColor={backgroundColor} opacity={0.2} size={40} />
        <Flex
          alignItems="center"
          height={40}
          justifyContent="center"
          position="absolute"
          width={40}>
          {icon}
        </Flex>
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
        <Stack alignItems="center" justifyContent="center" paddingBottom="$spacing8">
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
        <Text marginBottom="$spacing48" textAlign="center" variant="headlineMedium">
          Get started with Uniswap Wallet
        </Text>
        <LinkButton flexGrow={1} theme="secondary" to="import">
          I already have a wallet
        </LinkButton>
        <LinkButton flexGrow={1} theme="primary" to="create">
          Create a new wallet
        </LinkButton>
      </YStack>
      <YStack alignItems="flex-start" gap="$spacing24" justifyContent="center">
        <InfoRow
          backgroundColor={opacify(10, '$green200')}
          icon={<BoltIcon height={iconSize.icon20} width={iconSize.icon20} />}
          primaryText="Supercharge your swaps"
          secondaryText="1-click checkout"
        />
        <InfoRow
          backgroundColor="$pink200"
          icon={<MultichainIcon width={iconSize.icon20} />}
          primaryText="Multichain experience"
          secondaryText="Say goodbye to switching chains"
        />
        <InfoRow
          backgroundColor="$blue200"
          icon={<BookIcon height={iconSize.icon20} width={iconSize.icon20} />}
          primaryText="Human readable transactions"
          secondaryText="Blockchain activity you can understand"
        />
      </YStack>
    </XStack>
  )
}
