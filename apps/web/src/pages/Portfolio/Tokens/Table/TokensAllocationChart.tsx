import {
  PercentageAllocationChart,
  PercentageAllocationItem,
} from 'components/PercentageAllocationChart/PercentageAllocationChart'
import { TokenData } from 'pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { useMemo } from 'react'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

interface TokenBreakdown {
  currencyInfo: CurrencyInfo | null
  percentage: number
  color: string
}

// Generate portfolio breakdown from tokens data
function generatePortfolioBreakdown(tokens: TokenData[], totalValue: number): TokenBreakdown[] {
  // Calculate percentages for all tokens (individual network instances)
  const allTokens = tokens.map((token, index) => {
    const tokenValue = token.value

    return {
      ...token,
      percentage: Number.parseFloat(((tokenValue / totalValue) * 100).toFixed(3)),
      color: getTokenColor(index),
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

function getTokenColor(index: number): string {
  const colors = [
    '#10B981', // Green
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
  ]
  return colors[index % colors.length]
}

export function TokensAllocationChart({ tokenData }: { tokenData: TokenData[] }): JSX.Element {
  const totalPortfolioValue = useMemo(() => {
    return tokenData.reduce((sum, token) => sum + token.value, 0)
  }, [tokenData])

  const portfolioBreakdown = generatePortfolioBreakdown(tokenData, totalPortfolioValue)

  // Convert portfolio breakdown to generic chart items
  const chartItems: PercentageAllocationItem[] = useMemo(() => {
    return portfolioBreakdown.map((token, i) => {
      const label = token.currencyInfo?.currency.symbol || 'Unknown'
      const id = token.currencyInfo?.currencyId || `token-${i}`

      const icon = token.currencyInfo ? (
        <NetworkLogo key={id} chainId={token.currencyInfo.currency.chainId} size={iconSizes.icon12} />
      ) : undefined

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
