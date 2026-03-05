import { memo } from 'react'
import { Flex, styled, useMedia } from 'ui/src'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { BuyActionTile } from '~/components/ActionTiles/BuyActionTile'
import { CopyAddressActionTile } from '~/components/ActionTiles/CopyAddressActionTile'
import { MoreActionTile } from '~/components/ActionTiles/MoreActionTile'
import { ReceiveActionTile } from '~/components/ActionTiles/ReceiveActionTile'
import { SendActionTile } from '~/components/ActionTiles/SendActionTile/SendActionTile'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { OVERVIEW_RIGHT_COLUMN_WIDTH } from '~/pages/Portfolio/Overview/constants'

const ACTION_TILE_GAP = 12
const ACTION_TILE_WIDTH = `calc(50% - ${ACTION_TILE_GAP / 2}px)`

const ActionTilesContainer = styled(Flex, {
  flexDirection: 'row',
  gap: ACTION_TILE_GAP,
  flexWrap: 'wrap',
  width: OVERVIEW_RIGHT_COLUMN_WIDTH,
  $md: { width: '100%' },
  variants: {
    singleRow: {
      true: {
        width: '100%',
        flexWrap: 'nowrap',
      },
    },
  } as const,
})

const ActionTileWrapper = styled(Flex, {
  width: ACTION_TILE_WIDTH,
  variants: {
    singleRow: {
      true: {
        width: 'auto',
        flexGrow: 1,
        flexBasis: 0,
      },
    },
  } as const,
})

export const OverviewActionTiles = memo(function OverviewActionTiles() {
  const media = useMedia()
  const { isExternalWallet, externalAddress } = usePortfolioRoutes()
  const isSingleRow = !!media.xl && !media.md

  if (isExternalWallet && externalAddress) {
    return (
      <ActionTilesContainer singleRow={isSingleRow} testID={TestID.PortfolioActionTiles}>
        <ActionTileWrapper singleRow={isSingleRow}>
          <SendActionTile
            padding="$spacing16"
            recipient={externalAddress.address}
            dataTestId={TestID.PortfolioActionTileSend}
          />
        </ActionTileWrapper>
        <ActionTileWrapper singleRow={isSingleRow}>
          <CopyAddressActionTile address={externalAddress.address} padding="$spacing16" />
        </ActionTileWrapper>
      </ActionTilesContainer>
    )
  }

  return (
    <ActionTilesContainer singleRow={isSingleRow} testID={TestID.PortfolioActionTiles}>
      <ActionTileWrapper singleRow={isSingleRow}>
        <SendActionTile padding="$spacing16" dataTestId={TestID.PortfolioActionTileSend} />
      </ActionTileWrapper>
      <ActionTileWrapper singleRow={isSingleRow}>
        <ReceiveActionTile padding="$spacing16" dataTestId={TestID.PortfolioActionTileReceive} />
      </ActionTileWrapper>
      <ActionTileWrapper singleRow={isSingleRow}>
        <BuyActionTile padding="$spacing16" />
      </ActionTileWrapper>
      <ActionTileWrapper singleRow={isSingleRow}>
        <MoreActionTile padding="$spacing16" />
      </ActionTileWrapper>
    </ActionTilesContainer>
  )
})
