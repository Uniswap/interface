import { Toast } from '@tamagui/toast'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ONBOARDING_CONTENT_WIDTH } from 'src/app/features/onboarding/utils'
import { Circle, Image, Stack, XStack, YStack } from 'tamagui'
import { ColorTokens, Flex, Icons, Text, Unicon } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import MoreIcon from 'ui/src/assets/icons/more.svg'
import PinIcon from 'ui/src/assets/icons/pin.svg'
import { iconSizes, opacify, validToken } from 'ui/src/theme'
import { useInterval } from 'utilities/src/time/timing'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { useActiveAccountAddressWithThrow, useDisplayName } from 'wallet/src/features/wallet/hooks'
import { sanitizeAddressText, shortenAddress } from 'wallet/src/utils/addresses'

const POPUP_WIDTH = 400
const POPUP_OFFSET = 20
const POPUP_SHADOW_RADIUS = 1000

const PINNED_CHECK_FREQUENCY_IN_MS = 750

// TODO(spore): replace with proper themed colors
const ONBOARDING_COLORS = {
  GREEN: '#00D395',
  BLUE: '#12AAFF',
  PINK: '#FD82FF',
  YELLOW: '#E8A803',
}

const ONBOARDING_COLORS_SOFT = {
  GREEN: opacify(20, ONBOARDING_COLORS.GREEN),
  BLUE: opacify(20, ONBOARDING_COLORS.BLUE),
  PINK: opacify(20, ONBOARDING_COLORS.PINK),
  YELLOW: opacify(20, ONBOARDING_COLORS.YELLOW),
}

