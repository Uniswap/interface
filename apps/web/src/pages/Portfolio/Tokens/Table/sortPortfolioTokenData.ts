import type { TokenData } from '~/pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { PortfolioTokenSortMethod } from '~/pages/Portfolio/Tokens/Table/portfolioTokenTableSortStore'

function getSortValue(token: TokenData, sortMethod: PortfolioTokenSortMethod): number | undefined {
  switch (sortMethod) {
    case PortfolioTokenSortMethod.VALUE:
      return token.totalValue
    case PortfolioTokenSortMethod.PRICE:
      return token.price
    case PortfolioTokenSortMethod.CHANGE_1D:
      return token.change1d
    case PortfolioTokenSortMethod.BALANCE:
      return token.quantity
    case PortfolioTokenSortMethod.ALLOCATION:
      return token.allocation
    case PortfolioTokenSortMethod.AVG_COST:
      return token.avgCost
    case PortfolioTokenSortMethod.UNREALIZED_PNL:
      return token.unrealizedPnl
    default:
      return undefined
  }
}

export function sortPortfolioTokenData(
  data: TokenData[],
  { sortMethod, sortAscending }: { sortMethod: PortfolioTokenSortMethod; sortAscending: boolean },
): TokenData[] {
  return [...data].sort((a, b) => {
    const aVal = getSortValue(a, sortMethod)
    const bVal = getSortValue(b, sortMethod)

    // Push undefined values to the end regardless of sort direction
    if (aVal === undefined && bVal === undefined) {
      return 0
    }
    if (aVal === undefined) {
      return 1
    }
    if (bVal === undefined) {
      return -1
    }

    const diff = aVal - bVal
    return sortAscending ? diff : -diff
  })
}
