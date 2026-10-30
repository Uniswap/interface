import { useExtractedTokenColor } from '@universe/mycelium'
import { useIsDarkMode, useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { useTokenMetadata } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'

export function useTokenDetailsColors({ currencyId }: { currencyId: string }): {
  tokenColor: Nullable<string>
  tokenColorLoading: boolean
} {
  const isDarkMode = useIsDarkMode()
  const colors = useSporeColors()
  const metadata = useTokenMetadata(currencyId)

  const { tokenColor, tokenColorLoading } = useExtractedTokenColor({
    imageUrl: metadata.logoUrl,
    tokenName: metadata.symbol,
    backgroundColor: colors.surface1.val,
    defaultColor: colors.neutral3.val,
    colorOverrides: metadata.colorOverrides,
  })

  return {
    tokenColor: tokenColor ? tokenColor : isDarkMode ? colors.neutral3.val : colors.surface3.val,
    tokenColorLoading,
  }
}
