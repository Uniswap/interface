import { useMemo } from 'react'
import { lineHeights } from 'ui/src/components/buttons/Button/constants'
import { getLineHeightForButtonFontTokenKey } from 'ui/src/components/buttons/Button/utils/getLineHeightForButtonFontTokenKey'

const getIconSizes = () =>
  ({
    xxsmall: getLineHeightForButtonFontTokenKey(lineHeights.xxsmall),
    xsmall: getLineHeightForButtonFontTokenKey(lineHeights.xsmall),
    small: getLineHeightForButtonFontTokenKey(lineHeights.small),
    medium: getLineHeightForButtonFontTokenKey(lineHeights.medium),
    large: getLineHeightForButtonFontTokenKey(lineHeights.large),
  }) as const

// We declare this because there could potentially be a race condition where `getConfig()` is called before the tamagui config is initialized
// So, we create `getIconSizes` and wrap is with `useMemo` so it's used when the component actually needs it
export const useIconSizes = (): ReturnType<typeof getIconSizes> => useMemo(() => getIconSizes(), [])
