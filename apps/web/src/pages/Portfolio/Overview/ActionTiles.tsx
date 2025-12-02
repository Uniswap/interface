import { BuyActionTile } from 'components/ActionTiles/BuyActionTile'
import { MoreActionTile } from 'components/ActionTiles/MoreActionTile'
import { SendActionTile } from 'components/ActionTiles/SendActionTile/SendActionTile'
import { SwapActionTile } from 'components/ActionTiles/SwapActionTile'
import { Flex, styled, useMedia } from 'ui/src'

const ACTION_TILE_SECTION_WIDTH = 360
const ACTION_TILE_GAP = 12
const ACTION_TILE_WIDTH = `calc(50% - ${ACTION_TILE_GAP / 2}px)`

const ActionTilesContainer = styled(Flex, {
  flexDirection: 'row',
  gap: '$spacing12',
  flexWrap: 'wrap',
  width: ACTION_TILE_SECTION_WIDTH,
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

export function OverviewActionTiles() {
  const media = useMedia()
  const isSingleRow = !!media.xl && !media.md

  return (
    <ActionTilesContainer singleRow={isSingleRow}>
      <ActionTileWrapper singleRow={isSingleRow}>
        <SwapActionTile padding="$spacing16" />
      </ActionTileWrapper>
      <ActionTileWrapper singleRow={isSingleRow}>
        <BuyActionTile padding="$spacing16" />
      </ActionTileWrapper>
      <ActionTileWrapper singleRow={isSingleRow}>
        <SendActionTile padding="$spacing16" />
      </ActionTileWrapper>
      <ActionTileWrapper singleRow={isSingleRow}>
        <MoreActionTile padding="$spacing16" />
      </ActionTileWrapper>
    </ActionTilesContainer>
  )
}