export function Complete(): JSX.Element {
  const address = useActiveAccountAddressWithThrow()
  const { t } = useTranslation()
  const nickname = useDisplayName(address)?.name

  if (!address) {
    throw new Error('No address found')
  }

  // We set the initial state to undefined to avoid the wrong message flickering when the component remounts
  const [isPinned, setIsPinned] = useState<boolean | undefined>(undefined)

  const isExtensionPinned = async (): Promise<void> => {
    const settings = await chrome.action.getUserSettings()
    setIsPinned(settings.isOnToolbar)
  }

  // there's no way to listen to the extension pinning status,
  // so check every [PINNED_CHECK_FREQUENCY_IN_MS]ms during this step if it's pinned
  useInterval(isExtensionPinned, PINNED_CHECK_FREQUENCY_IN_MS)

  return (
    <>
      <Stack alignItems="center" width={ONBOARDING_CONTENT_WIDTH}>
        <YStack gap="$spacing12">
          <YStack alignItems="center" gap="$spacing12">
            <YStack alignItems="center" gap="$spacing24">
              {/* TODO: use AddressDisplay here */}
              <Unicon address={address} size={iconSizes.icon64} />
              <Text color="$neutral1" variant="headlineLarge">
                {nickname}
              </Text>
            </YStack>
            <Text color="$neutral2" variant="subheadSmall">
              {sanitizeAddressText(shortenAddress(address))}
            </Text>
          </YStack>
          <YStack gap="$spacing12" paddingVertical="$spacing36">
            <XStack gap="$spacing12">
              {/* TODO(EXT-210): clean up use of colors here and just pass color value */}
              <OnboardingCompleteCard
                Icon={<Icons.Buy color={ONBOARDING_COLORS.GREEN} size={iconSizes.icon20} />}
                backgroundColor={validToken(ONBOARDING_COLORS_SOFT.GREEN)}
                color={validToken(ONBOARDING_COLORS.GREEN)}
                title="Buy crypto"
                url={uniswapUrls.moonpayHelpUrl}
              />
              <OnboardingCompleteCard
                disabled
                Icon={<Icons.ArrowDown color={ONBOARDING_COLORS.BLUE} size={iconSizes.icon20} />}
                backgroundColor={validToken(ONBOARDING_COLORS_SOFT.BLUE)}
                color={validToken(ONBOARDING_COLORS.BLUE)}
                title="Transfer from exchange"
                url={uniswapUrls.interfaceUrl}
              />
            </XStack>
            <XStack gap="$spacing12">
              <OnboardingCompleteCard
                Icon={
                  <Icons.SwapActionButton color={ONBOARDING_COLORS.PINK} size={iconSizes.icon20} />
                }
                backgroundColor={validToken(ONBOARDING_COLORS_SOFT.PINK)}
                color={validToken(ONBOARDING_COLORS.PINK)}
                title="Swap"
                url={uniswapUrls.interfaceUrl}
              />
              <OnboardingCompleteCard
                disabled
                Icon={<Icons.BookOpen color={ONBOARDING_COLORS.YELLOW} size={iconSizes.icon20} />}
                backgroundColor={validToken(ONBOARDING_COLORS_SOFT.YELLOW)}
                color={validToken(ONBOARDING_COLORS.YELLOW)}
                title="Take a tour"
                url={uniswapUrls.interfaceUrl}
              />
            </XStack>
          </YStack>
        </YStack>
      </Stack>

      {/* check for false because !isPinned will trigger on undefined, and since that's what the value gets initialized as */}
      {/* it would flicker with a false positive before it can check if it's pinned or not */}
      {isPinned === false && (
        // extension is not pinned, show reminder popup
        // TODO: try using Tamagui Popover component here
        <Stack position="absolute" right={0} top={-60}>
          {/* pinning reminder popup container */}
          <Stack
            backgroundColor="$surface2"
            borderRadius="$rounded20"
            gap="$spacing24"
            marginRight={POPUP_OFFSET}
            marginTop={POPUP_OFFSET}
            padding="$spacing24"
            // TODO(EXT-141): revisit design of shadow (tweak color, figure out why opacity doesn't apply, tweak radius)
            shadowColor="$neutral3"
            shadowRadius={POPUP_SHADOW_RADIUS}
            width={POPUP_WIDTH}>
            {/* heading and puzzle icon */}
            <Stack gap="$spacing2">
              <Text numberOfLines={1} variant="bodySmall">
                Pin the extension to your browser window
              </Text>
              <XStack alignItems="center" gap="$spacing8">
                <Text numberOfLines={1} variant="bodySmall">
                  by clicking on the
                </Text>
                {/* TODO(EXT-210): constant icon sizes */}
                <Icons.Puzzle color="$accent1" size={iconSizes.icon20} />
                <Text numberOfLines={1} variant="bodySmall">
                  icon, and then the pin
                </Text>
              </XStack>
            </Stack>
            {/* mocked extension list item container */}
            <XStack
              alignItems="center"
              backgroundColor="$surface1"
              borderRadius="$rounded4"
              paddingHorizontal="$spacing12"
              paddingVertical="$spacing8">
              {/* mocked extension icon and name */}
              <XStack alignItems="center" flexGrow={1} gap="$spacing12" justifyContent="flex-start">
                {/* mocked extension icon */}
                <Stack
                  alignItems="center"
                  backgroundColor="$sporeWhite"
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
                  <Circle backgroundColor="$DEP_accentBranded" opacity={0.25} size={40} />
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
      )}

      {/* this and the condition above are separated out as two separate conditions that check for false and true respectively */}
      {/* instead of as a ternary, because we initialize the value as undefined instead of false, to avoid a flicker on re-render */}
      {isPinned && (
        <Toast
          backgroundColor="$surface2"
          borderColor="$surface3"
          borderRadius="$roundedFull"
          borderWidth={1}
          duration={30_000}
          gap="$spacing4"
          justifyContent="center"
          marginTop="$spacing12"
          opacity={0.9}
          open={true}
          paddingHorizontal="$spacing36"
          paddingVertical="$spacing24"
          viewportName="onboarding">
          <Toast.Title alignItems="center" display="flex" flexDirection="row" gap="$spacing8">
            <Icons.Checkmark color="$statusSuccess" size={iconSizes.icon24} />
            <Text variant="bodyLarge">{t('Pinned! It’s safe to close this tab now')}</Text>
          </Toast.Title>
        </Toast>
      )}
    </>
  )
}

interface OnboardingCompleteCardProps {
  title: string
  url: string
  Icon: JSX.Element
  backgroundColor: ColorTokens
  color: ColorTokens
  disabled?: boolean
}

const linkStyles = {
  textDecoration: 'none',
}

function OnboardingCompleteCard({
  title,
  url,
  Icon,
  backgroundColor,
  color,
  disabled,
}: OnboardingCompleteCardProps): JSX.Element {
  return (
    <Link rel="noopener noreferrer" style={{ ...linkStyles }} target="_blank" to={url}>
      <Stack
        alignItems="flex-start"
        backgroundColor={backgroundColor}
        borderColor="$surface3"
        borderRadius="$rounded20"
        borderWidth={1}
        cursor={disabled ? 'not-allowed' : 'pointer'}
        display="flex"
        height={100}
        justifyContent="space-between"
        padding="$spacing16"
        width={200}>
        {Icon}
        <Text color={color} textDecorationLine="none" variant="subheadSmall">
          {title}
        </Text>
      </Stack>
    </Link>
  )
}
