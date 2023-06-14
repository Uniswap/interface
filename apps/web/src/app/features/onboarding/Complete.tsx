import { useEffect, useState } from 'react'
import { Circle, Image, Stack, Theme, XStack, YStack } from 'tamagui'
import { Text } from 'ui'
import { UNISWAP_LOGO } from 'ui/assets'
import MoreIcon from 'ui/assets/icons/more.svg'
import PinIcon from 'ui/assets/icons/pin.svg'
import { PuzzleIcon } from 'ui/assets/icons/PuzzleIcon'
import { Button } from 'ui/components/button/Button'
import { Flex } from 'ui/components/layout/Flex'
import { Unicon } from 'ui/components/Unicon'
import { iconSizes } from 'ui/theme/iconSizes'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { sanitizeAddressText, shortenAddress } from 'wallet/src/utils/addresses'

const POPUP_WIDTH = 400
const POPUP_OFFSET = 20
const POPUP_ARROW_WIDTH = 24
const POPUP_ARROW_OFFSET = 115
const POPUP_SHADOW_RADIUS = 1000

const PINNED_CHECK_FREQUENCY_IN_MS = 750

export function Complete(): JSX.Element {
  const address = useActiveAccountAddressWithThrow()

  if (!address) {
    throw new Error('No address found')
  }

  const [isPinned, setIsPinned] = useState<null | boolean>(null)

  useEffect(() => {
    const isExtensionPinned = async (): Promise<void> => {
      const settings = await chrome.action.getUserSettings()
      setIsPinned(settings.isOnToolbar)
    }

    // there's no way to listen to the extension pinning status,
    // so check every [PINNED_CHECK_FREQUENCY_IN_MS]ms during this step if it's pinned
    // TODO: use useInterval hook once migrated to wallet package
    const intervalId = setInterval(isExtensionPinned, PINNED_CHECK_FREQUENCY_IN_MS)
    return () => {
      clearInterval(intervalId)
    }
  }, [])
  return (
    <>
      <Stack alignItems="center" minWidth={450}>
        <YStack gap="$spacing12">
          <YStack alignItems="center" gap="$spacing12">
            {/* TODO: use AddressDisplay here */}
            <Unicon address={address} size={iconSizes.icon64} />
            <Text color="$textPrimary" variant="headlineLarge">
              Wallet 1
            </Text>
            <Text color="$textSecondary" variant="subheadSmall">
              {sanitizeAddressText(shortenAddress(address))}
            </Text>
          </YStack>
          <XStack gap="$spacing12" paddingVertical="$spacing36">
            {/* TODO: add 3 action buttons: Swap, Buy crypto, Take a tour */}
            <Text color="$secondary" variant="buttonLabelMedium">
              {/* this copy is just a placeholder and will be replaced by action buttons */}
              All set! Don't forget to pin the extension in your browser.
            </Text>
          </XStack>
          <Button flexGrow={1} theme="secondary" onPress={(): void => window.close()}>
            Close
          </Button>
        </YStack>
      </Stack>
      {!isPinned ? (
        // extension is not pinned, show reminder popup
        // TODO: try using Tamagui Popover component here
        <Stack position="absolute" right={0} top={0}>
          {/* pinning reminder popup container */}
          <Stack
            backgroundColor="$background2"
            borderRadius="$rounded20"
            gap="$spacing24"
            marginRight={POPUP_OFFSET}
            marginTop={POPUP_OFFSET}
            padding="$spacing24"
            // TODO(EXT-141): revisit design of shadow (tweak color, figure out why opacity doesn't apply, tweak radius)
            shadowColor="$textTertiary"
            shadowRadius={POPUP_SHADOW_RADIUS}
            width={POPUP_WIDTH}>
            {/* arrow pointer attached to popup box */}
            <Stack
              backgroundColor="$background2"
              height={POPUP_ARROW_WIDTH}
              position="absolute"
              right={POPUP_ARROW_OFFSET}
              rotate="45deg"
              top={-POPUP_ARROW_WIDTH / 2}
              width={POPUP_ARROW_WIDTH}
              zIndex={999999}
            />
            {/* heading and puzzle icon */}
            <Stack gap="$spacing2">
              <Text numberOfLines={1} variant="bodySmall">
                Pin the extension to your browser window
              </Text>
              <XStack alignItems="center" gap="$spacing8">
                <Text numberOfLines={1} variant="bodySmall">
                  by clicking on the
                </Text>
                <Theme name="branded">
                  <PuzzleIcon />
                </Theme>
                <Text numberOfLines={1} variant="bodySmall">
                  icon, and then the pin
                </Text>
              </XStack>
            </Stack>
            {/* mocked extension list item container */}
            <XStack
              alignItems="center"
              backgroundColor="$background0"
              borderRadius="$rounded4"
              paddingHorizontal="$spacing12"
              paddingVertical="$spacing8">
              {/* mocked extension icon and name */}
              <XStack alignItems="center" flexGrow={1} gap="$spacing12" justifyContent="flex-start">
                {/* mocked extension icon */}
                <Stack
                  alignItems="center"
                  backgroundColor="$white"
                  borderRadius="$roundedFull"
                  flexGrow={0}
                  justifyContent="center"
                  padding="$spacing4">
                  <Image
                    height={iconSizes.icon24}
                    source={UNISWAP_LOGO}
                    theme="primary"
                    width={iconSizes.icon24}
                  />
                </Stack>
                {/* mocked extension list item name */}
                <Text variant="bodyLarge">Uniswap Wallet</Text>
              </XStack>
              {/* mocked extension list item pin button and more icon container */}
              <XStack alignItems="center" gap="$spacing12">
                {/* mocked extension list item pin button */}
                <Stack alignItems="center" justifyContent="center">
                  <Circle backgroundColor="$accentBranded" opacity={0.25} size={40} />
                  <Flex
                    alignItems="center"
                    height={40}
                    justifyContent="center"
                    position="absolute"
                    width={40}>
                    <PinIcon height={iconSizes.icon20} width={iconSizes.icon20} />
                  </Flex>
                </Stack>
                {/* mocked extension list item more icon */}
                <MoreIcon height={iconSizes.icon20} width={iconSizes.icon20} />
              </XStack>
            </XStack>
          </Stack>
        </Stack>
      ) : (
        // extension was pinned, show success message
        <Stack position="absolute" top={10} width={360}>
          <Stack
            alignItems="center"
            backgroundColor="$background2"
            borderColor="$backgroundOutline"
            borderRadius="$roundedFull"
            borderWidth={1}
            display="flex"
            flexDirection="row"
            gap="$spacing4"
            justifyContent="center"
            opacity={0.9}
            paddingHorizontal="$spacing24"
            paddingVertical="$spacing12">
            <Text variant="subheadSmall">✅ Awesome! It's safe to close this tab now.</Text>
          </Stack>
        </Stack>
      )}
    </>
  )
}
