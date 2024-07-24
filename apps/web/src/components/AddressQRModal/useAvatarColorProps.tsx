import useENSAvatar from 'hooks/useENSAvatar'
import { useMemo } from 'react'
import {
  GradientProps,
  getUniconColors,
  passesContrast,
  useExtractedColors,
  useIsDarkMode,
  useSporeColors,
} from 'ui/src'
import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'

// Fetches avatar for address, in priority uses: unitag avatar, ens avatar, undefined
//  Note that this hook is used instead of just useENSAvatar because our implementation
//  of useENSAvatar checks for reverse name resolution which Unitags does not support.
//  Chose to do this because even if we used useENSAvatar without reverse name resolution,
//  there is more latency because it has to go to the contract via CCIP-read first.
function useAvatar(address: string | undefined): {
  avatar: Maybe<string>
  loading: boolean
} {
  const { unitag, loading: unitagLoading } = useUnitagByAddress(address)
  const { avatar: ensAvatar, loading: ensLoading } = useENSAvatar(address)
  const unitagAvatar = unitag?.metadata?.avatar

  if (!address) {
    return { loading: false, avatar: undefined }
  }

  if (unitagAvatar) {
    return { avatar: unitagAvatar, loading: false }
  }

  if (ensAvatar) {
    return { avatar: ensAvatar, loading: false }
  }

  return { avatar: undefined, loading: ensLoading || unitagLoading }
}

type AvatarColors = {
  primary: string
  base: string
  detail: string
}

type ColorProps = {
  smartColor: string
  gradientProps: GradientProps
}

export const useAvatarColorProps = (address: Address): ColorProps => {
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()
  const { color: uniconColor } = getUniconColors(address, isDarkMode) as { color: string }
  const { avatar, loading: avatarLoading } = useAvatar(address)
  const { colors: avatarColors } = useExtractedColors(avatar) as { colors: AvatarColors }
  const hasAvatar = !!avatar && !avatarLoading

  const smartColor: string = useMemo<string>(() => {
    const contrastThreshold = 3 // WCAG AA standard for contrast
    const backgroundColor = colors.surface2.val // replace with your actual background color

    if (hasAvatar && avatarColors && avatarColors.primary) {
      if (passesContrast(avatarColors.primary, backgroundColor, contrastThreshold)) {
        return avatarColors.primary
      }
      if (passesContrast(avatarColors.base, backgroundColor, contrastThreshold)) {
        return avatarColors.base
      }
      if (passesContrast(avatarColors.detail, backgroundColor, contrastThreshold)) {
        return avatarColors.detail
      }
      // Modify the color if it doesn't pass the contrast check
      // Replace 'modifiedColor' with the actual color you want to use
      return colors.neutral1.val as string
    }
    return uniconColor
  }, [avatarColors, hasAvatar, uniconColor, colors.surface2.val, colors.neutral1.val])

  return { smartColor, gradientProps: {} }
}
