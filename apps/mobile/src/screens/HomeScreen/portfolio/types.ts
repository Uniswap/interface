import type { Dispatch, SetStateAction } from 'react'
import type { TabLabelProps } from 'src/components/layout/TabHelpers'
import type { useNftListRenderData } from 'uniswap/src/components/nfts/hooks/useNftListRenderData'
import { SectionName } from 'uniswap/src/features/telemetry/constants'

export type NftTabRenderData = Omit<ReturnType<typeof useNftListRenderData>, 'onListEndReached' | 'numShown'>

/** Stable identity for each home portfolio tab, decoupled from display order and telemetry identifiers. */
export enum HomeTab {
  Tokens = 'tokens',
  Pools = 'pools',
  NFTs = 'nfts',
  Explore = 'explore',
}

/** Telemetry section for each tab, kept separate from `HomeTab` so identity isn't tied to analytics. */
export const HOME_TAB_SECTION_NAME: Record<HomeTab, SectionName> = {
  [HomeTab.Tokens]: SectionName.HomeTokensTab,
  [HomeTab.Pools]: SectionName.HomePoolsTab,
  [HomeTab.NFTs]: SectionName.HomeNFTsTab,
  [HomeTab.Explore]: SectionName.HomeExploreTab,
}

export type HomeRoute = {
  key: HomeTab
  title: string
} & Pick<TabLabelProps, 'textStyleType'>

type FeedListRowId = 'portfolio' | 'tabBar' | 'tabBody'
export type FeedListRow = { id: FeedListRowId }

export type ScrollWindowRange = { start: number; end: number }

/** Props passed from HomeScreen into HomeScreenPortfolio. */
export interface HomeScreenPortfolioProps {
  isLayoutReady: boolean
  setIsLayoutReady: Dispatch<SetStateAction<boolean>>
}
