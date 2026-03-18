import { useMemo } from 'react'
import { useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import {
  PercentageAllocationChart,
  PercentageAllocationItem,
} from '~/components/PercentageAllocationChart/PercentageAllocationChart'
import { useSrcColor } from '~/hooks/useColor'
import { TokenData } from '~/pages/Portfolio/Tokens/hooks/useTransformTokenTableData'

const MAX_TOKENS_FOR_EXTRACTED_COLOR = 15

type TokenBreakdown = TokenData & { percentage: number; color: string }

/** Returns extracted token colors for visible tokens; uses gray when not yet available. */
function useExtractedTokenColors(tokenData: TokenData[]): string[] {
  const colors = useSporeColors()
  const gray = colors.neutral3.val

  const results = Array.from({ length: MAX_TOKENS_FOR_EXTRACTED_COLOR }, (_, i) =>
    // biome-ignore lint/correctness/useHookAtTopLevel: fixed-length loop, same 15 hook calls every render
    useSrcColor({
      src: tokenData[i]?.currencyInfo?.logoUrl ?? undefined,
      currencyName: tokenData[i]?.currencyInfo?.currency?.name,
    }),
  )

  // Snapshot with value-based deps so reference is stable when colors/loading unchanged
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally depend on primitive key so snapshot is stable for downstream memo
  const resultsSnapshot = useMemo(
    () => results.map((r) => ({ tokenColor: r.tokenColor, tokenColorLoading: r.tokenColorLoading })),
    [gray, results.map((r) => `${r.tokenColor ?? ''}-${r.tokenColorLoading}`).join('|')],
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: value-based deps (length + snapshot) so returned array is stable and portfolioBreakdown memo can cache
  return useMemo(
    () =>
      tokenData.map((_, i) => {
        if (i >= MAX_TOKENS_FOR_EXTRACTED_COLOR) {
          return gray
        }
        const { tokenColor, tokenColorLoading } = resultsSnapshot[i]
        if (tokenColorLoading || tokenColor == null) {
          return gray
        }
        return tokenColor
      }),
    [gray, tokenData.length, resultsSnapshot],
  )
}

// Generate portfolio breakdown from tokens data
function generatePortfolioBreakdown({
  tokens,
  totalValue,
  tokenColors,
}: {
  tokens: TokenData[]
  totalValue: number
  tokenColors: string[]
}): TokenBreakdown[] {
  // Calculate percentages for all tokens (individual network instances)
  const allTokens = tokens.map((token, index) => {
    const tokenValue = token.totalValue

    return {
      ...token,
      percentage: Number.parseFloat(((tokenValue / totalValue) * 100).toFixed(3)),
      color: tokenColors[index],
    }
  })

  // Normalize percentages to ensure they add up to exactly 100%
  const totalPercentage = allTokens.reduce((sum, token) => sum + token.percentage, 0)
  if (totalPercentage > 0) {
    return allTokens.map((token) => ({
      ...token,
      percentage: (token.percentage / totalPercentage) * 100,
    }))
  }

  return allTokens
}

export function TokensAllocationChart({ tokenData }: { tokenData: TokenData[] }): JSX.Element {
  const tokenColors = useExtractedTokenColors(tokenData)
  const totalPortfolioValue = useMemo(() => {
    return tokenData.reduce((sum, token) => sum + token.totalValue, 0)
  }, [tokenData])

  const portfolioBreakdown = useMemo(
    () => generatePortfolioBreakdown({ tokens: tokenData, totalValue: totalPortfolioValue, tokenColors }),
    [tokenData, totalPortfolioValue, tokenColors],
  )

  const chartItems: PercentageAllocationItem[] = useMemo(() => {
    return portfolioBreakdown.map((token) => {
      const label = token.symbol || 'Unknown'
      const id = token.currencyInfo.currencyId

      const icon = <NetworkLogo key={id} chainId={token.currencyInfo.currency.chainId} size={iconSizes.icon12} />

      return {
        id,
        percentage: token.percentage,
        color: token.color,
        label,
        icon,
      }
    })
  }, [portfolioBreakdown])

  return <PercentageAllocationChart items={chartItems} />
}
