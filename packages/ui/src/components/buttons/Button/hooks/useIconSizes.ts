import { useMemo } from 'react'
import { getTokenValue } from 'tamagui'
import { TypeOfButton } from 'ui/src/components/buttons/Button/components/types'
import { lineHeights } from 'ui/src/components/buttons/Button/constants'
import { ButtonProps } from 'ui/src/components/buttons/Button/types'
import { getLineHeightForButtonFontTokenKey } from 'ui/src/components/buttons/Button/utils/getLineHeightForButtonFontTokenKey'
import { IconButtonProps } from 'ui/src/components/buttons/IconButton/IconButton'

type Size = NonNullable<ButtonProps['size'] | IconButtonProps['size']>

// These are special as they're mapped to the size of the font within the button
const getIconSizesForButton = (): Record<Size, number> => ({
  xxsmall: getLineHeightForButtonFontTokenKey(lineHeights.xxsmall),
  xsmall: getLineHeightForButtonFontTokenKey(lineHeights.xsmall),
  small: getLineHeightForButtonFontTokenKey(lineHeights.small),
  medium: getLineHeightForButtonFontTokenKey(lineHeights.medium),
  large: getLineHeightForButtonFontTokenKey(lineHeights.large),
})

// These are more straightforward
const getIconSizesForIconButton = (): Record<Size, number> => ({
  xxsmall: getTokenValue('$icon.16'),
  xsmall: getTokenValue('$icon.16'),
  small: getTokenValue('$icon.20'),
  medium: getTokenValue('$icon.24'),
  large: getTokenValue('$icon.24'),
})

// We declare this because there could potentially be a race condition where `getConfig()` is called before the tamagui config is initialized
// So, we create `getIconSizes` and wrap is with `useMemo` so it's used when the component actually needs it
export const useIconSizes = (
  typeOfButton: TypeOfButton,
): ReturnType<typeof getIconSizesForButton | typeof getIconSizesForIconButton> =>
  useMemo(() => {
    if (typeOfButton === 'button') {
      return getIconSizesForButton()
    }

    return getIconSizesForIconButton()
  }, [typeOfButton])
