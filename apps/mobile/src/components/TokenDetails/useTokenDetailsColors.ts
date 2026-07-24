import { useExtractedTokenColor, useIsDarkMode, useSporeColors } from 'ui/src'
import {
  useTokenBasicInfoPartsFragment,
  useTokenBasicProjectPartsFragment,
} from 'uniswap/src/data/graphql/uniswap-data-api/fragments'
import { useTokenMetadata } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'

export function useTokenDetailsColors({ currencyId }: { currencyId: string }): {
  tokenColor: Nullable<string>
  tokenColorLoading: boolean
} {
  const isDarkMode = useIsDarkMode()
  const colors = useSporeColors()

  const token = useTokenBasicInfoPartsFragment({ currencyId }).data
  const project = useTokenBasicProjectPartsFragment({ currencyId }).data.project
  const metadata = useTokenMetadata(currencyId, {
    legacyToken: { symbol: token.symbol, project: { logoUrl: project?.logoUrl } },
  })

  const { tokenColor, tokenColorLoading } = useExtractedTokenColor({
    imageUrl: metadata.logoUrl,
    tokenName: metadata.symbol,
    backgroundColor: colors.surface1.val,
    defaultColor: colors.neutral3.val,
  })

  return {
    tokenColor: tokenColor ? tokenColor : isDarkMode ? colors.neutral3.val : colors.surface3.val,
    tokenColorLoading,
  }
}
