import { PropsWithChildren } from 'react'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { TokenMenuActionType } from 'uniswap/src/features/portfolio/balances/hooks/useTokenContextMenuOptions'
import { PlatformSplitStubError } from 'utilities/src/errors'

export interface TokenBalanceItemContextMenuProps {
  portfolioBalance: PortfolioBalance
  excludedActions?: TokenMenuActionType[]
  openContractAddressExplainerModal?: () => void
  openReportTokenModal: () => void
  copyAddressToClipboard?: (address: string) => Promise<void>
  triggerMode?: ContextMenuTriggerMode
  onPressToken?: () => void
}

export function TokenBalanceItemContextMenu(_props: PropsWithChildren<TokenBalanceItemContextMenuProps>): JSX.Element {
  throw new PlatformSplitStubError('TokenBalanceItemContextMenu')
}
