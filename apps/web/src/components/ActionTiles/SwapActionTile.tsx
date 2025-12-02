import { ActionTileWithIconAnimation } from 'components/ActionTiles/ActionTileWithIconAnimation'
import { useTranslation } from 'react-i18next'
import { SwapDotted } from 'ui/src/components/icons/SwapDotted'
import { FlexProps } from 'ui/src/components/layout/Flex'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useEvent } from 'utilities/src/react/hooks'

export function SwapActionTile({ padding = '$spacing12' }: { padding?: FlexProps['p'] }) {
  const { t } = useTranslation()
  const { navigateToSwapFlow } = useUniswapContext()

  const onPressSwap = useEvent(() => {
    navigateToSwapFlow({})
  })

  return (
    <ActionTileWithIconAnimation
      dataTestId={TestID.PortfolioActionTileSwap}
      Icon={SwapDotted}
      name={t('common.swap')}
      onClick={onPressSwap}
      padding={padding}
    />
  )
}
