import { ActionTileWithIconAnimation } from 'components/ActionTiles/ActionTileWithIconAnimation'
import { useTranslation } from 'react-i18next'
import { CoinConvert } from 'ui/src/components/icons/CoinConvert'
import { FlexProps } from 'ui/src/components/layout/Flex'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useEvent } from 'utilities/src/react/hooks'

export function SwapActionTile({ padding = '$spacing12' }: { padding?: FlexProps['p'] }) {
  const { t } = useTranslation()
  const { navigateToSwapFlow } = useUniswapContext()

  const onPressSwap = useEvent(() => {
    navigateToSwapFlow({})
  })

  return (
    <Trace logPress element={ElementName.PortfolioActionSwap}>
      <ActionTileWithIconAnimation
        dataTestId={TestID.PortfolioActionTileSwap}
        Icon={CoinConvert}
        name={t('common.swap')}
        onClick={onPressSwap}
        padding={padding}
      />
    </Trace>
  )
}
