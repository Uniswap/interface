import { useTranslation } from 'react-i18next'
import { Button, Flex } from 'ui/src'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import {
  BUTTON_AREA_WIDTH,
  PositionsEmptyStateLayout,
} from '~/features/Liquidity/components/emptyStates/PositionsEmptyStateLayout'

export function EmptyPositionsView({
  newPositionHref,
  withBorder,
  showNewPositionAction = true,
}: {
  newPositionHref: string
  withBorder?: boolean
  showNewPositionAction?: boolean
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <PositionsEmptyStateLayout
      title={t('positions.noPositions.title')}
      description={t('positions.noPositions.description')}
      withBorder={withBorder}
      action={
        <Flex row gap="$gap8" $md={{ flexDirection: 'column', width: '100%' }} width={BUTTON_AREA_WIDTH}>
          <Trace logPress element={ElementName.PositionsEmptyStateExplorePools}>
            <Button
              $md={{
                py: '$spacing16',
              }}
              variant="default"
              size="small"
              emphasis="secondary"
              tag="a"
              href="/explore/pools"
              $platform-web={{
                textDecoration: 'none',
              }}
            >
              {t('pools.explore')}
            </Button>
          </Trace>
          {showNewPositionAction && (
            <Trace logPress element={ElementName.PositionsEmptyStateNewPosition}>
              <Button
                $md={{
                  py: '$spacing16',
                }}
                variant="default"
                size="small"
                tag="a"
                href={newPositionHref}
                $platform-web={{
                  textDecoration: 'none',
                }}
              >
                {t('position.new')}
              </Button>
            </Trace>
          )}
        </Flex>
      }
    />
  )
}
