import { Flex as MyceliumFlex, useMedia } from '@universe/mycelium'
import { styled } from '@universe/mycelium/styled'
import { TestID } from '@universe/test'
import { memo } from 'react'
import { BuyActionTile } from '~/components/ActionTiles/BuyActionTile'
import { CopyAddressActionTile } from '~/components/ActionTiles/CopyAddressActionTile'
import { MoreActionTile } from '~/components/ActionTiles/MoreActionTile'
import { ReceiveActionTile } from '~/components/ActionTiles/ReceiveActionTile'
import { SendActionTile } from '~/components/ActionTiles/SendActionTile/SendActionTile'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'

const ACTION_TILE_GAP = 12
const ACTION_TILE_WIDTH = `calc(50% - ${ACTION_TILE_GAP / 2}px)`

const ACTION_TILES_CONTAINER_VARIANTS = {
  singleRow: { true: 'flex-nowrap w-[100%]', false: '' },
} as const

// 12px gap and 360px (OVERVIEW_RIGHT_COLUMN_WIDTH) width inlined as literals — factory classes
// must be scanner-visible.
const ActionTilesContainer = styled(MyceliumFlex, {
  platform: 'web',
  base: 'flex-row flex-wrap gap-[12px] w-[360px] media-md:w-[100%]',
  variants: ACTION_TILES_CONTAINER_VARIANTS,
})

const ACTION_TILE_WRAPPER_VARIANTS = {
  singleRow: { true: 'basis-[0px] grow-[1] w-[auto]', false: '' },
} as const

const ActionTileWrapper = styled(MyceliumFlex, {
  variants: ACTION_TILE_WRAPPER_VARIANTS,
  // The calc() width is a constructed value, so it rides the inline lane (never a built class);
  // gated off when singleRow's w-[auto] class must win, since inline style beats classes.
  inlineStyle: ({ singleRow }) => (singleRow === true ? undefined : { width: ACTION_TILE_WIDTH }),
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
