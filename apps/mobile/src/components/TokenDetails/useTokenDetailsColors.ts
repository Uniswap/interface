import { useExtractedTokenColor, useIsDarkMode, useSporeColors } from 'ui/src'
import {
  useTokenBasicInfoPartsFragment,
  useTokenBasicProjectPartsFragment,
} from 'uniswap/src/data/graphql/uniswap-data-api/fragments'

export function useTokenDetailsColors({ currencyId }: { currencyId: string }): {
  tokenColor: Nullable<string>
  tokenColorLoading: boolean
} {
  const isDarkMode = useIsDarkMode()
  const colors = useSporeColors()

  const token = useTokenBasicInfoPartsFragment({ currencyId }).data
  const project = useTokenBasicProjectPartsFragment({ currencyId }).data.project

  const { tokenColor, tokenColorLoading } = useExtractedTokenColor(
    project?.logoUrl,
    token?.symbol,
    /*background=*/ colors.surface1.val,
    /*default=*/ colors.neutral3.val,
  )

  return {
    tokenColor: tokenColor ? tokenColor : isDarkMode ? colors.neutral3.val : colors.surface3.val,
    tokenColorLoading,
  }
}
