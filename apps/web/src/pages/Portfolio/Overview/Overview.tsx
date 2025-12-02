import { OverviewActionTiles } from 'pages/Portfolio/Overview/ActionTiles'
import { OverviewStatsTiles } from 'pages/Portfolio/Overview/StatsTiles'
import { Flex, Separator, styled, Text, useMedia } from 'ui/src'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'

const ACTION_TILE_SECTION_WIDTH = 360

const ActionsAndStatsContainer = styled(Flex, {
  width: ACTION_TILE_SECTION_WIDTH,
  gap: '$spacing16',
  variants: {
    fullWidth: {
      true: {
        width: '100%',
      },
      false: {
        width: ACTION_TILE_SECTION_WIDTH,
      },
    },
  } as const,
})

export function PortfolioOverview() {
  const media = useMedia()
  const isFullWidth = media.xl

  return (
    <Trace logImpression page={InterfacePageName.PortfolioOverviewPage}>
      <Flex gap="$spacing40">
        <Flex row gap="$spacing40" $xl={{ flexDirection: 'column' }}>
          <Flex grow backgroundColor="$surface3" borderRadius="$rounded8" centered minHeight={200}>
            <Text>Chart</Text>
          </Flex>
          <ActionsAndStatsContainer fullWidth={isFullWidth}>
            <OverviewActionTiles />
            <OverviewStatsTiles />
          </ActionsAndStatsContainer>
        </Flex>

        <Separator />
      </Flex>
    </Trace>
  )
}
