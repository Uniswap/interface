import type { Dispatch, SetStateAction } from 'react'
import type { TabLabelProps } from 'src/components/layout/TabHelpers'
import type { useNftListRenderData } from 'uniswap/src/components/nfts/hooks/useNftListRenderData'
import type { SectionName } from 'uniswap/src/features/telemetry/constants'

export type NftListRenderData = ReturnType<typeof useNftListRenderData>

export type HomeRoute = {
  key: SectionName
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
